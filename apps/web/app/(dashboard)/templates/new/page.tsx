"use client";
import { useState, useCallback } from "react";
import type { WordSchema } from "@/lib/engine/word-ingestion";
import type { PdfSchema } from "@/lib/engine/pdf-ingestion";
import type { PixelPerfectSchema } from "@/lib/engine/pixel-perfect";
import { SchemaBuilder } from "@/components/templates/SchemaBuilder";
import { UploadZone } from "@/components/templates/UploadZone";
import { UploadZonePdf } from "@/components/templates/UploadZonePdf";
import { SchemaBuilderPdf } from "@/components/templates/SchemaBuilderPdf";

type Tier = "tier1" | "tier2" | "tier3";
type Step = "upload" | "analyzing" | "review" | "done";

const TIER_CONFIG = {
  tier1: { label: "Tier 1 — Word balisé",      icon: "◈", color: "#3B5BDB", credits: "1 crédit",  desc: "Fichier .docx avec balises {{champs}}" },
  tier2: { label: "Tier 2 — PDF AcroForm",      icon: "⊡", color: "#2ee8c8", credits: "2 crédits", desc: "Formulaire PDF avec champs natifs" },
  tier3: { label: "Tier 3 — Pixel Perfect IA",  icon: "✦", color: "#a16ef8", credits: "5 crédits", desc: "N'importe quel PDF — Vision IA" },
} as const;

function saveToLocalStorage(
  schema: WordSchema | PdfSchema | PixelPerfectSchema,
  templateB64: string,
  tier: Tier,
  originalPdfB64?: string
) {
  const existing = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
  const id = crypto.randomUUID();
  const entry: any = { id, schema, templateB64, tier, createdAt: new Date().toISOString() };
  if (tier === "tier3" && originalPdfB64) entry.originalPdfB64 = originalPdfB64;
  localStorage.setItem("milaf_templates", JSON.stringify([...existing, entry]));
  return id;
}

// ── Tier 3 Schema Builder (inline) ──────────────────────────────────────────
function SchemaBuilderPixelPerfect({
  schema,
  onSave,
}: {
  schema: PixelPerfectSchema;
  onSave: (s: PixelPerfectSchema) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-[#a16ef8]/5 border border-[#a16ef8]/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✦</span>
          <div>
            <h3 className="text-sm font-bold text-white mb-0.5">{schema.templateName}</h3>
            <p className="text-xs text-[#6b7290]">{schema.description}</p>
            <div className="flex gap-3 mt-2 text-xs text-[#6b7290]">
              <span>{schema.fields.length} champs détectés</span>
              <span>·</span>
              <span>{schema.pageCount} page{schema.pageCount > 1 ? "s" : ""}</span>
              <span>·</span>
              <span className="text-[#a16ef8]">Analysé par Vision IA</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider">Champs détectés</h4>
        {schema.fields.map((f, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-[#0d0f18] border border-[#1e2235] rounded-xl">
            <code className="text-[10px] text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded font-mono">{`{{${f.key}}}`}</code>
            <span className="text-sm text-white flex-1">{f.label}</span>
            <span className="text-xs text-[#3a3f5c] bg-[#1a1e30] px-2 py-0.5 rounded">{f.type}</span>
            {f.required && <span className="text-[10px] text-[#a16ef8]">requis</span>}
          </div>
        ))}
      </div>

      <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl text-xs text-amber-300/70">
        💡 Les champs ont été détectés automatiquement par Vision IA. La génération utilisera la cascade 3 approches pour un rendu optimal.
      </div>

      <button onClick={() => onSave(schema)}
        className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
        style={{ background: "#a16ef8", boxShadow: "0 0 20px #a16ef820" }}>
        Enregistrer le template Tier 3 →
      </button>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function NewTemplatePage() {
  const [tier, setTier] = useState<Tier>("tier1");
  const [step, setStep] = useState<Step>("upload");
  const [wordSchema, setWordSchema] = useState<WordSchema | null>(null);
  const [pdfSchema, setPdfSchema] = useState<PdfSchema | null>(null);
  const [pixelSchema, setPixelSchema] = useState<PixelPerfectSchema | null>(null);
  const [templateB64, setTemplateB64] = useState<string | null>(null);
  const [originalPdfB64, setOriginalPdfB64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset(newTier?: Tier) {
    setStep("upload");
    setWordSchema(null); setPdfSchema(null); setPixelSchema(null);
    setTemplateB64(null); setOriginalPdfB64(null);
    setError(null); setAnalyzeProgress("");
    if (newTier) setTier(newTier);
  }

  // ── Tier 1 ──────────────────────────────────────────────────────────────────
  const handleWordUpload = useCallback(async (file: File) => {
    setLoading(true); setError(null);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = e => res((e.target?.result as string).split(",")[1]);
        r.onerror = rej; r.readAsDataURL(file);
      });
      setTemplateB64(b64);
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name.replace(/\.docx$/i, "").replace(/[-_]/g, " "));
      const res = await fetch("/api/templates/ingest", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur d'ingestion");
      if (json.schema.fieldCount === 0) throw new Error("Aucune balise {{champ}} détectée.");
      setWordSchema(json.schema); setStep("review");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  // ── Tier 2 ──────────────────────────────────────────────────────────────────
  const handlePdfUpload = useCallback(async (file: File) => {
    setLoading(true); setError(null);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = e => res((e.target?.result as string).split(",")[1]);
        r.onerror = rej; r.readAsDataURL(file);
      });
      setTemplateB64(b64);
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
      const res = await fetch("/api/pdf/ingest", { method: "POST", body: form });
      const json = await res.json();
      if (res.status === 422) throw new Error(json.error ?? "PDF sans champs AcroForm — essayez Tier 3");
      if (!res.ok) throw new Error(json.error ?? "Erreur d'ingestion PDF");
      setPdfSchema(json.schema); setStep("review");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  // ── Tier 3 ──────────────────────────────────────────────────────────────────
  const handlePixelUpload = useCallback(async (file: File) => {
    setLoading(true); setError(null); setStep("analyzing");
    try {
      setAnalyzeProgress("Lecture du PDF…");
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = e => res((e.target?.result as string).split(",")[1]);
        r.onerror = rej; r.readAsDataURL(file);
      });
      setOriginalPdfB64(b64);
      setTemplateB64(b64); // for Tier 3, template IS the original PDF

      setAnalyzeProgress("Vision IA analyse le document…");
      const res = await fetch("/api/pixel-perfect/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64: b64, filename: file.name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur d'analyse Vision IA");

      setAnalyzeProgress("Champs détectés !");
      setPixelSchema(json.schema);
      setOriginalPdfB64(json.originalPdfBase64 ?? b64);
      setStep("review");
    } catch (e: any) { setError(e.message); setStep("upload"); }
    finally { setLoading(false); setAnalyzeProgress(""); }
  }, []);

  const tc = TIER_CONFIG[tier];
  const steps = [{ id: "upload", label: "Upload" }, { id: "review", label: "Configurer" }, { id: "done", label: "Prêt" }];
  const currentIdx = step === "analyzing" ? 0 : steps.findIndex(s => s.id === step);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6b7290] mb-6">
        <a href="/templates" className="hover:text-white transition-colors">Templates</a>
        <span>/</span>
        <span className="text-white">Nouveau template</span>
      </div>

      {/* Tier selector */}
      {(step === "upload" || step === "analyzing") && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {(Object.entries(TIER_CONFIG) as [Tier, typeof tc][]).map(([id, t]) => (
            <button key={id} onClick={() => reset(id)}
              className={`flex flex-col gap-1 px-4 py-3.5 rounded-xl border transition-all text-left ${tier === id ? "text-white" : "border-[#181c2c] text-[#6b7290] hover:border-[#252a40] hover:text-white"}`}
              style={tier === id ? { borderColor: `${t.color}60`, background: `${t.color}0e` } : {}}>
              <div className="flex items-center justify-between">
                <span className="text-lg" style={{ color: t.color }}>{t.icon}</span>
                {tier === id && <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />}
              </div>
              <div className="text-xs font-semibold">{t.label}</div>
              <div className="text-[10px] opacity-50">{t.desc}</div>
              <div className="text-[10px] font-bold mt-0.5" style={{ color: t.color }}>{t.credits}</div>
            </button>
          ))}
        </div>
      )}

      {/* Steps */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => {
          const isDone = i < currentIdx;
          const isActive = s.id === step || (s.id === "upload" && step === "analyzing");
          return (
            <div key={s.id} className="flex items-center">
              {i > 0 && <div className="h-px w-8 md:w-14" style={{ background: isDone ? tc.color : "#1e2235" }} />}
              <div className={`flex items-center gap-2 text-sm font-medium ${isActive ? "text-white" : isDone ? "" : "text-[#3a3f5c]"}`}
                style={isDone ? { color: tc.color } : {}}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={isActive
                    ? { background: tc.color, color: tier === "tier3" ? "white" : tier === "tier2" ? "#0a0d14" : "white", boxShadow: `0 0 12px ${tc.color}66` }
                    : isDone ? { background: `${tc.color}20`, color: tc.color }
                    : { background: "#141624", color: "#3a3f5c", border: "1px solid #1e2235" }}>
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
          <span>⚠</span><span>{error}</span>
        </div>
      )}

      {/* Analyzing state */}
      {step === "analyzing" && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">✦</div>
          <h3 className="text-base font-bold text-white mb-2">Vision IA en cours…</h3>
          <p className="text-sm text-[#6b7290]">{analyzeProgress || "Analyse du document…"}</p>
          <div className="flex justify-center gap-1 mt-4">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
          </div>
        </div>
      )}

      {/* Upload steps */}
      {step === "upload" && tier === "tier1" && <UploadZone onFile={handleWordUpload} loading={loading} />}
      {step === "upload" && tier === "tier2" && <UploadZonePdf onFile={handlePdfUpload} loading={loading} />}
      {step === "upload" && tier === "tier3" && (
        <UploadZonePdf
          onFile={handlePixelUpload}
          loading={loading}
          label="Uploadez n'importe quel PDF"
          hint="PDF scanné, formulaire figé, document sans champs — Vision IA analyse tout"
          accentColor="#a16ef8"
        />
      )}

      {/* Review steps */}
      {step === "review" && tier === "tier1" && wordSchema && (
        <SchemaBuilder schema={wordSchema} templateB64={templateB64} onSave={s => { saveToLocalStorage(s, templateB64!, "tier1"); setStep("done"); }} />
      )}
      {step === "review" && tier === "tier2" && pdfSchema && (
        <SchemaBuilderPdf schema={pdfSchema} templateB64={templateB64!} onSave={s => { saveToLocalStorage(s, templateB64!, "tier2"); setStep("done"); }} />
      )}
      {step === "review" && tier === "tier3" && pixelSchema && (
        <SchemaBuilderPixelPerfect schema={pixelSchema} onSave={s => { saveToLocalStorage(s, templateB64!, "tier3", originalPdfB64!); setStep("done"); }} />
      )}

      {/* Done */}
      {step === "done" && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-5"
            style={{ background: `${tc.color}18`, border: `1px solid ${tc.color}44` }}>✓</div>
          <h2 className="text-xl font-bold text-white mb-2">Template {tc.label.split(" — ")[0]} sauvegardé !</h2>
          <p className="text-[#6b7290] mb-8 max-w-sm mx-auto text-sm">
            {tier === "tier3"
              ? "Votre template Pixel Perfect est prêt. La génération utilisera Vision IA pour un rendu optimal."
              : tier === "tier2"
              ? "Votre formulaire PDF AcroForm est prêt. Générez en 2 crédits."
              : "Votre template Word balisé est prêt. Générez en 1 crédit."}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/generate" className="px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors"
              style={{ background: tc.color }}>Générer un document →</a>
            <a href="/templates" className="px-5 py-2.5 border border-[#1e2235] hover:border-[#3a3f5c] text-[#9ca3af] hover:text-white rounded-xl text-sm font-semibold transition-colors">Mes templates</a>
            <button onClick={() => reset()} className="px-5 py-2.5 border border-[#1e2235] text-[#6b7290] hover:text-white rounded-xl text-sm font-semibold transition-colors">+ Nouveau</button>
          </div>
        </div>
      )}
    </div>
  );
}
