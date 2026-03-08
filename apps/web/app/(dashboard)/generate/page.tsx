"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { WordSchema, DetectedField } from "@/lib/engine/word-ingestion";
import type { PdfSchema, PdfFormField } from "@/lib/engine/pdf-ingestion";

type AnySchema = WordSchema | PdfSchema;
interface StoredTemplate { id: string; schema: AnySchema; templateB64: string; createdAt: string; }

const TIER_COLORS: Record<string,string> = { tier1_word:"#3B5BDB", tier2_pdf_form:"#2ee8c8", tier3_pixel:"#a16ef8" };
const TIER_LABELS: Record<string,string> = { tier1_word:"Word T1", tier2_pdf_form:"PDF T2", tier3_pixel:"Pixel T3" };

function isWordSchema(s: AnySchema): s is WordSchema { return s.tier === "tier1_word"; }
function isPdfSchema(s: AnySchema): s is PdfSchema { return s.tier === "tier2_pdf_form"; }

function getFields(schema: AnySchema): Array<{ key: string; label: string; group: string; type: string; options?: string[]; hint?: string }> {
  if (isWordSchema(schema)) {
    return schema.fields.map((f: DetectedField) => ({
      key: f.balise, label: f.label, group: f.group, type: f.type, hint: f.hint,
    }));
  }
  if (isPdfSchema(schema)) {
    return schema.fields.map((f: PdfFormField) => ({
      key: f.name, label: f.label, group: f.group, type: f.type, options: f.options,
    }));
  }
  return [];
}

function GenerateContent() {
  const params = useSearchParams();
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [selected, setSelected] = useState<StoredTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string|null>(null);
  const [downloadMime, setDownloadMime] = useState("application/octet-stream");
  const [filename, setFilename] = useState("");
  const [fillStats, setFillStats] = useState<{ filled: number; skipped: string[] } | null>(null);

  useEffect(() => {
    const stored: StoredTemplate[] = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
    setTemplates(stored);
    const id = params.get("id");
    if (id) { const t = stored.find(t => t.id === id); if (t) { setSelected(t); initForm(t.schema); } }
  }, [params]);

  function initForm(schema: AnySchema) {
    const init: Record<string,string> = {};
    for (const f of getFields(schema)) init[f.key] = "";
    setFormData(init);
    setDownloadUrl(null);
    setFillStats(null);
    setError(null);
  }

  function selectTemplate(t: StoredTemplate) { setSelected(t); initForm(t.schema); }

  const handleGenerate = useCallback(async () => {
    if (!selected) return;
    setLoading(true); setError(null); setDownloadUrl(null); setFillStats(null);
    try {
      const schema = selected.schema;
      const isPdf = isPdfSchema(schema);
      const endpoint = isPdf ? "/api/pdf/generate" : "/api/templates/generate";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateBuffer: selected.templateB64,
          schema,
          data: formData,
          skipValidation: true,
          flattenForm: false,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur de génération");

      const bytes = Uint8Array.from(atob(json.buffer), c => c.charCodeAt(0));
      const mime = isPdf
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const blob = new Blob([bytes], { type: mime });
      setDownloadUrl(URL.createObjectURL(blob));
      setDownloadMime(mime);
      setFilename(json.filename);
      if (isPdf) setFillStats({ filled: json.fieldsFilled, skipped: json.fieldsSkipped ?? [] });

      // Save to localStorage history
      const docs = JSON.parse(localStorage.getItem("milaf_docs") || "[]");
      docs.push({ id: crypto.randomUUID(), templateId: selected.id, filename: json.filename, createdAt: new Date().toISOString() });
      localStorage.setItem("milaf_docs", JSON.stringify(docs));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally { setLoading(false); }
  }, [selected, formData]);

  const fields = selected ? getFields(selected.schema) : [];
  const groups = selected ? [...new Set(fields.map(f => f.group))] : [];
  const color = selected ? (TIER_COLORS[selected.schema.tier] ?? "#3B5BDB") : "#3B5BDB";

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Générer un document</h1>
      <p className="text-[#6b7290] text-sm mb-8">Remplissez les champs et téléchargez votre document généré</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template selector */}
        <div className="lg:col-span-1">
          <div className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider mb-3">Template</div>
          {templates.length === 0 ? (
            <div className="bg-[#0d0f18] border border-dashed border-[#1e2235] rounded-xl p-6 text-center">
              <p className="text-[#6b7290] text-sm mb-3">Aucun template</p>
              <a href="/templates/new" className="text-[#3B5BDB] text-sm hover:underline">Créer →</a>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map(t => {
                const tc = TIER_COLORS[t.schema.tier] ?? "#3B5BDB";
                const tl = TIER_LABELS[t.schema.tier] ?? "";
                return (
                  <button key={t.id} onClick={() => selectTemplate(t)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${selected?.id === t.id ? "text-white" : "border-[#181c2c] bg-[#0d0f18] text-[#9ca3af] hover:border-[#252a40] hover:text-white"}`}
                    style={selected?.id === t.id ? { borderColor: `${tc}60`, background: `${tc}0e` } : {}}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ color: tc, background: `${tc}18` }}>{tl}</span>
                    </div>
                    <div className="font-medium truncate mt-1">{t.schema.templateName}</div>
                    <div className="text-xs opacity-50 mt-0.5">{t.schema.fieldCount} champs</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-[#0d0f18] border border-dashed border-[#1e2235] rounded-2xl p-12 text-center">
              <div className="text-3xl mb-3">✦</div>
              <p className="text-[#6b7290] text-sm">Sélectionnez un template</p>
            </div>
          ) : (
            <div className="bg-[#0d0f18] border border-[#181c2c] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-semibold text-white">{selected.schema.templateName}</div>
                <span className="text-xs px-2 py-0.5 rounded" style={{ color, background: `${color}18` }}>
                  {TIER_LABELS[selected.schema.tier]}
                </span>
              </div>

              {groups.map(group => (
                <div key={group} className="mb-6">
                  <div className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider mb-3 capitalize">{group}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fields.filter(f => f.group === group).map(field => (
                      <div key={field.key}>
                        <label className="text-xs text-[#9ca3af] mb-1.5 block">{field.label}</label>
                        {field.type === "checkbox" ? (
                          <div className="flex items-center gap-2 py-2">
                            <input type="checkbox" id={field.key}
                              checked={["true","1","yes","oui"].includes((formData[field.key]??"").toLowerCase())}
                              onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.checked ? "true" : "false" }))}
                              className="w-4 h-4 accent-current" style={{ accentColor: color }}
                            />
                            <label htmlFor={field.key} className="text-sm text-[#9ca3af]">{field.label}</label>
                          </div>
                        ) : field.options && field.options.length > 0 ? (
                          <select value={formData[field.key]??""} onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                            className="w-full bg-[#141624] border border-[#1e2235] focus:border-[#3B5BDB] rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors">
                            <option value="">Sélectionner…</option>
                            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                            value={formData[field.key]??""}
                            onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.hint ?? field.label}
                            className="w-full bg-[#141624] border border-[#1e2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#3a3f5c] outline-none transition-colors"
                            style={{ "--tw-ring-color": color } as React.CSSProperties}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {error && <div className="mb-4 p-3 bg-red-950/20 border border-red-800/40 rounded-xl text-red-400 text-sm">⚠ {error}</div>}

              {fillStats && (
                <div className="mb-4 p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-xl text-sm">
                  <span className="text-emerald-400">✓ {fillStats.filled} champs remplis</span>
                  {fillStats.skipped.length > 0 && (
                    <span className="text-[#6b7290] ml-3">· {fillStats.skipped.length} ignorés</span>
                  )}
                </div>
              )}

              {downloadUrl ? (
                <div className="flex gap-3">
                  <a href={downloadUrl} download={filename}
                    className="flex-1 text-center px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
                    style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}>
                    ⬇ Télécharger {filename}
                  </a>
                  <button onClick={() => { setDownloadUrl(null); setFillStats(null); }}
                    className="px-4 py-3 border border-[#1e2235] text-[#6b7290] hover:text-white rounded-xl text-sm transition-colors">
                    Nouveau
                  </button>
                </div>
              ) : (
                <button onClick={handleGenerate} disabled={loading}
                  className="w-full px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold rounded-xl transition-all"
                  style={{ background: color, color: selected.schema.tier === "tier2_pdf_form" ? "#0a0d14" : "white" }}>
                  {loading ? "Génération en cours…" : `✦ Générer le document`}
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
