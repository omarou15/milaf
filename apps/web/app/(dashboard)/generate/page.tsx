"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { WordSchema, DetectedField } from "@/lib/engine/word-ingestion";

interface StoredTemplate { id: string; schema: WordSchema; templateB64: string; createdAt: string; }

function GenerateContent() {
  const params = useSearchParams();
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [selected, setSelected] = useState<StoredTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");

  useEffect(() => {
    const stored: StoredTemplate[] = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
    setTemplates(stored);
    const id = params.get("id");
    if (id) {
      const t = stored.find(t => t.id === id);
      if (t) { setSelected(t); initForm(t.schema.fields); }
    }
  }, [params]);

  function initForm(fields: DetectedField[]) {
    const init: Record<string,string> = {};
    for (const f of fields) init[f.balise] = "";
    setFormData(init);
  }

  function selectTemplate(t: StoredTemplate) {
    setSelected(t);
    initForm(t.schema.fields);
    setDownloadUrl(null);
    setError(null);
  }

  const handleGenerate = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setDownloadUrl(null);
    try {
      const res = await fetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateBuffer: selected.templateB64,
          schema: selected.schema,
          data: formData,
          skipValidation: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur de génération");
      const bytes = Uint8Array.from(atob(json.buffer), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      setDownloadUrl(URL.createObjectURL(blob));
      setFilename(json.filename);
      const prev = parseInt(localStorage.getItem("milaf_docs_count") || "0");
      localStorage.setItem("milaf_docs_count", String(prev + 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [selected, formData]);

  const groups = selected ? [...new Set(selected.schema.fields.map(f => f.group))] : [];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Générer un document</h1>
      <p className="text-[#6b7290] text-sm mb-8">Remplissez les champs et téléchargez votre document généré</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: template selector */}
        <div className="lg:col-span-1">
          <div className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider mb-3">Template</div>
          {templates.length === 0 ? (
            <div className="bg-[#0d0f18] border border-dashed border-[#1e2235] rounded-xl p-6 text-center">
              <p className="text-[#6b7290] text-sm mb-3">Aucun template</p>
              <a href="/templates/new" className="text-[#3B5BDB] text-sm hover:underline">Créer un template →</a>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map(t => (
                <button key={t.id} onClick={() => selectTemplate(t)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${selected?.id === t.id ? "border-[#3B5BDB] bg-[#3B5BDB]/10 text-white" : "border-[#181c2c] bg-[#0d0f18] text-[#9ca3af] hover:border-[#252a40] hover:text-white"}`}>
                  <div className="font-medium truncate">{t.schema.templateName}</div>
                  <div className="text-xs opacity-60 mt-0.5">{t.schema.fieldCount} champs</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: form */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-[#0d0f18] border border-dashed border-[#1e2235] rounded-2xl p-12 text-center">
              <div className="text-3xl mb-3">✦</div>
              <p className="text-[#6b7290] text-sm">Sélectionnez un template pour remplir les champs</p>
            </div>
          ) : (
            <div className="bg-[#0d0f18] border border-[#181c2c] rounded-2xl p-6">
              <div className="text-sm font-semibold text-white mb-5">{selected.schema.templateName}</div>

              {groups.map(group => (
                <div key={group} className="mb-6">
                  <div className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider mb-3 capitalize">{group}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selected.schema.fields.filter(f => f.group === group).map(field => (
                      <div key={field.balise}>
                        <label className="text-xs text-[#9ca3af] mb-1.5 block">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <input
                          type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                          value={formData[field.balise] ?? ""}
                          onChange={e => setFormData(prev => ({ ...prev, [field.balise]: e.target.value }))}
                          placeholder={field.hint ?? `{{${field.balise}}}`}
                          className="w-full bg-[#141624] border border-[#1e2235] focus:border-[#3B5BDB] rounded-lg px-3 py-2 text-sm text-white placeholder-[#3a3f5c] outline-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {error && (
                <div className="mb-4 p-3 bg-red-950/20 border border-red-800/40 rounded-xl text-red-400 text-sm">⚠ {error}</div>
              )}

              {downloadUrl ? (
                <div className="flex gap-3">
                  <a href={downloadUrl} download={filename}
                    className="flex-1 text-center px-5 py-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-semibold transition-colors hover:bg-emerald-600/30">
                    ⬇ Télécharger {filename}
                  </a>
                  <button onClick={() => { setDownloadUrl(null); setError(null); }}
                    className="px-4 py-3 border border-[#1e2235] text-[#6b7290] hover:text-white rounded-xl text-sm transition-colors">
                    Nouveau
                  </button>
                </div>
              ) : (
                <button onClick={handleGenerate} disabled={loading}
                  className="w-full px-5 py-3 bg-[#3B5BDB] hover:bg-[#3451c7] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(59,91,219,0.2)]">
                  {loading ? "Génération en cours…" : "✦ Générer le document"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-8 text-[#6b7290]">Chargement…</div>}>
      <GenerateContent />
    </Suspense>
  );
}
