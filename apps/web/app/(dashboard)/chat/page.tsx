"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { consumeCredits, getCreditsRemaining, tokensToCredits, getBilling, saveBilling } from "@/lib/billing/plans";

// ─── Types ───────────────────────────────────────────────────────────────────
type Role = "user" | "assistant";
interface MiLafAction { type: string; payload: any; }
interface TokenInfo { inputTokens: number; outputTokens: number; creditsUsed: number; }
interface Msg {
  id: string; role: Role; content: string;
  actions?: MiLafAction[];
  file?: { name: string };
  loading?: boolean;
  tokenInfo?: TokenInfo;
}

function parseActions(text: string): { cleaned: string; actions: MiLafAction[] } {
  const actions: MiLafAction[] = [];
  const cleaned = text.replace(/<milaf_action type="([^"]+)">([\s\S]*?)<\/milaf_action>/g, (_, type, raw) => {
    try { actions.push({ type, payload: JSON.parse(raw.trim()) }); } catch {}
    return "";
  }).trim();
  return { cleaned, actions };
}

function renderMd(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong class='text-white'>$1</strong>")
    .replace(/`([^`]+)`/g, "<code class='bg-[#1a1e30] text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono'>$1</code>")
    .replace(/^### (.+)$/gm, "<h3 class='text-white font-bold text-sm mt-3 mb-1'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-white font-bold mt-4 mb-1'>$1</h2>")
    .replace(/^- (.+)$/gm, "<li class='text-[#a0a8c8] text-sm ml-3 list-none'>• $1</li>")
    .replace(/\n\n/g, "<div class='h-2'></div>")
    .replace(/\n/g, "<br/>");
}

const SUGGESTIONS = [
  { icon: "📄", label: "Facture instantanée", prompt: "Génère une facture pour M. Dupont, prestation plomberie, remplacement chauffe-eau 200L, main d'œuvre 450€ HT, matériel 800€ HT, TVA 20%, entreprise SAS PlombiPro, 12 rue des Lilas 75011 Paris, SIRET 123 456 789 00012" },
  { icon: "📋", label: "Contrat de bail", prompt: "Génère un contrat de bail pour un T3 de 65m² au 45 avenue Victor Hugo, 75016 Paris, loyer 1450€/mois, charges 150€, propriétaire Mme Dubois Marie, locataire M. Martin Paul, date d'entrée 1er avril 2026" },
  { icon: "✉️", label: "Mise en demeure", prompt: "Rédige une mise en demeure pour loyers impayés : propriétaire M. Bernard, locataire Mme Petit, 3 mois impayés (janvier à mars 2026), montant total 4200€, adresse du bien : 8 rue de la Paix 69001 Lyon" },
  { icon: "📝", label: "Attestation travail", prompt: "Génère une attestation de travail pour Sophie Leroy, développeuse senior, employée depuis le 15/09/2021, CDI temps plein, entreprise TechCorp SAS, 25 boulevard Haussmann 75009 Paris" },
  { icon: "⚡", label: "Devis CEE", prompt: "Crée un devis pour isolation des combles perdus, 80m² de laine de roche 300mm, R=7.5, client M. Renaud, 23 rue des Tilleuls 33000 Bordeaux, artisan RGE Iso-Plus SARL" },
  { icon: "📊", label: "Template devis", prompt: "Crée un template de devis réutilisable pour une entreprise de peinture avec champs : client, adresse chantier, surface, type de peinture, nombre de couches, prix m², total" },
];

function ActionCard({ action, onAccept }: { action: MiLafAction; onAccept: (a: MiLafAction) => void }) {
  const [done, setDone] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");
  const [genError, setGenError] = useState<string | null>(null);

  // ── GENERATE DOCUMENT (Tier instant) ──
  if (action.type === "generate_document") {
    const p = action.payload;

    const handleGenerate = async () => {
      setGenerating(true);
      setGenError(null);
      try {
        const res = await fetch("/api/instant-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wordContent: p.content,
            data: {},
            filename: p.name || "document",
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur");

        const bytes = Uint8Array.from(atob(json.buffer), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: json.mime });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(json.filename);

        // Save to documents history
        const docs = JSON.parse(localStorage.getItem("milaf_docs") || "[]");
        docs.push({
          id: crypto.randomUUID(),
          name: p.name,
          filename: json.filename,
          source: "chat-instant",
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem("milaf_docs", JSON.stringify(docs));
      } catch (e: any) {
        setGenError(e.message);
      } finally {
        setGenerating(false);
      }
    };

    return (
      <div className="mt-3 border border-emerald-500/30 bg-emerald-500/[0.03] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5">
          <span className="text-xl">📄</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{p.name}</div>
            <div className="text-xs text-[#6b7290]">{p.description || "Document prêt à télécharger"}</div>
          </div>
          {downloadUrl ? (
            <a href={downloadUrl} download={downloadName}
              className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors flex-shrink-0 flex items-center gap-1.5">
              ⬇ {downloadName}
            </a>
          ) : (
            <button onClick={handleGenerate} disabled={generating}
              className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition-colors flex-shrink-0 flex items-center gap-1.5">
              {generating ? (
                <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Génération…</>
              ) : (
                <>⬇ Télécharger .docx</>
              )}
            </button>
          )}
        </div>
        {genError && (
          <div className="px-4 py-2 text-xs text-red-400 bg-red-500/5">⚠ {genError}</div>
        )}
        {/* Preview first few lines of content */}
        <div className="px-4 py-2 max-h-32 overflow-hidden relative">
          <pre className="text-[10px] text-[#6b7290] font-mono whitespace-pre-wrap leading-relaxed">
            {(p.content || "").split("\n").slice(0, 8).join("\n")}
          </pre>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#06070c]/80 to-transparent" />
        </div>
      </div>
    );
  }

  // ── CREATE TEMPLATE / TAG DOCUMENT ──
  if (action.type !== "create_template" && action.type !== "tag_document") return null;
  const p = action.payload;
  return (
    <div className={`mt-3 border rounded-2xl overflow-hidden transition-all ${done ? "border-emerald-500/30 bg-emerald-500/5" : "border-indigo-500/30 bg-indigo-500/5"}`}>
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <span className="text-xl">{action.type === "tag_document" ? "🏷️" : "📝"}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{p.name}</div>
          <div className="text-xs text-[#6b7290]">{p.fields?.length ?? 0} champs · Tier {p.tier ?? 1} · Généré par Mi-Laf IA</div>
        </div>
        {done ? (
          <span className="text-xs text-emerald-400 font-semibold flex-shrink-0">✓ Enregistré</span>
        ) : (
          <button onClick={() => { onAccept(action); setDone(true); }}
            className="text-xs font-bold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors flex-shrink-0">
            Enregistrer
          </button>
        )}
      </div>
      {p.fields?.slice(0, 5).map((f: any, i: number) => (
        <div key={i} className="px-4 py-1.5 flex items-center gap-3 border-b border-white/[0.03] last:border-0">
          <code className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded font-mono flex-shrink-0">{`{{${f.key}}}`}</code>
          <span className="text-xs text-[#6b7290] truncate">{f.label}</span>
          <span className="text-[10px] text-[#3a3f5c] ml-auto flex-shrink-0">{f.type}</span>
        </div>
      ))}
      {(p.fields?.length ?? 0) > 5 && <div className="px-4 py-1.5 text-xs text-[#3a3f5c]">+ {p.fields.length - 5} autres champs…</div>}
    </div>
  );
}

function Bubble({ msg, onAccept }: { msg: Msg; onAccept: (a: MiLafAction) => void }) {
  if (msg.role === "user") return (
    <div className="flex justify-end mb-5">
      <div className="max-w-[78%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
        {msg.file && (
          <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 bg-white/10 rounded-xl">
            <span>📎</span><span className="text-xs text-white/80 truncate">{msg.file.name}</span>
          </div>
        )}
        {msg.content}
      </div>
    </div>
  );
  return (
    <div className="flex gap-3 mb-5">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">M</div>
      <div className="flex-1 max-w-[85%]">
        {msg.loading ? (
          <div className="flex items-center gap-2 py-2">
            <div className="flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
            <span className="text-xs text-[#6b7290]">Mi-Laf génère…</span>
          </div>
        ) : (
          <>
            <div className="text-sm text-[#c8cfe8] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }} />
            {msg.actions?.map((a, i) => <ActionCard key={i} action={a} onAccept={onAccept} />)}
            {msg.tokenInfo && (
              <div className="mt-2 flex items-center gap-2 text-[10px] text-[#3a3f5c]">
                <span>🪙 {msg.tokenInfo.creditsUsed} crédit{msg.tokenInfo.creditsUsed !== 1 ? "s" : ""} utilisé{msg.tokenInfo.creditsUsed !== 1 ? "s" : ""}</span>
                <span>·</span>
                <span>{msg.tokenInfo.inputTokens.toLocaleString()} in / {msg.tokenInfo.outputTokens.toLocaleString()} out tokens</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [credits, setCredits] = useState(0);
  const [noCredits, setNoCredits] = useState(false);
  const [file, setFile] = useState<{ name: string; content: string; isPdf?: boolean } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setCredits(getCreditsRemaining()); }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 160) + "px";
  }, [input]);

  const handleFile = (f: File) => {
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      // PDFs: read as base64, will be sent to PyMuPDF for extraction
      const r = new FileReader();
      r.onload = e => {
        const base64 = (e.target?.result as string)?.split(",")[1] || "";
        setFile({ name: f.name, content: base64, isPdf: true });
      };
      r.readAsDataURL(f);
    } else {
      // Text files: read as text
      const r = new FileReader();
      r.onload = e => setFile({ name: f.name, content: (e.target?.result as string) ?? "", isPdf: false });
      r.readAsText(f);
    }
  };

  const saveTemplate = useCallback((action: MiLafAction) => {
    const p = action.payload;
    const templates = JSON.parse(localStorage.getItem("milaf_templates") ?? "[]");
    localStorage.setItem("milaf_templates", JSON.stringify([...templates, {
      id: `tpl_ai_${Date.now()}`, name: p.name, tier: p.tier ?? 1,
      fields: p.fields ?? [], wordContent: p.wordContent ?? p.taggedContent ?? "",
      description: p.description ?? "", createdAt: new Date().toISOString(), source: "ai",
    }]));
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    // Pre-check: need at least 1 credit to start
    const remaining = getCreditsRemaining();
    if (remaining < 1) { setNoCredits(true); return; }
    // Note: we do NOT deduct upfront — we deduct the REAL amount after stream ends

    const userMsg: Msg = {
      id: `u_${Date.now()}`, role: "user", content: text,
      file: file ? { name: file.name } : undefined,
    };
    const loadMsg: Msg = { id: `a_${Date.now()}`, role: "assistant", content: "", loading: true };
    setMessages(p => [...p, userMsg, loadMsg]);
    setInput(""); setFile(null); setStreaming(true);

    let userContent = text;
    if (file) {
      if (file.isPdf) {
        // PDF: extract text via PyMuPDF on Railway, then send extracted text to Claude
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://milafapi-production.up.railway.app";
          const extractRes = await fetch(`${apiUrl}/pdf/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfBase64: file.content, filename: file.name }),
          });
          if (extractRes.ok) {
            const analysis = await extractRes.json();
            // Build readable text from PyMuPDF analysis
            const pages = analysis.pages || [];
            const extractedText = pages.map((p: any, i: number) => {
              const texts = (p.text_blocks || []).map((b: any) => b.text).join("\n");
              return `--- Page ${i + 1} ---\n${texts}`;
            }).join("\n\n");
            userContent = `[Fichier PDF: ${file.name}] (${analysis.page_count} pages, texte extrait par PyMuPDF)\n\n${extractedText.slice(0, 12000)}\n\nDemande: ${text || "Balise ce document automatiquement et génère le template balisé complet"}`;
          } else {
            userContent = `[Fichier PDF: ${file.name}] (extraction échouée — analyse le nom et décris un template standard)\n\nDemande: ${text || "Génère un template standard pour ce type de document"}`;
          }
        } catch {
          userContent = `[Fichier PDF: ${file.name}] (extraction indisponible)\n\nDemande: ${text || "Génère un template standard pour ce type de document"}`;
        }
      } else {
        userContent = `[Fichier: ${file.name}]\n\nContenu:\n\`\`\`\n${file.content.slice(0, 8000)}\n\`\`\`\n\nDemande: ${text || "Balise ce document automatiquement et génère le template balisé complet"}`;
      }
    }

    const apiMsgs = [
      ...messages.filter(m => !m.loading).map(m => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userContent },
    ];
    const templates = JSON.parse(localStorage.getItem("milaf_templates") ?? "[]");

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMsgs, templates }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        // No upfront deduction so no refund needed
        setMessages(p => p.map(m => m.loading ? { ...m, loading: false, content: `❌ ${err.error ?? "Erreur"}` } : m));
        setStreaming(false); return;
      }

      const reader = resp.body!.getReader();
      const dec = new TextDecoder();
      let buf = "", full = "";
      let inputTokens = 0, outputTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6); if (raw === "[DONE]") continue;
          try {
            const ev = JSON.parse(raw);
            // Capture input tokens from message_start
            if (ev.type === "message_start" && ev.message?.usage) {
              inputTokens = ev.message.usage.input_tokens ?? 0;
            }
            // Capture output tokens from message_delta
            if (ev.type === "message_delta" && ev.usage) {
              outputTokens = ev.usage.output_tokens ?? 0;
            }
            if (ev.type === "content_block_delta" && ev.delta?.text) {
              full += ev.delta.text;
              setMessages(p => p.map(m => m.loading ? { ...m, content: full } : m));
            }
          } catch {}
        }
      }

      // Deduct REAL credits based on actual token consumption
      const creditsToDeduct = tokensToCredits(inputTokens, outputTokens);
      const canAfford = consumeCredits(creditsToDeduct);
      if (!canAfford) {
        // Partial — deduct what's left
        const b = getBilling();
        const left = Math.max(0, b.creditsTotal - b.creditsUsed);
        if (left > 0) consumeCredits(left);
      }
      setCredits(getCreditsRemaining());

      const { cleaned, actions } = parseActions(full);
      // Attach token info to last assistant message
      const tokenInfo = inputTokens > 0
        ? `\n\n<milaf_tokens in="${inputTokens}" out="${outputTokens}" credits="${creditsToDeduct}"/>`
        : "";
      setMessages(p => p.map(m => m.loading ? { ...m, loading: false, content: (cleaned || full), actions, tokenInfo: { inputTokens, outputTokens, creditsUsed: creditsToDeduct } } : m));
    } catch (e: any) {
      setMessages(p => p.map(m => m.loading ? { ...m, loading: false, content: `❌ ${e.message}` } : m));
    } finally { setStreaming(false); }
  }, [messages, streaming, file]);

  return (
    <div className="flex flex-col h-full bg-[#06070c]">

      {/* No credits banner */}
      {noCredits && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 text-xs text-red-300 flex-wrap">
          <span>⚡ Crédits épuisés.</span>
          <a href="/settings" className="font-bold underline hover:text-red-200">Recharger les crédits →</a>
          <button onClick={() => setNoCredits(false)} className="ml-auto text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2235]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-sm font-bold">M</div>
          <div>
            <div className="text-sm font-bold text-white">Mi-Laf IA</div>
            <div className="text-[10px] text-[#6b7290]">Décrivez · Uploadez · Générez</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Credits counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0d0f18] border border-[#1e2235] rounded-xl">
            <span className="text-[10px] text-[#6b7290]">Crédits</span>
            <span className={`text-xs font-bold ${credits < 5 ? "text-red-400" : "text-white"}`}>{credits}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-semibold">Claude Opus</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center pt-6 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/20 flex items-center justify-center text-3xl mx-auto mb-4">✦</div>
              <h2 className="text-xl font-bold text-white mb-2">Décrivez, Mi-Laf génère.</h2>
              <p className="text-[#6b7290] text-sm max-w-md mx-auto leading-relaxed mb-6">
                Décrivez votre document en français naturel avec les données concrètes.
                Mi-Laf génère le fichier .docx complet, prêt à télécharger.
                <br />
                <span className="text-emerald-400">★ Nouveau : génération instantanée avec vos données.</span>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {SUGGESTIONS.map(s => (
                  <button key={s.label} onClick={() => send(s.prompt)}
                    className="flex items-center gap-2.5 px-3 py-2.5 bg-[#0d0f18] border border-[#1e2235] hover:border-[#2a2f48] hover:bg-[#10131e] rounded-xl text-left transition-all group">
                    <span className="text-xl flex-shrink-0">{s.icon}</span>
                    <span className="text-xs text-[#8b92b0] group-hover:text-white transition-colors font-medium leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed border-[#1e2235] hover:border-indigo-500/40 hover:bg-indigo-500/5 rounded-2xl cursor-pointer transition-all group">
                <span className="text-lg">📎</span>
                <span className="text-sm text-[#6b7290] group-hover:text-indigo-300 transition-colors">Uploader un document existant à baliser automatiquement</span>
              </button>
            </div>
          )}
          {messages.map(m => <Bubble key={m.id} msg={m} onAccept={saveTemplate} />)}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[#1e2235] px-4 md:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          {file && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <span>📎</span>
              <span className="text-xs text-indigo-300 truncate flex-1">{file.name}</span>
              <button onClick={() => setFile(null)} className="text-[#6b7290] hover:text-white text-xs">✕</button>
            </div>
          )}
          <div className="flex items-end gap-2 bg-[#0d0f18] border border-[#1e2235] focus-within:border-indigo-500/40 rounded-2xl px-3 py-2 transition-colors">
            <button onClick={() => fileRef.current?.click()}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[#6b7290] hover:text-white hover:bg-white/5 rounded-xl transition-all mb-0.5" title="Uploader un document">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Décrivez le document, uploadez un fichier à baliser…"
              rows={1} disabled={streaming}
              className="flex-1 bg-transparent text-sm text-white placeholder-[#3a3f5c] resize-none outline-none leading-relaxed py-1.5"
              style={{ scrollbarWidth: "none", maxHeight: "160px" }} />
            <button onClick={() => send(input)} disabled={!input.trim() || streaming}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all mb-0.5">
              {streaming
                ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
            </button>
          </div>
          <p className="text-[10px] text-[#3a3f5c] text-center mt-2">
            1 crédit par message · {credits} crédit{credits !== 1 ? "s" : ""} restant{credits !== 1 ? "s" : ""}
            {credits < 10 && <> · <a href="/settings" className="text-indigo-400 hover:text-indigo-300">Recharger</a></>}
          </p>
        </div>
      </div>
      <input ref={fileRef} type="file" className="hidden" accept=".txt,.docx,.pdf,.doc,.html,.md,.csv"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}
