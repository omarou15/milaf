"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { railwayApi } from "@/lib/api/railway";
import type { PDFAnalysisResult, DetectedField } from "@/lib/api/railway";

type Step = "upload" | "analyzing" | "preview" | "saved";

export default function ClonePage() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<PDFAnalysisResult | null>(null);
  const [fields, setFields] = useState<DetectedField[]>([]);
  const [rendererCode, setRendererCode] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [tokensUsed, setTokensUsed] = useState<{ input_tokens: number; output_tokens: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    railwayApi.health().then(() => setApiOk(true)).catch(() => setApiOk(false));
  }, []);

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Seuls les fichiers PDF sont acceptés."); return;
    }
    if (f.size > 25 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 25 Mo)."); return;
    }
    setFile(f);
    setError(null);
    const name = f.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ");
    setTemplateName(name.charAt(0).toUpperCase() + name.slice(1));
  }, []);

  const startClone = useCallback(async () => {
    if (!file || !templateName.trim()) return;
    setStep("analyzing");
    setError(null);
    setProgress(0);

    try {
      // Phase 1: PyMuPDF extraction
      setProgressLabel("Extraction pixel par pixel (PyMuPDF)…");
      setProgress(10);
      const analysisResult = await railwayApi.analyzePdf(file);
      setAnalysis(analysisResult);
      setProgress(40);

      // Phase 2: Claude field detection + renderer
      setProgressLabel("Claude analyse les champs variables…");
      setProgress(50);

      // Analyze all pages (or just first for MVP)
      const pagesToAnalyze = Math.min(analysisResult.page_count, 3);
      let allFields: DetectedField[] = [];
      let allCode = "";

      for (let i = 1; i <= pagesToAnalyze; i++) {
        setProgressLabel(`Claude analyse page ${i}/${pagesToAnalyze}…`);
        setProgress(50 + Math.round((i / pagesToAnalyze) * 40));

        const cloneResult = await railwayApi.cloneAnalyze(analysisResult, i, templateName);
        allFields = [...allFields, ...cloneResult.fields];
        allCode += `\n// ── Page ${i} ──\n${cloneResult.code}\n`;
        if (cloneResult.tokens_used) setTokensUsed(cloneResult.tokens_used);
      }

      // Deduplicate fields by key
      const seen = new Set<string>();
      const uniqueFields = allFields.filter((f) => {
        if (seen.has(f.key)) return false;
        seen.add(f.key);
        return true;
      });

      setFields(uniqueFields);
      setRendererCode(allCode);
      setProgress(100);
      setProgressLabel("Analyse terminée !");
      setTimeout(() => setStep("preview"), 500);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'analyse");
      setStep("upload");
    }
  }, [file, templateName]);

  const saveTemplate = useCallback(() => {
    if (!analysis || !templateName.trim()) return;

    const template = {
      id: `tpl_t4_${Date.now()}`,
      schema: {
        templateName,
        tier: "tier4_clone",
        fieldCount: fields.length,
        groups: [...new Set(fields.map((f) => `Page ${f.page}`))],
        fields: fields.map((f) => ({
          balise: f.key,
          key: f.key,
          label: f.label,
          type: f.type,
          group: `Page ${f.page}`,
          hint: f.original_text,
        })),
      },
      analysis: JSON.stringify(analysis).length < 500_000 ? analysis : null,
      rendererCode,
      templateB64: "",
      createdAt: new Date().toISOString(),
      source: "tier4-clone",
      tier: "tier4_clone",
      moduleId: undefined,
      emoji: "🧬",
    };

    const templates = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
    templates.push(template);
    localStorage.setItem("milaf_templates", JSON.stringify(templates));
    setStep("saved");
  }, [analysis, templateName, fields, rendererCode]);

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#06070c]">
      {/* Header */}
      <div className="border-b border-[#181c2c] px-6 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-white">Clone IA</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full">TIER 4</span>
          </div>
          <p className="text-[#6b7290] text-sm">Uploadez n'importe quel PDF — Mi-Laf l'apprend et le reproduit à l'infini</p>
        </div>
        {apiOk !== null && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
            apiOk ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${apiOk ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            {apiOk ? "Engine connecté" : "Engine hors ligne"}
          </div>
        )}
      </div>

      <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {error && (
          <div className="mb-6 p-4 bg-red-950/20 border border-red-800/40 rounded-xl text-red-400 text-sm flex items-start gap-2">
            <span>⚠</span>
            <div className="flex-1"><div className="font-semibold">Erreur</div><div className="opacity-70 mt-0.5">{error}</div></div>
            <button onClick={() => setError(null)} className="opacity-50 hover:opacity-100">✕</button>
          </div>
        )}

        {/* ── UPLOAD ── */}
        {step === "upload" && (
          <div className="space-y-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`group cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                dragOver ? "border-amber-400 bg-amber-500/5" : "border-[#1e2235] hover:border-amber-500/40 bg-[#0a0b12] hover:bg-amber-500/[0.02]"
              }`}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                {dragOver ? "📥" : "📄"}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {dragOver ? "Déposez ici !" : "Glissez votre document ici"}
              </h3>
              <p className="text-[#6b7290] text-sm mb-4">PDF uniquement · Max 25 Mo · Facture, contrat, Cerfa, bail, rapport…</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/15 text-amber-400 rounded-xl text-xs font-semibold border border-amber-500/20">
                📎 Choisir un fichier
              </div>
            </div>

            {file && (
              <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">📄</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{file.name}</div>
                    <div className="text-xs text-[#6b7290]">{(file.size / 1024).toFixed(0)} Ko · PDF</div>
                  </div>
                  <button onClick={() => { setFile(null); }} className="text-[#6b7290] hover:text-white transition-colors">✕</button>
                </div>
                <div>
                  <label className="text-xs text-[#6b7290] mb-1.5 block">Nom du template</label>
                  <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="ex: Facture Dupont, Cerfa 13703, Bail habitation..."
                    className="w-full bg-[#141624] border border-[#1e2235] focus:border-amber-500/40 rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#3a3f5c] outline-none transition-colors" />
                </div>
                <button onClick={startClone} disabled={!file || !templateName.trim() || apiOk === false}
                  className="w-full px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl text-sm transition-all">
                  🧬 Lancer le clonage IA
                </button>
              </div>
            )}

            {/* How it works */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: "📄", n: "1", title: "Upload", desc: "N'importe quel PDF" },
                { icon: "🔬", n: "2", title: "PyMuPDF", desc: "Extraction pixel par pixel" },
                { icon: "🧠", n: "3", title: "Claude IA", desc: "Détecte les champs variables" },
                { icon: "♾️", n: "4", title: "Reproduit", desc: "À l'infini, vos données" },
              ].map((s) => (
                <div key={s.n} className="p-4 bg-[#0d0f18] border border-[#1e2235] rounded-xl text-center">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-[10px] text-amber-400 font-bold mb-1">ÉTAPE {s.n}</div>
                  <div className="text-sm font-semibold text-white">{s.title}</div>
                  <div className="text-[10px] text-[#6b7290] mt-0.5">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANALYZING ── */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 flex items-center justify-center text-4xl animate-pulse">🧬</div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Clonage en cours…</h2>
            <p className="text-[#6b7290] text-sm mb-8 text-center max-w-md">{progressLabel}</p>
            <div className="w-full max-w-md">
              <div className="h-2.5 bg-[#1e2235] rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-[#6b7290]">
                <span>PyMuPDF</span>
                <span className="font-bold text-amber-400">{progress}%</span>
                <span>Claude IA</span>
              </div>
            </div>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {step === "preview" && analysis && (
          <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Pages", value: analysis.page_count, color: "#f59e0b" },
                { label: "Textes", value: analysis.pages.reduce((s, p) => s + p.text_blocks.length, 0), color: "#3B5BDB" },
                { label: "Formes", value: analysis.pages.reduce((s, p) => s + p.vector_shapes.length, 0), color: "#2ee8c8" },
                { label: "Images", value: analysis.pages.reduce((s, p) => s + p.images.length, 0), color: "#a16ef8" },
                { label: "Champs détectés", value: fields.length, color: "#f43f5e" },
              ].map((s) => (
                <div key={s.label} className="p-3.5 bg-[#0d0f18] border border-[#1e2235] rounded-xl">
                  <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] text-[#6b7290] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Fields */}
            <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#181c2c] flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Champs variables détectés par Claude</div>
                  <div className="text-xs text-[#6b7290] mt-0.5">Ces champs seront remplissables lors de la génération</div>
                </div>
                <span className="text-xs px-2.5 py-1 bg-amber-500/15 text-amber-400 rounded-lg font-semibold">{fields.length} champs</span>
              </div>
              {fields.length === 0 ? (
                <div className="px-5 py-8 text-center text-[#6b7290] text-sm">
                  Aucun champ variable détecté. Le document sera reproduit tel quel (template statique).
                </div>
              ) : (
                <div className="divide-y divide-[#141624] max-h-80 overflow-y-auto">
                  {fields.map((f, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-[#0a0c14] transition-colors">
                      <code className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded font-mono flex-shrink-0 min-w-[120px]">
                        {`{{${f.key}}}`}
                      </code>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{f.label}</div>
                        <div className="text-[10px] text-[#6b7290]">
                          Page {f.page} · {f.type}
                          {f.original_text && <> · <span className="text-[#4a5070]">"{f.original_text.slice(0, 40)}"</span></>}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-[#141624] text-[#6b7290] rounded flex-shrink-0">{f.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Color palette */}
            {analysis.pages[0]?.colors?.length > 0 && (
              <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-5">
                <div className="text-sm font-bold text-white mb-3">Palette couleurs extraite</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.pages[0].colors.slice(0, 12).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#141624] rounded-lg group hover:bg-[#1a1e30] transition-colors">
                      <div className="w-5 h-5 rounded border border-white/10" style={{ background: c.hex }} />
                      <span className="text-[10px] text-[#6b7290] font-mono">{c.hex}</span>
                      <span className="text-[10px] text-[#3a3f5c]">×{c.usage_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Token usage */}
            {tokensUsed && (
              <div className="flex items-center gap-3 text-[10px] text-[#3a3f5c]">
                <span>🪙 Tokens utilisés : {tokensUsed.input_tokens.toLocaleString()} in / {tokensUsed.output_tokens.toLocaleString()} out</span>
                <span>· Renderer : {rendererCode.length.toLocaleString()} caractères</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => { setStep("upload"); setAnalysis(null); setFields([]); setRendererCode(""); }}
                className="px-5 py-3 border border-[#1e2235] text-[#6b7290] hover:text-white hover:border-[#2a2f48] rounded-xl text-sm transition-colors">
                ← Recommencer
              </button>
              <button onClick={saveTemplate}
                className="flex-1 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl text-sm transition-all">
                ✦ Sauvegarder "{templateName}"
              </button>
            </div>
          </div>
        )}

        {/* ── SAVED ── */}
        {step === "saved" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-4xl mb-6">✓</div>
            <h2 className="text-xl font-bold text-white mb-2">Template cloné !</h2>
            <p className="text-[#6b7290] text-sm mb-2 text-center max-w-md">
              "{templateName}" avec {fields.length} champs est prêt.
            </p>
            <p className="text-[#4a5070] text-xs mb-8 text-center max-w-sm">
              Retrouvez-le dans vos templates pour générer des documents à l'infini avec vos propres données.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="/generate" className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl text-sm transition-all hover:from-amber-400 hover:to-orange-400">
                Générer un document →
              </a>
              <a href="/templates" className="px-5 py-3 border border-[#1e2235] text-white hover:bg-[#0d0f18] rounded-xl text-sm font-semibold transition-colors">
                Mes templates
              </a>
              <button onClick={() => { setStep("upload"); setFile(null); setAnalysis(null); setFields([]); setRendererCode(""); setTemplateName(""); }}
                className="px-5 py-3 border border-[#1e2235] text-[#6b7290] hover:text-white rounded-xl text-sm transition-colors">
                Cloner un autre document
              </button>
            </div>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" className="hidden" accept=".pdf,application/pdf"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}
