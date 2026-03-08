"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { getBilling, consumeCredits, PLANS } from "@/lib/billing/plans";

// ─── Types ───────────────────────────────────────────────────────────────────
type Role = "user" | "assistant";
interface MiLafAction { type: string; payload: any; }
interface Msg {
  id: string; role: Role; content: string;
  actions?: MiLafAction[];
  file?: { name: string; type: string };
  loading?: boolean;
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
  { icon: "📝", label: "Devis plomberie", prompt: "Crée un template de devis complet pour une entreprise de plomberie avec tous les champs nécessaires : client, travaux, matériaux, main d'œuvre, TVA" },
  { icon: "📄", label: "Contrat de bail", prompt: "Génère un template de contrat de bail résidentiel complet avec toutes les clauses standards (bailleur, locataire, loyer, charges, état des lieux)" },
  { icon: "⚡", label: "Facture CEE", prompt: "Crée un template de facture pour les travaux CEE (Certificats d'Économies d'Énergie) avec les champs réglementaires obligatoires" },
  { icon: "🏗️", label: "Attestation travaux", prompt: "Génère une attestation de fin de travaux complète avec les informations chantier, maître d'œuvre, description des travaux et réception" },
  { icon: "⚖️", label: "Procuration", prompt: "Crée un template de procuration générale avec mandant, mandataire, objet précis de la procuration et durée de validité" },
  { icon: "🏥", label: "Certificat médical", prompt: "Génère un template de certificat médical d'aptitude avec informations patient, médecin, objet du certificat et conclusion médicale" },
];

function ActionCard({ action, onAccept }: { action: MiLafAction; onAccept: (a: MiLafAction) => void }) {
  const [done, setDone] = useState(false);
  if (action.type !== "create_template" && action.type !== "tag_document") return null;
  const p = action.payload;
  return (
    <div className={`mt-3 border rounded-2xl overflow-hidden transition-all ${done ? "border-emerald-500/30 bg-emerald-500/5" : "border-indigo-500/30 bg-indigo-500/5"}`}>
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <span className="text-xl">{action.type === "tag_document" ? "🏷️" : "📝"}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{p.name}</div>
          <div className="text-xs text-[#6b7290]">{p.fields?.length ?? 0} champs · Tier {p.tier ?? 1}{action.type === "tag_document" ? " · Balisé par IA" : " · Créé par IA"}</div>
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
            <span className="text-base">📎</span>
            <span className="text-xs text-white/80 truncate">{msg.file.name}</span>
          </div>
        )}
        {msg.content}
      </div>
    </div>
  );
  return (
    <div className="flex gap-3 mb-5">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-lg shadow-indigo-900/30">M</div>
      <div className="flex-1 max-w-[85%]">
        {msg.loading ? (
          <div className="flex items-center gap-2 py-2">
            <div className="flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
            <span className="text-xs text-[#6b7290]">Mi-Laf analyse et rédige…</span>
          </div>
        ) : (
          <>
            <div className="text-sm text-[#c8cfe8] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }} />
            {msg.actions?.map((a, i) => <ActionCard key={i} action={a} onAccept={onAccept} />)}
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
  const [apiKey, setApiKey] = useState("");
  const [noKey, setNoKey] = useState(false);
  const [file, setFile] = useState<{ name: string; content: string; type: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const k = localStorage.getItem("milaf_claude_api_key") ?? "";
    if (k) setApiKey(k); else setNoKey(true);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 160) + "px";
  }, [input]);

  const handleFile = (f: File) => {
    const r = new FileReader();
    r.onload = e => setFile({ name: f.name, content: (e.target?.result as string) ?? "", type: f.type });
    r.readAsText(f);
  };

  const saveTemplate = useCallback((action: MiLafAction) => {
    if (action.type !== "create_template" && action.type !== "tag_document") return;
    const p = action.payload;
    const templates = JSON.parse(localStorage.getItem("milaf_templates") ?? "[]");
    localStorage.setItem("milaf_templates", JSON.stringify([...templates, {
      id: `tpl_ai_${Date.now()}`, name: p.name, tier: p.tier ?? 1,
      fields: p.fields ?? [], wordContent: p.wordContent ?? p.taggedContent ?? "",
      description: p.description ?? "", createdAt: new Date().toISOString(), source: "ai",
    }]));
    consumeCredits(2);
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    const key = apiKey || localStorage.getItem("milaf_claude_api_key") || "";
    if (!key) { setNoKey(true); return; }

    const userMsg: Msg = { id: `u_${Date.now()}`, role: "user", content: text, file: file ? { name: file.name, type: file.type } : undefined };
    const loadMsg: Msg = { id: `a_${Date.now()}`, role: "assistant", content: "", loading: true };
    setMessages(p => [...p, userMsg, loadMsg]);
    setInput(""); setFile(null); setStreaming(true);

    let userContent = text;
    if (file) userContent = `[Fichier: ${file.name}]\n\nContenu:\n\`\`\`\n${file.content.slice(0, 8000)}\n\`\`\`\n\nDemande: ${text || "Balise ce document automatiquement"}`;

    const apiMsgs = [
      ...messages.filter(m => !m.loading).map(m => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userContent },
    ];
    const templates = JSON.parse(localStorage.getItem("milaf_templates") ?? "[]");

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMsgs, apiKey: key, templates }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        setMessages(p => p.map(m => m.loading ? { ...m, loading: false, content: `❌ ${err.error ?? "Erreur"}` } : m));
        setStreaming(false); return;
      }

      const reader = resp.body!.getReader();
      const dec = new TextDecoder();
      let buf = "", full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") continue;
          try {
            const ev = JSON.parse(raw);
            if (ev.type === "content_block_delta" && ev.delta?.text) {
              full += ev.delta.text;
              setMessages(p => p.map(m => m.loading ? { ...m, content: full } : m));
            }
          } catch {}
        }
      }
      const { cleaned, actions } = parseActions(full);
      setMessages(p => p.map(m => m.loading ? { ...m, loading: false, content: cleaned || full, actions } : m));
    } catch (e: any) {
      setMessages(p => p.map(m => m.loading ? { ...m, loading: false, content: `❌ ${e.message}` } : m));
    } finally { setStreaming(false); }
  }, [apiKey, messages, streaming, file]);

  return (
    <div className="flex flex-col h-full bg-[#06070c]">
      {/* No-key banner */}
      {noKey && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex-wrap">
          <span>⚠️ Clé API Claude requise.</span>
          <button onClick={() => {
            const k = prompt("Clé API Claude (sk-ant-…) :");
            if (k) { localStorage.setItem("milaf_claude_api_key", k); setApiKey(k); setNoKey(false); }
          }} className="font-semibold underline">Configurer</button>
          <a href="/settings" className="ml-auto hover:text-amber-200">Paramètres →</a>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2235]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-900/30">M</div>
          <div>
            <div className="text-sm font-bold text-white">Mi-Laf IA</div>
            <div className="text-[10px] text-[#6b7290]">Décrivez · Uploadez · Générez</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-semibold">Claude Opus · Tokens complets</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center pt-6 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/20 flex items-center justify-center text-3xl mx-auto mb-4">✦</div>
              <h2 className="text-xl font-bold text-white mb-2">Que voulez-vous créer ?</h2>
              <p className="text-[#6b7290] text-sm max-w-md mx-auto leading-relaxed mb-6">
                Décrivez votre document en langage naturel. Mi-Laf génère le template complet,
                balise vos fichiers existants, et remplit vos documents — sans que vous ayez à
                comprendre la technique.
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
                <span className="text-sm text-[#6b7290] group-hover:text-indigo-300 transition-colors">Uploader un document à baliser automatiquement</span>
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
              placeholder="Décrivez le document, uploadez un fichier, ou demandez une génération…"
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
          <p className="text-[10px] text-[#3a3f5c] text-center mt-2">Entrée pour envoyer · Maj+Entrée pour retour à la ligne · Claude Opus consomme les tokens pour un résultat complet</p>
        </div>
      </div>
      <input ref={fileRef} type="file" className="hidden" accept=".txt,.docx,.pdf,.doc,.html,.md,.csv"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}
