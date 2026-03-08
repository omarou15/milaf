"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PLANS, ORDERED_PLANS, getBilling, saveBilling, BillingState, PlanId, getCreditsRemaining } from "@/lib/billing/plans";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-[10px] px-2 py-1 border border-[#1e2235] rounded-lg text-[#6b7290] hover:text-white hover:border-[#2a2f48] transition-colors">
      {copied ? "✓ Copié" : "Copier"}
    </button>
  );
}

export default function SettingsPage() {
  const [billing, setBillingState] = useState<BillingState | null>(null);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [upgrading, setUpgrading] = useState<PlanId | null>(null);
  const [tab, setTab] = useState<"plan" | "api" | "account">("plan");
  const searchParams = useSearchParams();

  useEffect(() => {
    const b = getBilling();
    setBillingState(b);
    setCycle(b.billingCycle ?? "monthly");
    if (searchParams.get("upgraded") === "1") {
      // Could show a toast here
    }
  }, [searchParams]);

  const handleUpgrade = async (planId: PlanId) => {
    if (!billing) return;
    setUpgrading(planId);
    const plan = PLANS[planId];

    if (planId === "free") {
      saveBilling({ ...billing, planId: "free", creditsTotal: 10 });
      setBillingState(getBilling());
      setUpgrading(null);
      return;
    }

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, cycle }),
      });
      const data = await res.json();

      if (data.url) {
        // Stripe checkout — redirect
        window.location.href = data.url;
        return;
      }

      // Stripe not configured — demo mode (localStorage)
      saveBilling({ ...billing, planId, creditsTotal: plan.credits, creditsUsed: 0, billingCycle: cycle });
      setBillingState(getBilling());
    } catch {
      // Fallback demo mode
      saveBilling({ ...billing, planId, creditsTotal: plan.credits, creditsUsed: 0, billingCycle: cycle });
      setBillingState(getBilling());
    }
    setUpgrading(null);
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {}
  };
    setUpgrading(null);
  };

  if (!billing) return null;

  const currentPlan = PLANS[billing.planId];
  const creditsRemaining = getCreditsRemaining();
  const creditsPercent = Math.round((billing.creditsUsed / billing.creditsTotal) * 100);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#06070c]">
      <div className="border-b border-[#181c2c] px-6 py-5 flex-shrink-0">
        <h1 className="text-lg font-bold text-white">Paramètres</h1>
        <p className="text-[#6b7290] text-sm mt-0.5">Gérez votre plan, crédits et compte</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
        {(["plan", "api", "account"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${tab === t ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-[#6b7290] hover:text-white"}`}>
            {t === "plan" ? "Plan & Crédits" : t === "api" ? "API & Webhooks" : "Compte"}
          </button>
        ))}
      </div>

      <div className="flex-1 px-6 py-5 space-y-5 max-w-3xl">

        {/* ── TAB: Plan ── */}
        {tab === "plan" && (
          <>
            {/* Current plan summary */}
            <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs text-[#6b7290] mb-1">Plan actuel</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{currentPlan.emoji}</span>
                    <span className="text-xl font-bold text-white">{currentPlan.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border font-semibold"
                      style={{ color: currentPlan.color, borderColor: `${currentPlan.color}40`, background: `${currentPlan.color}15` }}>
                      {billing.billingCycle === "yearly" ? "Annuel" : "Mensuel"}
                    </span>
                  </div>
                  {currentPlan.price > 0 && (
                    <div className="text-sm text-[#6b7290] mt-1">
                      {billing.billingCycle === "yearly" ? currentPlan.priceYearly : currentPlan.price}€/mois
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#6b7290] mb-1">Crédits ce mois</div>
                  <div className="text-2xl font-bold text-white">{creditsRemaining}<span className="text-sm text-[#6b7290] font-normal"> / {billing.creditsTotal}</span></div>
                </div>
              </div>

              {/* Credits bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-[#6b7290] mb-1.5">
                  <span>{billing.creditsUsed} utilisés</span>
                  <span>{creditsPercent}%</span>
                </div>
                <div className="h-2 bg-[#1e2235] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(creditsPercent, 100)}%`, background: creditsPercent > 80 ? "#ef4444" : currentPlan.color }} />
                </div>
                {creditsPercent > 80 && (
                  <p className="text-xs text-red-400 mt-1.5">⚠ Il vous reste peu de crédits. Pensez à upgrader.</p>
                )}
              </div>
              {billing.planId !== "free" && (
                <button onClick={handleManageSubscription}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Gérer mon abonnement / Factures →
                </button>
              )}
            </div>

            {/* Billing cycle toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#6b7290]">Facturation :</span>
              <div className="flex gap-1 bg-[#0d0f18] border border-[#1e2235] rounded-xl p-1">
                {(["monthly","yearly"] as const).map(c => (
                  <button key={c} onClick={() => setCycle(c)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${cycle === c ? "bg-indigo-600 text-white" : "text-[#6b7290] hover:text-white"}`}>
                    {c === "monthly" ? "Mensuel" : "Annuel −18%"}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["free","starter","pro","business"] as PlanId[]).map(pid => {
                const p = PLANS[pid];
                const price = cycle === "yearly" ? p.priceYearly : p.price;
                const isCurrent = billing.planId === pid;
                const isUpgrade = ORDERED_PLANS.indexOf(pid) > ORDERED_PLANS.indexOf(billing.planId);
                const isDowngrade = ORDERED_PLANS.indexOf(pid) < ORDERED_PLANS.indexOf(billing.planId);
                return (
                  <div key={pid}
                    className={`p-4 rounded-2xl border relative transition-all ${isCurrent ? "border-2" : "border border-[#1e2235]"}`}
                    style={isCurrent ? { borderColor: p.color, background: `${p.color}08` } : {}}>
                    {pid === "pro" && !isCurrent && (
                      <div className="absolute -top-2.5 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">Populaire</div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-2.5 right-4 text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white" style={{ background: p.color }}>Plan actuel</div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-2xl">{p.emoji}</span>
                        <div className="text-base font-bold text-white mt-1">{p.name}</div>
                        <div className="text-sm font-bold mt-0.5" style={{ color: p.color }}>
                          {price === 0 ? "Gratuit" : `${price}€/mois`}
                        </div>
                        <div className="text-[10px] text-[#6b7290]">{p.credits} crédits/mois</div>
                      </div>
                    </div>
                    <ul className="space-y-1 mb-4">
                      {p.features.map(f => (
                        <li key={f} className="text-[11px] text-[#6b7290] flex items-start gap-1.5">
                          <span style={{ color: p.color }} className="flex-shrink-0 mt-0.5">✓</span>{f}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <button onClick={() => handleUpgrade(pid)} disabled={upgrading === pid}
                        className="w-full py-2 rounded-xl text-xs font-semibold transition-colors text-white disabled:opacity-40"
                        style={{ background: isUpgrade ? p.color : "#1e2235", color: isDowngrade ? "#6b7290" : "white" }}>
                        {upgrading === pid ? "Chargement…" : isUpgrade ? `Passer à ${p.name}` : isDowngrade ? `Rétrograder` : "Choisir"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── TAB: API ── */}
        {tab === "api" && (
          <>
            <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-5 space-y-5">
              <div>
                <div className="text-sm font-semibold text-white mb-3">Endpoints disponibles</div>
                {[
                  { method: "POST", path: "/api/templates/generate", desc: "Génère un document Word (Tier 1)" },
                  { method: "POST", path: "/api/pdf/generate", desc: "Génère un PDF AcroForm (Tier 2)" },
                  { method: "GET",  path: "/api/modules", desc: "Liste les modules marketplace" },
                  { method: "POST", path: "/api/automations/{id}/run", desc: "Déclenche une automation" },
                  { method: "POST", path: "/api/automations/webhook/{id}", desc: "Webhook entrant" },
                ].map(e => (
                  <div key={e.path} className="flex items-center gap-3 py-2.5 border-b border-[#1a1e30] last:border-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${e.method === "GET" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                      {e.method}
                    </span>
                    <code className="text-xs text-indigo-300 flex-1 truncate">{e.path}</code>
                    <span className="text-[10px] text-[#6b7290] hidden sm:block">{e.desc}</span>
                    <CopyBtn text={`https://milaf.vercel.app${e.path}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-5">
              <div className="text-sm font-semibold text-white mb-3">Webhook Stripe</div>
              <div className="text-xs text-[#6b7290] mb-3">Configurez cette URL dans votre dashboard Stripe → Webhooks</div>
              <div className="flex items-center gap-2 bg-[#0a0b12] border border-[#1e2235] rounded-xl px-3 py-2.5">
                <code className="flex-1 text-xs text-emerald-300">https://milaf.vercel.app/api/billing/webhook</code>
                <CopyBtn text="https://milaf.vercel.app/api/billing/webhook" />
              </div>
              <div className="mt-3 text-[10px] text-[#6b7290]">
                Événements requis : <code className="text-indigo-300">checkout.session.completed</code>, <code className="text-indigo-300">customer.subscription.deleted</code>, <code className="text-indigo-300">invoice.payment_failed</code>
              </div>
            </div>

            {!PLANS[billing.planId].limits.apiAccess && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-xs text-yellow-400">
                ⚠ L&apos;accès API complet est disponible à partir du plan <strong>Pro</strong>.
                <button onClick={() => { setTab("plan"); }} className="ml-2 underline">Voir les plans</button>
              </div>
            )}
          </>
        )}

        {/* ── TAB: Account ── */}
        {tab === "account" && (
          <>
            <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-5 space-y-4">
              <div className="text-sm font-semibold text-white">Réinitialiser l&apos;onboarding</div>
              <p className="text-xs text-[#6b7290]">Relancez le wizard de configuration depuis le début.</p>
              <button onClick={() => {
                const b = getBilling();
                saveBilling({ ...b, onboardingComplete: false });
                window.location.href = "/onboarding";
              }} className="px-4 py-2 text-xs border border-[#1e2235] rounded-xl text-[#6b7290] hover:text-white hover:border-[#2a2f48] transition-colors">
                Relancer l&apos;onboarding
              </button>
            </div>

            <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-5 space-y-4">
              <div className="text-sm font-semibold text-white">Données locales</div>
              <p className="text-xs text-[#6b7290]">Effacez toutes vos données locales (templates, documents, automatisations).</p>
              <button onClick={() => {
                if (!confirm("Supprimer toutes les données locales ? Cette action est irréversible.")) return;
                ["milaf_templates","milaf_documents","milaf_automations","milaf_automation_runs","milaf_billing"].forEach(k => localStorage.removeItem(k));
                window.location.reload();
              }} className="px-4 py-2 text-xs border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                Effacer toutes les données
              </button>
            </div>

            <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-5">
              <div className="text-sm font-semibold text-white mb-3">Version</div>
              <div className="text-xs text-[#6b7290] space-y-1">
                <div>Mi-Laf <span className="text-white">v0.5.0</span> — Sprint 5</div>
                <div>Moteur <span className="text-white">Tier 1 (Word) + Tier 2 (PDF AcroForm)</span></div>
                <div>Modules <span className="text-white">CEE France</span></div>
                <div>Automations <span className="text-white">Cron · Webhook · API</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
