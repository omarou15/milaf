"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

// ── Types ──────────────────────────────────────────────────────────────
interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: MilafAction;
  pending?: boolean;
}

interface MilafAction {
  type: "create_template" | "tag_document";
  data: any;
  saved?: boolean;
}

const SUGGESTIONS = [
  { icon: "📝", text: "Crée-moi un devis professionnel pour un plombier", label: "Devis plombier" },
  { icon: "⚡", text: "Génère un template d'attestation CEE isolation thermique avec tous les champs obligatoires", label: "Attestation CEE" },
  { icon: "🏠", text: "Crée un contrat de location meublée conforme à la loi ALUR", label: "Contrat location" },
  { icon: "📊", text: "Je veux un template de facture avec TVA à 20% et mentions légales complètes", label: "Facture avec TVA" },
  { icon: "⚖️", text: "Crée un modèle de mise en demeure professionnel", label: "Mise en demeure" },
  { icon: "🔧", text: "Template de bon de commande pour artisan BTP", label: "Bon de commande BTP" },
];

// ── Helpers ────────────────────────────────────────────────────────────
function parseAction(text: string): { clean: string; action: MilafAction | null } {
  const re = /<milaf_action type="([^"]+)">([\s\S]*?)<\/milaf_action>/;
  const m = text.match(re);
  if (!m) return { clean: text, action: null };
  try {
    const data = JSON.parse(m[2].trim());
    return {
      clean: text.replace(re, "").trim(),
      action: { type: m[1] as MilafAction["type"], data },
    };
  } catch {
    return { clean: text, action: null };
  }
}

function uid() { return Math.random().toString(36).slice(2); }

// ── Main component ─────────────────────────────────────────────────────
export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [noKey, setNoKey] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    const k = localStorage.getItem("milaf_claude_api_key") || "";
    setApiKey(k);
    setNoKey(!k);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Auto-resize textarea
  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = "auto";
      textRef.current.style.height = Math.min(textRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const saveTemplateToStorage = useCallback((action: MilafAction) => {
    const existing = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
    const tpl = {
      id: uid(),
      name: action.data.name,
      description: action.data.description ?? "",
      tier: action.data.tier ?? 1,
      category: action.data.category ?? "autre",
      fields: action.data.fields ?? [],
      wordContent: action.data.wordContent ?? "",
      createdAt: new Date().toISOString(),
      source: "ai-chat",
    };
    localStorage.setItem("milaf_templates", JSON.stringify([...existing, tpl]));
    return tpl.id;
  }, []);

  const handleAction = useCallback((msgId: string, action: MilafAction) => {
    const tplId = saveTemplateToStorage(action);
    setMsgs(prev => prev.map(m =>
      m.id === msgId ? { ...m, action: { ...action, saved: true } } : m
    ));
    // Add confirmation message
    const confirm: Msg = {
      id: uid(),
      role: "assistant",
      content: `✅ **Template "${action.data.name}" sauvegardé !** Il est maintenant disponible dans vos templates. Vous pouvez générer un document immédiatement.`,
      action: undefined,
    };
    setMsgs(prev => [...prev, confirm]);
    setTimeout(() => router.push(`/generate?templateId=${tplId}`), 1200);
  }, [saveTemplateToStorage, router]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    if (!apiKey) { setNoKey(true); return; }

    const userMsg: Msg = { id: uid(), role: "user", content: text.trim() };
    const assistantId = uid();
    const assistantMsg: Msg = { id: assistantId, role: "assistant", content: "", pending: true };

    setMsgs(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    setLoading(true);

    const history = [...msgs, userMsg].map(m => ({ role: m.role, content: m.content }));
    const templates = JSON.parse(localStorage.getItem("milaf_templates") || "[]");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, apiKey, templates }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMsgs(prev => prev.map(m => m.id === assistantId
          ? { ...m, content: `❌ ${err.error}`, pending: false }
          : m
        ));
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let full = "";

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
            const evt = JSON.parse(raw);
            if (evt.type === "content_block_delta" && evt.delta?.text) {
              full += evt.delta.text;
              setMsgs(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: full, pending: true } : m
              ));
            }
          } catch {}
        }
      }

      // Parse action from final response
      const { clean, action } = parseAction(full);
      setMsgs(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: clean, action: action ?? undefined, pending: false } : m
      ));
    } catch (e: any) {
      setMsgs(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: `❌ Erreur réseau. Réessayez.`, pending: false }
        : m
      ));
    } finally {
      setLoading(false);
    }
  }, [msgs, loading, apiKey]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      send(`Voici le contenu de mon document "${file.name}". Balise-le automatiquement avec des champs Mi-Laf :\n\n${content.slice(0, 8000)}`);
    };
    if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      reader.readAsText(file);
    } else {
      send(`J'ai uploadé un fichier "${file.name}" (${file.type}). Peux-tu me créer un template adapté à ce type de document ?`);
    }
  }, [send]);

  const isEmpty = msgs.length === 0;

  return (
    <div
      className="flex flex-col h-full bg-[#06070c]"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2235] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm">✦</div>
          <div>
            <h1 className="text-sm font-bold text-white">Mi-Laf IA</h1>
            <p className="text-[10px] text-[#6b7290]">Balisage auto · Création de templates · Génération guidée</p>
          </div>
        </div>
        {apiKey ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-semibold">Claude connecté</span>
          </div>
        ) : (
          <button onClick={() => router.push("/settings")}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full hover:bg-red-500/20 transition-colors">
            <span className="text-[10px] text-red-400 font-semibold">⚠ Clé API requise</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6 px-4 py-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center text-3xl">✦</div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Que voulez-vous créer ?</h2>
              <p className="text-[#6b7290] text-sm max-w-md leading-relaxed">
                Décrivez votre document en français naturel. Je m&apos;occupe du balisage, de la structure et de la mise en page — vous n&apos;avez rien à faire techniquement.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(s => (
                <button key={s.label} onClick={() => send(s.text)}
                  className="flex items-center gap-2.5 px-3 py-2.5 bg-[#0d0f18] border border-[#1e2235] rounded-xl hover:border-[#2a2f48] hover:bg-[#0f1120] transition-all text-left group">
                  <span className="text-lg flex-shrink-0">{s.icon}</span>
                  <span className="text-xs text-[#9ca3af] group-hover:text-white transition-colors leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#3a3f5c]">💡 Vous pouvez aussi glisser-déposer un document ici pour le faire baliser automatiquement</p>
          </div>
        ) : (
          msgs.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
                  : "bg-[#1e2235] text-[#6b7290]"
              }`}>
                {msg.role === "assistant" ? "✦" : "U"}
              </div>

              <div className={`flex flex-col gap-2 max-w-[82%] ${msg.role === "user" ? "items-end" : ""}`}>
                {/* Bubble */}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-[#0d0f18] border border-[#1e2235] text-[#d1d5db] rounded-tl-sm"
                }`}>
                  {msg.pending && !msg.content && (
                    <div className="flex gap-1 py-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i*120}ms` }} />
                      ))}
                    </div>
                  )}
                  {msg.content && (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                  {msg.pending && msg.content && (
                    <span className="inline-block w-1 h-4 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>

                {/* Action card */}
                {msg.action && !msg.action.saved && (
                  <div className="bg-[#0a0b14] border border-indigo-500/30 rounded-2xl p-4 w-full">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center text-xl flex-shrink-0">
                        {msg.action.type === "create_template" ? "📝" : "🏷️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-white">{msg.action.data.name}</span>
                          <span className="text-[10px] bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">
                            Tier {msg.action.data.tier ?? 1}
                          </span>
                        </div>
                        <p className="text-xs text-[#6b7290] mb-2">{msg.action.data.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(msg.action.data.fields ?? []).slice(0, 6).map((f: any) => (
                            <span key={f.key} className="text-[10px] bg-[#1e2235] text-[#6b7290] px-1.5 py-0.5 rounded-md font-mono">
                              {`{{${f.key}}}`}
                            </span>
                          ))}
                          {(msg.action.data.fields ?? []).length > 6 && (
                            <span className="text-[10px] text-[#6b7290]">+{msg.action.data.fields.length - 6} autres</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(msg.id, msg.action!)}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors">
                            ✓ Sauvegarder le template
                          </button>
                          <button
                            onClick={() => setMsgs(prev => prev.map(m => m.id === msg.id ? { ...m, action: undefined } : m))}
                            className="px-3 py-2 bg-[#1e2235] hover:bg-[#2a2f48] text-[#6b7290] text-xs rounded-xl transition-colors">
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {msg.action?.saved && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <span className="text-emerald-400 text-xs">✓</span>
                    <span className="text-xs text-emerald-400">Template sauvegardé — redirection vers Générer…</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* No API key warning */}
      {noKey && (
        <div className="mx-4 mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <div className="flex-1">
            <p className="text-xs text-amber-300 font-semibold">Clé API Claude manquante</p>
            <p className="text-[10px] text-[#6b7290]">Configurez votre clé dans Paramètres pour utiliser le chat IA.</p>
          </div>
          <button onClick={() => router.push("/settings")}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex-shrink-0">
            Configurer →
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl overflow-hidden focus-within:border-indigo-500/50 transition-colors">
          <textarea
            ref={textRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={loading}
            rows={1}
            placeholder={loading ? "Mi-Laf IA réfléchit…" : "Décrivez votre document ou glissez-déposez un fichier…"}
            className="w-full bg-transparent px-4 pt-3.5 pb-2 text-sm text-white placeholder-[#3a3f5c] resize-none outline-none leading-relaxed disabled:opacity-50"
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            <div className="flex gap-2">
              <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e2235] hover:bg-[#2a2f48] text-[#6b7290] hover:text-white rounded-lg text-xs cursor-pointer transition-colors">
                <span>📎</span> Fichier
                <input type="file" className="hidden" accept=".txt,.md,.docx,.pdf"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = ev => {
                      const c = ev.target?.result as string;
                      send(`Voici le contenu de mon document "${f.name}". Balise-le automatiquement :\n\n${c.slice(0, 8000)}`);
                    };
                    if (f.type.includes("text") || f.name.endsWith(".txt")) r.readAsText(f);
                    else send(`J'ai un document "${f.name}" (${f.type}). Crée-moi un template adapté.`);
                  }}
                />
              </label>
              {msgs.length > 0 && (
                <button onClick={() => setMsgs([])}
                  className="px-2.5 py-1.5 bg-[#1e2235] hover:bg-[#2a2f48] text-[#6b7290] hover:text-white rounded-lg text-xs transition-colors">
                  ↺ Nouveau
                </button>
              )}
            </div>
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors">
              {loading ? (
                <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Génération…</>
              ) : (
                <>Envoyer <span>↵</span></>
              )}
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-[#3a3f5c] mt-2">Shift+Enter pour saut de ligne · Glisser-déposer un fichier pour balisage auto</p>
      </div>
    </div>
  );
}
