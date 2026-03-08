"use client";
import { useState, useRef, useCallback } from "react";
import { railwayApi } from "@/lib/api/railway";

type Step = "upload" | "analyzing" | "preview" | "naming" | "saved";

interface AnalysisResult {
  page_count: number;
  page_width: number;
  page_height: number;
  pages: Array<{
    page_number: number;
    text_blocks: Array<{ text: string; x: number; y: number; font: string; size: number; bold: boolean }>;
    vector_shapes: Array<{ x: number; y: number; w: number; h: number; fill_rgb: number[] | null }>;
    images: Array<{ width: number; height: number; ext: string }>;
    colors: Array<{ hex: string; usage_count: number; context: string }>;
  }>;
}

interface DetectedField {
  key: string;
  label: string;
  type: string;
  x: number;
  y: number;
  page: number;
  original_text: string;
}

export default function ClonePage() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [rendererCode, setRendererCode] = useState<string>("");
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Check API health on mount
  useState(() => {
    railwayApi.health()
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));
  });

  const handleFile = useCallback((f: File) => {
    if (!f.type.includes("pdf") && !f.name.endsWith(".pdf")) {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 25 Mo).");
      return;
    }
    setFile(f);
    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(f);
    setPreview(url);

    // Auto-detect name from filename
    const name = f.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
    setTemplateName(name.charAt(0).toUpperCase() + name.slice(1));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const startAnalysis = useCallback(async () => {
    if (!file) return;
    setStep("analyzing");
    setError(null);
    setProgress(0);

    try {
      // Step 1: PyMuPDF analysis
      setProgressLabel("Extraction pixel par pixel (PyMuPDF)…");
      setProgress(15);

      const analysisResult = await railwayApi.analyzePdf(file);
      setAnalysis(analysisResult);
      setProgress(45);

      // Step 2: Claude detects variable fields
      setProgressLabel("Claude détecte les champs variables…");
      setProgress(55);

      const rendererResult = await railwayApi.generateRenderer(
        analysisResult,
        1,
        templateName || file.name
      );
      setRendererCode(rendererResult.code);
      setProgress(85);

      // Step 3: Extract field definitions from Claude's response
      setProgressLabel("Extraction des champs détectés…");
      const fields = extractFieldsFromCode(rendererResult.code, analysisResult);
      setDetectedFields(fields);
      setProgress(100);
      setProgressLabel("Analyse terminée !");

      setTimeout(() => setStep("preview"), 600);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'analyse");
      setStep("upload");
    }
  }, [file, templateName]);

  const saveTemplate = useCallback(() => {
    if (!analysis || !templateName) return;

    const template = {
      id: `tpl_clone_${Date.now()}`,
      schema: {
        templateName,
        tier: "tier4_clone",
        fieldCount: detectedFields.length,
        groups: ["Champs détectés"],
        fields: detectedFields,
      },
      analysis,
      rendererCode,
      originalPdfB64: "", // Would store the PDF in production
      createdAt: new Date().toISOString(),
      source: "tier4-clone",
      tier: "tier4_clone",
    };

    const templates = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
    templates.push(template);
    localStorage.setItem("milaf_templates", JSON.stringify(templates));

    setStep("saved");
  }, [analysis, templateName, detectedFields, rendererCode]);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#06070c]">
      {/* Header */}
      <div className="border-b border-[#181c2c] px-6 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-white">Clone IA</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full">
              TIER 4
            </span>
          </div>
          <p className="text-[#6b7290] text-sm">
            Uploadez n'importe quel document → Mi-Laf l'apprend → Le reproduit à l'infini
          </p>
        </div>
        {apiConnected !== null && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
            apiConnected
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${apiConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            {apiConnected ? "Engine connecté" : "Engine hors ligne"}
          </div>
        )}
      </div>

      <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/20 border border-red-800/40 rounded-xl text-red-400 text-sm flex items-start gap-2">
            <span className="flex-shrink-0">⚠</span>
            <div>
              <div className="font-semibold">Erreur</div>
              <div className="text-red-400/70 mt-0.5">{error}</div>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-300">✕</button>
          </div>
        )}

        {/* STEP: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            {/* Upload zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="group cursor-pointer border-2 border-dashed border-[#1e2235] hover:border-amber-500/40 bg-[#0a0b12] hover:bg-amber-500/[0.02] rounded-2xl p-12 text-center transition-all"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                📄
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Glissez votre document ici
              </h3>
              <p className="text-[#6b7290] text-sm mb-4">
                PDF uniquement · Max 25 Mo · N'importe quel format ou mise en page
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/15 text-amber-400 rounded-xl text-xs font-semibold border border-amber-500/20">
                📎 Choisir un fichier
              </div>
            </div>

            {/* File selected */}
            {file && (
              <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">📄</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{file.name}</div>
                    <div className="text-xs text-[#6b7290]">{(file.size / 1024).toFixed(0)} Ko · PDF</div>
                  </div>
                  <button onClick={() => { setFile(null); setPreview(null); }}
                    className="text-[#6b7290] hover:text-white transition-colors">✕</button>
                </div>

                {/* Template name */}
                <div className="mb-4">
                  <label className="text-xs text-[#6b7290] mb-1.5 block">Nom du template</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="ex: Facture Dupont, Cerfa 13703, Bail habitation..."
                    className="w-full bg-[#141624] border border-[#1e2235] focus:border-amber-500/40 rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#3a3f5c] outline-none transition-colors"
                  />
                </div>

                <button
                  onClick={startAnalysis}
                  disabled={!file || !templateName.trim() || apiConnected === false}
                  className="w-full px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl text-sm transition-all"
                >
                  ✦ Lancer l'analyse Clone IA
                </button>
              </div>
            )}

            {/* How it works */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { icon: "📄", step: "1", title: "Upload", desc: "N'importe quel PDF" },
                { icon: "🔬", step: "2", title: "Analyse", desc: "PyMuPDF pixel par pixel" },
                { icon: "🧠", step: "3", title: "Clone", desc: "Claude génère le renderer" },
                { icon: "♾️", step: "4", title: "Reproduit", desc: "À l'infini avec vos données" },
              ].map((s) => (
                <div key={s.step} className="p-4 bg-[#0d0f18] border border-[#1e2235] rounded-xl text-center">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-[10px] text-amber-400 font-bold mb-1">ÉTAPE {s.step}</div>
                  <div className="text-sm font-semibold text-white">{s.title}</div>
                  <div className="text-[10px] text-[#6b7290] mt-0.5">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Analyzing */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 flex items-center justify-center text-4xl mb-6 animate-pulse">
              🔬
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Analyse en cours…</h2>
            <p className="text-[#6b7290] text-sm mb-8 text-center max-w-md">{progressLabel}</p>

            {/* Progress bar */}
            <div className="w-full max-w-md">
              <div className="h-2 bg-[#1e2235] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#6b7290]">
                <span>PyMuPDF</span>
                <span>{progress}%</span>
                <span>Claude IA</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP: Preview */}
        {step === "preview" && analysis && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Pages", value: analysis.page_count, color: "#f59e0b" },
                { label: "Textes détectés", value: analysis.pages.reduce((s, p) => s + p.text_blocks.length, 0), color: "#3B5BDB" },
                { label: "Formes", value: analysis.pages.reduce((s, p) => s + p.vector_shapes.length, 0), color: "#2ee8c8" },
                { label: "Champs variables", value: detectedFields.length, color: "#a16ef8" },
              ].map((s) => (
                <div key={s.label} className="p-4 bg-[#0d0f18] border border-[#1e2235] rounded-xl">
                  <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-[#6b7290] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Detected fields */}
            <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#181c2c] flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Champs détectés</div>
                  <div className="text-xs text-[#6b7290] mt-0.5">
                    Ces champs seront remplissables lors de la génération
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded font-semibold">
                  {detectedFields.length} champs
                </span>
              </div>
              <div className="divide-y divide-[#141624]">
                {detectedFields.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[#6b7290] text-sm">
                    Aucun champ variable détecté. Le document sera reproduit tel quel.
                  </div>
                ) : (
                  detectedFields.map((f, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3">
                      <code className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded font-mono flex-shrink-0">
                        {`{{${f.key}}}`}
                      </code>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{f.label}</div>
                        <div className="text-[10px] text-[#6b7290]">
                          Page {f.page} · {f.type} · "{f.original_text}"
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Colors palette */}
            {analysis.pages[0]?.colors && (
              <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-5">
                <div className="text-sm font-bold text-white mb-3">Palette couleurs détectée</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.pages[0].colors.slice(0, 12).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#141624] rounded-lg">
                      <div className="w-4 h-4 rounded-sm border border-white/10" style={{ background: c.hex }} />
                      <span className="text-[10px] text-[#6b7290] font-mono">{c.hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep("upload"); setAnalysis(null); setDetectedFields([]); }}
                className="px-5 py-3 border border-[#1e2235] text-[#6b7290] hover:text-white rounded-xl text-sm transition-colors"
              >
                ← Recommencer
              </button>
              <button
                onClick={saveTemplate}
                className="flex-1 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-all"
              >
                ✦ Sauvegarder le template "{templateName}"
              </button>
            </div>
          </div>
        )}

        {/* STEP: Saved */}
        {step === "saved" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-4xl mb-6">
              ✓
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Template cloné avec succès !</h2>
            <p className="text-[#6b7290] text-sm mb-8 text-center max-w-md">
              "{templateName}" est maintenant disponible dans vos templates.
              Vous pouvez le remplir et générer des documents à l'infini.
            </p>
            <div className="flex gap-3">
              <a href="/templates" className="px-5 py-3 border border-[#1e2235] text-white hover:bg-[#0d0f18] rounded-xl text-sm font-semibold transition-colors">
                Voir mes templates
              </a>
              <a href="/generate" className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-all">
                Générer un document →
              </a>
              <button
                onClick={() => { setStep("upload"); setFile(null); setPreview(null); setAnalysis(null); setDetectedFields([]); }}
                className="px-5 py-3 border border-[#1e2235] text-[#6b7290] hover:text-white rounded-xl text-sm transition-colors"
              >
                Cloner un autre
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".pdf,application/pdf"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractFieldsFromCode(code: string, analysis: AnalysisResult): DetectedField[] {
  // Extract data.xxx patterns from the renderer code
  const fields: DetectedField[] = [];
  const seen = new Set<string>();
  const regex = /data\.(\w+)/g;
  let match;

  while ((match = regex.exec(code)) !== null) {
    const key = match[1];
    if (seen.has(key)) continue;
    seen.add(key);

    // Try to find the original text block this field maps to
    const label = key
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (s) => s.toUpperCase());

    fields.push({
      key,
      label,
      type: guessFieldType(key),
      x: 0,
      y: 0,
      page: 1,
      original_text: "",
    });
  }

  return fields;
}

function guessFieldType(key: string): string {
  const lower = key.toLowerCase();
  if (lower.includes("date")) return "date";
  if (lower.includes("email") || lower.includes("mail")) return "email";
  if (lower.includes("tel") || lower.includes("phone") || lower.includes("mobile")) return "tel";
  if (lower.includes("montant") || lower.includes("prix") || lower.includes("total") || lower.includes("amount")) return "number";
  if (lower.includes("adresse") || lower.includes("address")) return "textarea";
  return "text";
}
