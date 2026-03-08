"use client";
import { useState, useCallback } from "react";
import type { WordSchema, DetectedField } from "@/lib/engine/word-ingestion";
import { SchemaBuilder } from "@/components/templates/SchemaBuilder";
import { UploadZone } from "@/components/templates/UploadZone";

type Step = "upload" | "review" | "done";

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
      // Lecture base64 pour stockage temporaire
      const reader = new FileReader();
      reader.onload = (e) => {
        const b64 = (e.target?.result as string).split(",")[1];
        setTemplateB64(b64);
      };
      reader.readAsDataURL(file);

      // Ingestion via API
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name.replace(/\.docx$/i, ""));

      const res = await fetch("/api/templates/ingest", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Erreur d'ingestion");

      setSchema(json.schema);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = useCallback(async (updatedSchema: WordSchema) => {
    // TODO Sprint 2 : sauvegarder en DB via /api/templates
    console.log("Saving schema:", updatedSchema);
    setStep("done");
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6b7290] mb-6">
        <a href="/templates" className="hover:text-white transition">Templates</a>
        <span>/</span>
        <span className="text-white">Nouveau template</span>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-4 mb-8">
        {[
          { id: "upload", label: "Upload" },
          { id: "review", label: "Configurer les champs" },
          { id: "done", label: "Prêt" },
        ].map((s, i) => {
          const stepOrder = ["upload", "review", "done"];
          const current = stepOrder.indexOf(step);
          const thisIndex = stepOrder.indexOf(s.id);
          const isDone = thisIndex < current;
          const isActive = s.id === step;
          return (
            <div key={s.id} className="flex items-center gap-3">
              {i > 0 && <div className={`h-px w-12 ${isDone ? "bg-[#3B5BDB]" : "bg-[#252a40]"}`} />}
              <div className={`flex items-center gap-2 text-sm font-medium ${isActive ? "text-white" : isDone ? "text-[#3B5BDB]" : "text-[#6b7290]"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? "bg-[#3B5BDB] text-white" : isDone ? "bg-[#3B5BDB]/30 text-[#3B5BDB]" : "bg-[#181c2c] text-[#6b7290]"}`}>
                  {isDone ? "✓" : i + 1}
                </div>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/30 border border-red-800/50 rounded-xl text-red-400 text-sm">
          ⚠ {error}
        </div>
      )}

      {/* Step : Upload */}
      {step === "upload" && (
        <UploadZone onFile={handleFileUpload} loading={loading} />
      )}

      {/* Step : Review */}
      {step === "review" && schema && (
        <SchemaBuilder
          schema={schema}
          templateB64={templateB64}
          onSave={handleSave}
        />
      )}

      {/* Step : Done */}
      {step === "done" && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-white mb-2">Template sauvegardé !</h2>
          <p className="text-[#6b7290] mb-8">Votre template est prêt à être utilisé pour générer des documents.</p>
          <div className="flex gap-4 justify-center">
            <a href="/generate" className="px-5 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold">
              Générer un document →
            </a>
            <a href="/templates" className="px-5 py-2.5 border border-[#252a40] text-[#9ca3af] rounded-xl text-sm font-semibold">
              Voir mes templates
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
