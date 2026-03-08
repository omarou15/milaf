"use client";
import { useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type InputMode = "write" | "file" | "api";
type GenerateState = "idle" | "processing" | "done" | "error";

function GenerateContent() {
  const params = useSearchParams();
  const [mode, setMode] = useState<InputMode>("write");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<GenerateState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");
  const [streamText, setStreamText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Templates from localStorage for context
  const [templates] = useState(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("milaf_templates") || "[]");
  });

  const handleFile = (f: File) => {
    setFile(f);
    setMode("file");
    // Auto-suggest prompt based on file name
    if (!prompt) {
      const name = f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setPrompt(`Génère le document à partir de ce fichier : ${name}`);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() && !file) return;
    setState("processing");
    setError(null);
    setDownloadUrl(null);
    setStreamText("");

    try {
      // Build the message for Claude
      let content = prompt;

      if (file) {
        const isPdf = file.name.toLowerCase().endsWith(".pdf");
        const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(file.name);
        const isSpreadsheet = /\.(xlsx|xls|csv|tsv)$/i.test(file.name);

        if (isPdf) {
          // Extract text via PyMuPDF
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://milafapi-production.up.railway.app";
          const b64 = await fileToBase64(file);
          try {
            const res = await fetch(`${apiUrl}/pdf/analyze`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pdfBase64: b64 }),
            });
            if (res.ok) {
              const analysis = await res.json();
              const texts = (analysis.pages || []).map((p: any) =>
                (p.text_blocks || []).map((b: any) => b.text).join("\n")
              ).join("\n\n");
              content = `[Fichier PDF: ${file.name}]\n\nContenu extrait:\n${texts.slice(0, 10000)}\n\n${prompt || "Génère le document complet à partir de ces données"}`;
            }
          } catch (e) {
            // Fallback
          }
        } else if (isSpreadsheet || file.name.endsWith(".csv")) {
          const text = await file.text();
          content = `[Fichier ${file.name}]\n\nDonnées:\n${text.slice(0, 8000)}\n\n${prompt || "Génère les documents à partir de ces données"}`;
        } else if (isImage) {
          content = `[Image: ${file.name}] — Analyse cette image et génère le document correspondant.\n\n${prompt || "Extrais les données visibles et génère le document"}`;
        } else {
          const text = await file.text();
          content = `[Fichier: ${file.name}]\n\n${text.slice(0, 8000)}\n\n${prompt || "Génère le document complet à partir de ce contenu"}`;
        }
      }

      // Add template context
      const templateContext = templates.length > 0
        ? `\n\nTemplates disponibles: ${templates.map((t: any) => t.schema?.templateName || t.name).join(", ")}`
        : "";

      // Stream from Claude via chat API
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: content + templateContext }],
          templates: templates.slice(0, 5),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${resp.status}`);
      }

      // Read stream
      const reader = resp.body!.getReader();
      const dec = new TextDecoder();
      let buf = "", full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") continue;
          try {
            const ev = JSON.parse(raw);
            if (ev.type === "content_block_delta" && ev.delta?.text) {
              full += ev.delta.text;
              setStreamText(full);
            }
          } catch (e) {}
        }
      }

      // Check if Claude generated a document action
      const docMatch = full.match(/<milaf_action type="generate_document">([\s\S]*?)<\/milaf_action>/);
      if (docMatch) {
        try {
          const payload = JSON.parse(docMatch[1]);
          // Generate the .docx
          const genRes = await fetch("/api/instant-generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              wordContent: payload.content,
              data: {},
              filename: payload.name || "document",
            }),
          });
          const genJson = await genRes.json();
          if (genRes.ok) {
            const bytes = Uint8Array.from(atob(genJson.buffer), c => c.charCodeAt(0));
            const blob = new Blob([bytes], { type: genJson.mime });
            setDownloadUrl(URL.createObjectURL(blob));
            setDownloadName(genJson.filename);
          }
        } catch (e) {}
      }

      setState("done");
    } catch (err: any) {
      setError(err.message);
      setState("error");
    }
  }, [prompt, file, templates]);

  const SUGGESTIONS = [
    { icon: "📄", text: "Facture pour M. Dupont, plomberie, chauffe-eau 200L, 1500€ TTC" },
    { icon: "📋", text: "Contrat de bail T3 65m², loyer 1450€, locataire Paul Martin" },
    { icon: "✉️", text: "Mise en demeure loyers impayés, 3 mois, total 4200€" },
    { icon: "👔", text: "Attestation de travail Sophie Leroy, développeuse, CDI depuis 2021" },
    { icon: "📝", text: "Devis isolation combles 80m², laine de roche 300mm, artisan RGE" },
    { icon: "🧾", text: "Quittance de loyer mars 2026, 1200€ + 150€ charges" },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Générer un document</h1>
        <p className="text-gray-500 text-sm mt-0.5">Décrivez, importez ou connectez — Mi-Laf fait le reste</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Input mode tabs */}
          <div className="flex gap-2">
            {([
              { id: "write" as const, icon: "✏️", label: "Écrire" },
              { id: "file" as const, icon: "📎", label: "Importer" },
              { id: "api" as const, icon: "🔗", label: "Connecter" },
            ]).map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  mode === m.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}>
                <span>{m.icon}</span>{m.label}
              </button>
            ))}
          </div>

          {/* Write mode — single text input */}
          {mode === "write" && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                <textarea
                  ref={taRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Décrivez votre document en français naturel...&#10;&#10;Ex: Facture pour M. Dupont, plomberie, remplacement chauffe-eau 200L, main d'œuvre 450€ HT, matériel 800€ HT, TVA 20%"
                  rows={5}
                  className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none text-sm leading-relaxed"
                />
              </div>

              {/* Suggestions */}
              {!prompt && state === "idle" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map(s => (
                    <button key={s.text} onClick={() => setPrompt(s.text)}
                      className="flex items-start gap-2.5 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl text-left transition-all">
                      <span className="text-base flex-shrink-0 mt-0.5">{s.icon}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{s.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* File mode — drag & drop */}
          {mode === "file" && (
            <div className="space-y-4">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  dragOver
                    ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20"
                    : "border-gray-300 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-gray-50 dark:bg-gray-900"
                }`}>
                <div className="text-3xl mb-3">{dragOver ? "📥" : "📎"}</div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Glissez votre fichier ici</p>
                <p className="text-xs text-gray-400">PDF, Word, Excel, CSV, Image — tout est accepté</p>
              </div>

              {file && (
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                  <span>📎</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</div>
                    <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} Ko</div>
                  </div>
                  <button onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Instructions (optionnel) : que voulez-vous générer à partir de ce fichier ?"
                  rows={2}
                  className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-400 resize-none outline-none text-sm leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* API mode — coming soon */}
          {mode === "api" && (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
              <div className="text-3xl mb-3">🔗</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Connexions API</p>
              <p className="text-xs text-gray-400 mb-4">Connectez votre CRM, ERP ou base de données pour générer automatiquement.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Airtable", "Google Sheets", "Notion", "HubSpot", "Salesforce", "API REST"].map(s => (
                  <span key={s} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                    {s} — bientôt
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={state === "processing" || (!prompt.trim() && !file)}
            className="w-full px-5 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all"
          >
            {state === "processing" ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Mi-Laf génère votre document…
              </span>
            ) : "✦ Générer le document"}
          </button>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              ⚠ {error}
            </div>
          )}

          {/* Stream output */}
          {streamText && state !== "idle" && (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Réponse Mi-Laf</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {streamText.replace(/<milaf_action[\s\S]*?<\/milaf_action>/g, "").trim()}
              </div>
            </div>
          )}

          {/* Download */}
          {downloadUrl && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xl">📄</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{downloadName}</div>
                <div className="text-xs text-gray-500">Document prêt à télécharger</div>
              </div>
              <a href={downloadUrl} download={downloadName}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors">
                ⬇ Télécharger
              </a>
            </div>
          )}

          {/* Reset */}
          {state === "done" && (
            <button onClick={() => { setState("idle"); setPrompt(""); setFile(null); setStreamText(""); setDownloadUrl(null); }}
              className="w-full py-3 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-xl text-sm transition-colors">
              Générer un autre document
            </button>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" className="hidden"
        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.tsv,.txt,.png,.jpg,.jpeg,.gif,.webp"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Chargement…</div>}>
      <GenerateContent />
    </Suspense>
  );
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(",")[1] || "");
    r.readAsDataURL(file);
  });
}
