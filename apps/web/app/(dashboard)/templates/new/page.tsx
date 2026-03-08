"use client";
import { useState, useCallback } from "react";
import type { WordSchema } from "@/lib/engine/word-ingestion";
import { SchemaBuilder } from "@/components/templates/SchemaBuilder";
import { UploadZone } from "@/components/templates/UploadZone";

type Step = "upload" | "review" | "done";

function saveTemplateToLocalStorage(schema: WordSchema, templateB64: string) {
  const existing = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
  const newTemplate = {
    id: crypto.randomUUID(),
    schema,
    templateB64,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem("milaf_templates", JSON.stringify([...existing, newTemplate]));
  return newTemplate.id;
}

export default function NewTemplatePage() {
  const [step, setStep] = useState<Step>("upload");
  const [schema, setSchema] = useState<WordSchema | null>(null);
  const [templateB64, setTemplateB64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = (e) => res((e.target?.result as string).split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      setTemplateB64(b64);

      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name.replace(/\.docx$/i, "").replace(/[-_]/g, " "));

      const res = await fetch("/api/templates/ingest", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur d'ingestion");
      if (json.schema.fieldCount === 0) throw new Error("Aucune balise {{champ}} détectée. Ajoutez des balises dans votre Word et réessayez.");

      setSchema(json.schema);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = useCallback((updatedSchema: WordSchema) => {
    if (!templateB64) return;
    saveTemplateToLocalStorage(updatedSchema, templateB64);
    setStep("done");
  }, [templateB64]);

  const steps = [
    { id: "upload", label: "Upload .docx" },
    { id: "review", label: "Configurer les champs" },
    { id: "done", label: "Prêt" },
  ];
  const stepOrder = steps.map(s => s.id);
  const currentIdx = stepOrder.indexOf(step);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6b7290] mb-6">
        <a href="/templates" className="hover:text-white transition-colors">Templates</a>
        <span className="text-[#3a3f5c]">/</span>
        <span className="text-white">Nouveau template</span>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => {
          const isDone = i < currentIdx;
          const isActive = s.id === step;
          return (
            <div key={s.id} className="flex items-center">
              {i > 0 && <div className={`h-px w-8 md:w-14 transition-colors duration-300 ${isDone ? "bg-[#3B5BDB]" : "bg-[#1e2235]"}`} />}
              <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? "text-white" : isDone ? "text-[#3B5BDB]" : "text-[#3a3f5c]"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isActive ? "bg-[#3B5BDB] text-white shadow-[0_0_12px_rgba(59,91,219,0.4)]" :
                  isDone ? "bg-[#3B5BDB]/20 text-[#3B5BDB]" :
                  "bg-[#141624] text-[#3a3f5c] border border-[#1e2235]"
                }`}>
                  {isDone ? "✓" : i + 1}
                </div>
                <span className="hidden md:inline">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/20 border border-red-800/40 rounded-xl text-red-400 text-sm flex gap-3">
          <span className="shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {step === "upload" && <UploadZone onFile={handleFileUpload} loading={loading} />}
      {step === "review" && schema && (
        <SchemaBuilder schema={schema} templateB64={templateB64} onSave={handleSave} />
      )}
      {step === "done" && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl mx-auto mb-5">
            ✓
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Template sauvegardé !</h2>
          <p className="text-[#6b7290] mb-8 max-w-sm mx-auto">
            Votre template est prêt. Générez vos premiers documents maintenant.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/generate" className="px-5 py-2.5 bg-[#3B5BDB] hover:bg-[#3451c7] text-white rounded-xl text-sm font-semibold transition-colors">
              Générer un document →
            </a>
            <a href="/templates" className="px-5 py-2.5 border border-[#1e2235] hover:border-[#3a3f5c] text-[#9ca3af] hover:text-white rounded-xl text-sm font-semibold transition-colors">
              Voir mes templates
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
