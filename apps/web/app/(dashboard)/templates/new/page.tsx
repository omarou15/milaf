"use client";
import { useState, useCallback } from "react";
import type { WordSchema } from "@/lib/engine/word-ingestion";
import type { PdfSchema } from "@/lib/engine/pdf-ingestion";
import { SchemaBuilder } from "@/components/templates/SchemaBuilder";
import { UploadZone } from "@/components/templates/UploadZone";
import { UploadZonePdf } from "@/components/templates/UploadZonePdf";
import { SchemaBuilderPdf } from "@/components/templates/SchemaBuilderPdf";

type Tier = "tier1" | "tier2";
type Step = "upload" | "review" | "done";

function saveToLocalStorage(schema: WordSchema | PdfSchema, templateB64: string) {
  const existing = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
  const id = crypto.randomUUID();
  localStorage.setItem("milaf_templates", JSON.stringify([
    ...existing,
    { id, schema, templateB64, createdAt: new Date().toISOString() },
  ]));
  return id;
}

export default function NewTemplatePage() {
  const [tier, setTier] = useState<Tier>("tier1");
  const [step, setStep] = useState<Step>("upload");
  const [wordSchema, setWordSchema] = useState<WordSchema | null>(null);
  const [pdfSchema, setPdfSchema] = useState<PdfSchema | null>(null);
  const [templateB64, setTemplateB64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetToUpload(newTier?: Tier) {
    setStep("upload");
    setWordSchema(null);
    setPdfSchema(null);
    setTemplateB64(null);
    setError(null);
    if (newTier) setTier(newTier);
  }

  // ── Tier 1: Word ──
  const handleWordUpload = useCallback(async (file: File) => {
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
      setWordSchema(json.schema);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally { setLoading(false); }
  }, []);

  const handleWordSave = useCallback((schema: WordSchema) => {
    if (!templateB64) return;
    saveToLocalStorage(schema, templateB64);
    setStep("done");
  }, [templateB64]);

  // ── Tier 2: PDF ──
  const handlePdfUpload = useCallback(async (file: File) => {
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
      form.append("name", file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
      const res = await fetch("/api/pdf/ingest", { method: "POST", body: form });
      const json = await res.json();
      if (res.status === 422) throw new Error(json.error ?? "PDF sans champs AcroForm");
      if (!res.ok) throw new Error(json.error ?? "Erreur d'ingestion PDF");
      setPdfSchema(json.schema);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally { setLoading(false); }
  }, []);

  const handlePdfSave = useCallback((schema: PdfSchema) => {
    if (!templateB64) return;
    saveToLocalStorage(schema, templateB64);
    setStep("done");
  }, [templateB64]);

  const steps = [
    { id: "upload", label: "Upload" },
    { id: "review", label: "Configurer" },
    { id: "done", label: "Prêt" },
  ];
  const currentIdx = steps.findIndex(s => s.id === step);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6b7290] mb-6">
        <a href="/templates" className="hover:text-white transition-colors">Templates</a>
        <span className="text-[#3a3f5c]">/</span>
        <span className="text-white">Nouveau template</span>
      </div>

      {/* Tier selector — only in upload step */}
      {step === "upload" && (
        <div className="flex gap-3 mb-8">
          {([
            { id: "tier1", label: "Tier 1 — Word balisé", icon: "◈", color: "#3B5BDB", credits: "1 crédit" },
            { id: "tier2", label: "Tier 2 — PDF AcroForm", icon: "⊡", color: "#2ee8c8", credits: "2 crédits" },
          ] as const).map(t => (
            <button key={t.id} onClick={() => resetToUpload(t.id)}
              className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left ${
                tier === t.id
                  ? "border-opacity-60 text-white"
                  : "border-[#181c2c] text-[#6b7290] hover:border-[#252a40] hover:text-white"
              }`}
              style={tier === t.id ? { borderColor: `${t.color}60`, background: `${t.color}0e` } : {}}>
              <span className="text-lg" style={{ color: t.color }}>{t.icon}</span>
              <div>
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="text-xs opacity-50">{t.credits}</div>
              </div>
              {tier === t.id && <div className="ml-auto w-2 h-2 rounded-full" style={{ background: t.color }} />}
            </button>
          ))}
        </div>
      )}

      {/* Steps indicator */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => {
          const isDone = i < currentIdx;
          const isActive = s.id === step;
          const activeColor = tier === "tier2" ? "#2ee8c8" : "#3B5BDB";
          return (
            <div key={s.id} className="flex items-center">
              {i > 0 && <div className={`h-px w-8 md:w-14 transition-colors duration-300`} style={{ background: isDone ? activeColor : "#1e2235" }} />}
              <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? "text-white" : isDone ? "" : "text-[#3a3f5c]"}`}
                style={isDone ? { color: activeColor } : {}}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300`}
                  style={isActive
                    ? { background: activeColor, color: tier === "tier2" ? "#0a0d14" : "white", boxShadow: `0 0 12px ${activeColor}66` }
                    : isDone
                    ? { background: `${activeColor}20`, color: activeColor }
                    : { background: "#141624", color: "#3a3f5c", border: "1px solid #1e2235" }
                  }>
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
          <span className="shrink-0">⚠</span><span>{error}</span>
        </div>
      )}

      {/* Step content */}
      {step === "upload" && tier === "tier1" && <UploadZone onFile={handleWordUpload} loading={loading} />}
      {step === "upload" && tier === "tier2" && <UploadZonePdf onFile={handlePdfUpload} loading={loading} />}
      {step === "review" && tier === "tier1" && wordSchema && (
        <SchemaBuilder schema={wordSchema} templateB64={templateB64} onSave={handleWordSave} />
      )}
      {step === "review" && tier === "tier2" && pdfSchema && (
        <SchemaBuilderPdf schema={pdfSchema} templateB64={templateB64!} onSave={handlePdfSave} />
      )}
      {step === "done" && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-5"
            style={{ background: tier === "tier2" ? "#2ee8c8" + "18" : "#3B5BDB18", border: `1px solid ${tier === "tier2" ? "#2ee8c8" : "#3B5BDB"}44` }}>
            ✓
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Template sauvegardé !</h2>
          <p className="text-[#6b7290] mb-8 max-w-sm mx-auto">
            {tier === "tier2" ? "Votre formulaire PDF Tier 2 est prêt. Générez vos documents en 2 crédits." : "Votre template Word Tier 1 est prêt."}
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/generate" className="px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors"
              style={{ background: tier === "tier2" ? "#2ee8c8" : "#3B5BDB" }}>
              Générer un document →
            </a>
            <a href="/templates" className="px-5 py-2.5 border border-[#1e2235] hover:border-[#3a3f5c] text-[#9ca3af] hover:text-white rounded-xl text-sm font-semibold transition-colors">
              Voir mes templates
            </a>
            <button onClick={() => resetToUpload()} className="px-5 py-2.5 border border-[#1e2235] text-[#6b7290] hover:text-white rounded-xl text-sm font-semibold transition-colors">
              + Nouveau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
