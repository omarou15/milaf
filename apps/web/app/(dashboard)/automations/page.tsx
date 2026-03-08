"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Automation, AutomationRun,
  getAutomations, createAutomation, updateAutomation, deleteAutomation, getRuns,
  generateWebhookUrl, generateWebhookSecret, describeCron,
} from "@/lib/automations/store";
import { runAutomation } from "@/lib/automations/engine";

const Icon = {
  Play: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M5 3l14 9-14 9V3z"/></svg>,
  Pause: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M8 6V4h8v2"/></svg>,
  Copy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5"><path d="M20 6L9 17l-5-5"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M9 18l6-6-6-6"/></svg>,
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Actif", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    paused: { label: "Pausé", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    error:  { label: "Erreur", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
    draft:  { label: "Brouillon", cls: "bg-[#252a40] text-[#6b7290] border-[#2a2f48]" },
  };
  const { label, cls } = map[status] ?? map.draft;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls} inline-flex items-center gap-1`}>
      {status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {label}
    </span>
  );
}

function TriggerChip({ type }: { type: string }) {
  const map: Record<string, string> = {
    cron:    "text-blue-400 bg-blue-500/10 border-blue-500/20",
    webhook: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    api:     "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  };
  const labels: Record<string, string> = { cron: "Planifié", webhook: "Webhook", api: "API" };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[type] ?? ""}`}>{labels[type] ?? type}</span>;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-[#6b7290] hover:text-white transition-colors p-1">
      {copied ? <Icon.Check /> : <Icon.Copy />}
    </button>
  );
}

function NewAutomationModal({ onClose, onCreated }: { onClose: () => void; onCreated: (a: Automation) => void }) {
  const [step, setStep] = useState(1);
  const [trigger, setTrigger] = useState<"cron" | "webhook" | "api">("cron");
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [cronFreq, setCronFreq] = useState<"daily" | "weekly" | "monthly">("daily");
  const [cronTime, setCronTime] = useState("08:00");
  const [cronDay, setCronDay] = useState(1);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setTemplates(JSON.parse(localStorage.getItem("milaf_templates") || "[]")); }, []);

  const selectedTemplate = templates.find(t => t.id === templateId);

  const handleCreate = () => {
    setSaving(true);
    const secret = generateWebhookSecret();
    const auto = createAutomation({
      name: name || `Automation ${trigger}`,
      status: "active",
      trigger,
      templateId,
      templateName: selectedTemplate?.name ?? "",
      fieldMappings: fields,
      cronConfig: trigger === "cron" ? { frequency: cronFreq, time: cronTime, dayOfWeek: cronFreq === "weekly" ? cronDay : undefined, dayOfMonth: cronFreq === "monthly" ? cronDay : undefined } : undefined,
      webhookConfig: trigger === "webhook" ? { secret } : undefined,
      apiConfig: trigger === "api" ? {} : undefined,
    });
    const webhookUrl = generateWebhookUrl(auto.id);
    updateAutomation(auto.id, { webhookUrl });
    setSaving(false);
    onCreated({ ...auto, webhookUrl });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[#0d0f18] border border-[#1e2235] rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2235]">
          <div>
            <h2 className="font-semibold text-white text-sm">Nouvelle automatisation</h2>
            <p className="text-[#6b7290] text-xs mt-0.5">Étape {step} / 3</p>
          </div>
          <button onClick={onClose} className="text-[#6b7290] hover:text-white"><Icon.X /></button>
        </div>
        <div className="flex gap-1.5 px-6 pt-4">
          {[1,2,3].map(s => <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? "bg-indigo-500" : "bg-[#1e2235]"}`} />)}
        </div>
        <div className="px-6 py-5 space-y-4 min-h-[280px]">
          {step === 1 && (
            <>
              <div>
                <label className="text-xs text-[#6b7290] mb-2 block">Déclencheur</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["cron","webhook","api"] as const).map(t => (
                    <button key={t} onClick={() => setTrigger(t)}
                      className={`p-3 rounded-xl border text-left transition-all ${trigger === t ? "border-indigo-500 bg-indigo-500/10" : "border-[#1e2235] bg-[#0a0b12] hover:border-[#2a2f48]"}`}>
                      <div className="text-xl mb-1">{t === "cron" ? "⏱" : t === "webhook" ? "⚡" : "⟁"}</div>
                      <div className="text-xs font-semibold text-white">{t === "cron" ? "Planifié" : t === "webhook" ? "Webhook" : "API"}</div>
                      <div className="text-[10px] text-[#6b7290] mt-0.5">{t === "cron" ? "Récurrent" : t === "webhook" ? "HTTP externe" : "REST API"}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#6b7290] mb-1.5 block">Nom</label>
                <input className="w-full bg-[#0a0b12] border border-[#1e2235] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3a3f5c] focus:outline-none focus:border-indigo-500"
                  placeholder="Ex. Devis CEE quotidien" value={name} onChange={e => setName(e.target.value)} />
              </div>
              {trigger === "cron" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#6b7290] mb-1.5 block">Fréquence</label>
                    <div className="flex gap-2">
                      {(["daily","weekly","monthly"] as const).map(f => (
                        <button key={f} onClick={() => setCronFreq(f)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${cronFreq === f ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-[#1e2235] text-[#6b7290] hover:border-[#2a2f48]"}`}>
                          {f === "daily" ? "Quotidien" : f === "weekly" ? "Hebdo" : "Mensuel"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-[#6b7290] mb-1.5 block">Heure</label>
                      <input type="time" value={cronTime} onChange={e => setCronTime(e.target.value)}
                        className="w-full bg-[#0a0b12] border border-[#1e2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    {cronFreq !== "daily" && (
                      <div className="flex-1">
                        <label className="text-xs text-[#6b7290] mb-1.5 block">{cronFreq === "weekly" ? "Jour (0=dim)" : "Jour du mois"}</label>
                        <input type="number" min={cronFreq === "weekly" ? 0 : 1} max={cronFreq === "weekly" ? 6 : 31} value={cronDay} onChange={e => setCronDay(+e.target.value)}
                          className="w-full bg-[#0a0b12] border border-[#1e2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <label className="text-xs text-[#6b7290] mb-2 block">Choisir un template</label>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#6b7290]">Aucun template. <a href="/templates/new" className="text-indigo-400 underline">En créer un</a></div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {templates.map((t: any) => (
                    <button key={t.id} onClick={() => setTemplateId(t.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${templateId === t.id ? "border-indigo-500 bg-indigo-500/10" : "border-[#1e2235] bg-[#0a0b12] hover:border-[#2a2f48]"}`}>
                      <span className="text-xl">{t.tier === 2 ? "📄" : "📝"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{t.name}</div>
                        <div className="text-xs text-[#6b7290]">Tier {t.tier ?? 1} · {t.fields?.length ?? 0} champs</div>
                      </div>
                      {templateId === t.id && <span className="text-indigo-400"><Icon.Check /></span>}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <p className="text-xs text-[#6b7290]">Valeurs fixes ou <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">{"{{variable}}"}</code> pour des données dynamiques.</p>
              {(selectedTemplate?.fields?.length ?? 0) > 0 ? (
                <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
                  {selectedTemplate.fields.map((f: any) => (
                    <div key={f.key} className="flex items-center gap-2">
                      <label className="w-28 text-xs text-[#6b7290] truncate flex-shrink-0">{f.label || f.key}</label>
                      <input className="flex-1 bg-[#0a0b12] border border-[#1e2235] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#3a3f5c] focus:outline-none focus:border-indigo-500"
                        placeholder={`{{${f.key}}}`} value={fields[f.key] ?? ""} onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6b7290] italic">Ce template n&apos;a pas de champs définis.</p>
              )}
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#1e2235] flex justify-between">
          <button onClick={() => step > 1 ? setStep(s => s-1) : onClose()}
            className="px-4 py-2 text-xs text-[#6b7290] hover:text-white border border-[#1e2235] rounded-xl transition-colors">
            {step === 1 ? "Annuler" : "Retour"}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s+1)} disabled={step === 2 && !templateId}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-40">
              Suivant
            </button>
          ) : (
            <button onClick={handleCreate} disabled={saving || !templateId}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-40">
              {saving ? "Création…" : "Créer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AutomationDetail({ auto, onClose, onUpdate }: { auto: Automation; onClose: () => void; onUpdate: (a: Automation) => void }) {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => { setRuns(getRuns(auto.id).slice(0, 20)); }, [auto.id]);

  const handleRun = async () => {
    setRunning(true); setRunResult(null);
    const r = await runAutomation(auto, "manual");
    setRunResult({ ok: r.success, msg: r.success ? `✓ ${r.docName}` : r.error ?? "Erreur" });
    setRuns(getRuns(auto.id).slice(0, 20));
    setRunning(false);
    const updated = getAutomations().find(a => a.id === auto.id);
    if (updated) onUpdate(updated);
  };

  const toggleStatus = () => {
    const next = auto.status === "active" ? "paused" : "active";
    const updated = updateAutomation(auto.id, { status: next });
    if (updated) onUpdate(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[#0d0f18] border border-[#1e2235] rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#1e2235] flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-white text-sm truncate">{auto.name}</h2>
              <StatusBadge status={auto.status} />
              <TriggerChip type={auto.trigger} />
            </div>
            <p className="text-[#6b7290] text-xs mt-1">{auto.templateName} · {auto.runCount} exécution{auto.runCount !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="text-[#6b7290] hover:text-white ml-3 flex-shrink-0"><Icon.X /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {auto.trigger === "cron" && auto.cronConfig && (
            <div className="bg-[#0a0b12] border border-[#1e2235] rounded-xl p-3">
              <div className="text-xs text-[#6b7290] mb-1">Planification</div>
              <div className="text-sm text-white">{describeCron(auto.cronConfig)}</div>
            </div>
          )}
          {auto.trigger === "webhook" && auto.webhookUrl && (
            <div className="bg-[#0a0b12] border border-[#1e2235] rounded-xl p-3 space-y-2">
              <div className="text-xs text-[#6b7290]">URL Webhook</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] text-indigo-300 truncate">{auto.webhookUrl}</code>
                <CopyBtn text={auto.webhookUrl} />
              </div>
              {auto.webhookConfig?.secret && (
                <>
                  <div className="text-xs text-[#6b7290]">Secret HMAC</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[11px] text-purple-300 truncate">{auto.webhookConfig.secret}</code>
                    <CopyBtn text={auto.webhookConfig.secret} />
                  </div>
                </>
              )}
            </div>
          )}
          {auto.trigger === "api" && (
            <div className="bg-[#0a0b12] border border-[#1e2235] rounded-xl p-3 space-y-2">
              <div className="text-xs text-[#6b7290]">Endpoint API</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] text-cyan-300 truncate">{`POST /api/automations/${auto.id}/run`}</code>
                <CopyBtn text={`POST /api/automations/${auto.id}/run`} />
              </div>
              <div className="text-[10px] text-[#6b7290]">Body: <code className="text-cyan-300">{"{ \"data\": { \"champ\": \"valeur\" } }"}</code></div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={handleRun} disabled={running || auto.status === "paused"}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors">
              <Icon.Play />{running ? "Exécution…" : "Lancer manuellement"}
            </button>
            <button onClick={toggleStatus}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${auto.status === "active" ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10" : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"}`}>
              {auto.status === "active" ? <><Icon.Pause />Pause</> : <><Icon.Play />Activer</>}
            </button>
          </div>
          {runResult && (
            <div className={`text-xs px-3 py-2 rounded-xl border ${runResult.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              {runResult.msg}
            </div>
          )}
          <div>
            <div className="text-xs text-[#6b7290] mb-2">Historique ({runs.length})</div>
            {runs.length === 0 ? (
              <p className="text-xs text-[#3a3f5c] italic">Aucune exécution pour l&apos;instant.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {runs.map(r => (
                  <div key={r.id} className="flex items-center gap-2 text-xs bg-[#0a0b12] border border-[#1e2235] rounded-lg px-3 py-2">
                    <span className={r.status === "success" ? "text-emerald-400" : "text-red-400"}>{r.status === "success" ? "✓" : "✗"}</span>
                    <span className="text-[#6b7290] flex-1 truncate">{r.docGenerated ?? r.errorMessage ?? "—"}</span>
                    <span className="text-[#3a3f5c] flex-shrink-0">{r.durationMs}ms</span>
                    <span className="text-[#3a3f5c] flex-shrink-0">{new Date(r.createdAt).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<Automation | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(() => setAutomations(getAutomations()), []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer cette automatisation ?")) return;
    deleteAutomation(id);
    load();
    if (selected?.id === id) setSelected(null);
  };

  const filtered = automations.filter(a => {
    if (filter === "all") return true;
    if (filter === "active" || filter === "paused") return a.status === filter;
    return a.trigger === filter;
  });

  const stats = {
    total: automations.length,
    active: automations.filter(a => a.status === "active").length,
    runs: automations.reduce((s,a) => s+a.runCount, 0),
    errors: automations.filter(a => a.lastRunStatus === "error").length,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#06070c]">
      <div className="border-b border-[#181c2c] px-6 py-5 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white">Automatisations</h1>
            <p className="text-[#6b7290] text-sm mt-0.5">Générez des documents automatiquement selon des déclencheurs</p>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors flex-shrink-0">
            <Icon.Plus />Nouvelle
          </button>
        </div>
        {automations.length > 0 && (
          <div className="flex gap-5 mt-4">
            {[
              { label: "Total", value: stats.total, color: "text-white" },
              { label: "Actives", value: stats.active, color: "text-emerald-400" },
              { label: "Exécutions", value: stats.runs, color: "text-blue-400" },
              { label: "Erreurs", value: stats.errors, color: stats.errors > 0 ? "text-red-400" : "text-[#6b7290]" },
            ].map(s => (
              <div key={s.label}>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-[#6b7290]">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {automations.length > 0 && (
        <div className="px-6 py-3 border-b border-[#181c2c] flex gap-2 flex-shrink-0 overflow-x-auto">
          {["all","active","paused","cron","webhook","api"].map(f => {
            const count = f === "all" ? automations.length :
              f === "active" ? stats.active :
              f === "paused" ? automations.filter(a=>a.status==="paused").length :
              automations.filter(a=>a.trigger===f).length;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 ${filter === f ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "border-[#1e2235] text-[#6b7290] hover:text-white hover:border-[#2a2f48]"}`}>
                {f === "all" ? "Tout" : f.charAt(0).toUpperCase()+f.slice(1)}
                <span className="text-[10px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0d0f18] border border-[#1e2235] flex items-center justify-center text-3xl">⚡</div>
            <div>
              <p className="text-white font-semibold">Aucune automatisation</p>
              <p className="text-[#6b7290] text-sm mt-1 max-w-xs">Créez votre première automation pour générer des documents automatiquement.</p>
            </div>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
              <Icon.Plus />Créer une automatisation
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(auto => (
              <div key={auto.id} onClick={() => setSelected(auto)}
                className="group flex items-center gap-4 p-4 bg-[#0d0f18] border border-[#1e2235] rounded-xl hover:border-[#2a2f48] cursor-pointer transition-all">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${auto.status === "active" ? "bg-emerald-400" : auto.status === "paused" ? "bg-yellow-400" : auto.status === "error" ? "bg-red-400" : "bg-[#3a3f5c]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white truncate">{auto.name}</span>
                    <TriggerChip type={auto.trigger} />
                  </div>
                  <div className="text-xs text-[#6b7290] mt-0.5 flex items-center gap-2">
                    <span>{auto.templateName}</span>
                    {auto.trigger === "cron" && auto.cronConfig && <><span>·</span><span>{describeCron(auto.cronConfig)}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-white font-medium">{auto.runCount} run{auto.runCount!==1?"s":""}</div>
                    {auto.lastRunAt && <div className={`text-[10px] ${auto.lastRunStatus==="error"?"text-red-400":"text-[#6b7290]"}`}>{new Date(auto.lastRunAt).toLocaleDateString("fr-FR")}</div>}
                  </div>
                  <button onClick={e=>{e.stopPropagation();handleDelete(auto.id);}}
                    className="opacity-0 group-hover:opacity-100 text-[#6b7290] hover:text-red-400 transition-all p-1">
                    <Icon.Trash />
                  </button>
                  <span className="text-[#3a3f5c]"><Icon.ChevronRight /></span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-[#6b7290] text-sm py-8">Aucune automatisation pour ce filtre.</p>}
          </div>
        )}
      </div>

      {showNew && <NewAutomationModal onClose={() => setShowNew(false)} onCreated={a => { load(); setShowNew(false); setSelected(a); }} />}
      {selected && <AutomationDetail auto={selected} onClose={() => setSelected(null)} onUpdate={updated => { load(); setSelected(updated); }} />}
    </div>
  );
}
