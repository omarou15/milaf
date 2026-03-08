"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBilling, getCreditsRemaining, PLANS } from "@/lib/billing/plans";
import { getAutomations } from "@/lib/automations/store";

export default function DashboardPage() {
  const [data, setData] = useState<{
    templates: any[];
    docs: any[];
    automations: any[];
    billing: ReturnType<typeof getBilling> | null;
  }>({ templates: [], docs: [], automations: [], billing: null });
  const router = useRouter();

  useEffect(() => {
    const b = getBilling();
    if (!b.onboardingComplete) { router.replace("/onboarding"); return; }
    const templates = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
    const docs = JSON.parse(localStorage.getItem("milaf_documents") || "[]");
    const automations = getAutomations();
    setData({ templates, docs, automations, billing: b });
  }, [router]);

  const { templates, docs, automations, billing } = data;
  if (!billing) return null;

  const plan = PLANS[billing.planId];
  const creditsLeft = getCreditsRemaining();
  const pct = Math.min(100, Math.round((billing.creditsUsed / billing.creditsTotal) * 100));
  const activeAuto = automations.filter(a => a.status === "active").length;
  const totalRuns = automations.reduce((s, a) => s + a.runCount, 0);
  const recentDocs = [...docs].slice(0, 5);
  const recentTemplates = [...templates].slice(-4).reverse();

  const QUICK = [
    { href: "/templates/new", icon: "📝", label: "Nouveau template", color: "indigo" },
    { href: "/generate", icon: "⚡", label: "Générer", color: "cyan" },
    { href: "/automations", icon: "⟳", label: "Automation", color: "purple" },
    { href: "/marketplace", icon: "🏪", label: "Marketplace", color: "emerald" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#06070c] px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-[#6b7290] text-sm mt-0.5">Bienvenue sur Mi-Laf ملف</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0d0f18] border border-[#1e2235] rounded-xl">
          <span className="text-sm">{plan.emoji}</span>
          <span className="text-xs font-semibold" style={{ color: plan.color }}>{plan.name}</span>
          <span className="text-xs text-[#6b7290]">· {creditsLeft} crédits</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Templates", value: templates.length, icon: "◈", color: "#3B5BDB", href: "/templates" },
          { label: "Documents", value: docs.length, icon: "✦", color: "#2ee8c8", href: "/generate" },
          { label: "Automations actives", value: activeAuto, icon: "⟳", color: "#a16ef8", href: "/automations" },
          { label: "Total exécutions", value: totalRuns, icon: "▶", color: "#f59e0b", href: "/automations" },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="p-4 bg-[#0d0f18] border border-[#1e2235] rounded-2xl hover:border-[#2a2f48] transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg" style={{ color: s.color }}>{s.icon}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-[#3a3f5c] group-hover:text-[#6b7290] transition-colors"><path d="M9 18l6-6-6-6"/></svg>
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-[#6b7290] mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Credits bar */}
      <div className="p-4 bg-[#0d0f18] border border-[#1e2235] rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#6b7290]">Crédits ce mois</span>
          <Link href="/settings" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Gérer →</Link>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-white">{creditsLeft}</span>
          <span className="text-sm text-[#6b7290]">/ {billing.creditsTotal} restants</span>
        </div>
        <div className="h-2 bg-[#1e2235] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 80 ? "#ef4444" : plan.color }} />
        </div>
        {pct > 80 && (
          <p className="text-xs text-red-400 mt-1.5">⚠ Peu de crédits restants. <Link href="/settings" className="underline">Upgrader</Link></p>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider mb-3">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {QUICK.map(q => (
            <Link key={q.href} href={q.href}
              className="flex items-center gap-2.5 p-3 bg-[#0d0f18] border border-[#1e2235] rounded-xl hover:border-[#2a2f48] transition-all text-sm font-medium text-white">
              <span className="text-base">{q.icon}</span>{q.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recent documents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider">Documents récents</h2>
            <Link href="/generate" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Voir tout</Link>
          </div>
          <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl overflow-hidden">
            {recentDocs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[#6b7290] text-sm">Aucun document généré</p>
                <Link href="/generate" className="text-xs text-indigo-400 mt-1 block hover:text-indigo-300 transition-colors">Générer votre premier document →</Link>
              </div>
            ) : (
              recentDocs.map((d: any, i: number) => (
                <div key={d.id ?? i} className={`flex items-center gap-3 px-4 py-3 ${i < recentDocs.length - 1 ? "border-b border-[#1a1e30]" : ""}`}>
                  <span className="text-xl flex-shrink-0">{d.tier === 2 ? "📄" : "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate font-medium">{d.name ?? d.filename ?? "Document"}</div>
                    <div className="text-xs text-[#6b7290]">{d.templateName ?? ""} · {d.createdAt ? new Date(d.createdAt).toLocaleDateString("fr-FR") : ""}</div>
                  </div>
                  {d.source?.startsWith("automation:") && (
                    <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">auto</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Templates */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider">Mes templates</h2>
            <Link href="/templates" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Voir tout</Link>
          </div>
          <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl overflow-hidden">
            {recentTemplates.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[#6b7290] text-sm">Aucun template</p>
                <Link href="/templates/new" className="text-xs text-indigo-400 mt-1 block hover:text-indigo-300 transition-colors">Créer votre premier template →</Link>
              </div>
            ) : (
              recentTemplates.map((t: any, i: number) => (
                <div key={t.id ?? i} className={`flex items-center gap-3 px-4 py-3 ${i < recentTemplates.length - 1 ? "border-b border-[#1a1e30]" : ""}`}>
                  <span className="text-xl flex-shrink-0">{t.tier === 2 ? "📄" : "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate font-medium">{t.name ?? t.schema?.templateName ?? "Template"}</div>
                    <div className="text-xs text-[#6b7290]">Tier {t.tier ?? 1} · {t.fields?.length ?? t.schema?.fieldCount ?? 0} champs</div>
                  </div>
                  <Link href={`/generate?templateId=${t.id}`}
                    className="text-xs px-2 py-1 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-colors flex-shrink-0">
                    Générer
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Empty state if totally new */}
      {templates.length === 0 && docs.length === 0 && automations.length === 0 && (
        <div className="p-6 bg-gradient-to-br from-indigo-600/10 to-cyan-600/5 border border-indigo-500/20 rounded-2xl">
          <h3 className="text-base font-bold text-white mb-2">🚀 Démarrez en 3 étapes</h3>
          <ol className="space-y-2 text-sm text-[#6b7290]">
            <li><Link href="/templates/new" className="text-indigo-400 hover:text-indigo-300 transition-colors">1. Créer un template</Link> — Word balisé ou PDF AcroForm</li>
            <li><Link href="/generate" className="text-indigo-400 hover:text-indigo-300 transition-colors">2. Générer un document</Link> — Remplissez les champs, téléchargez</li>
            <li><Link href="/automations" className="text-indigo-400 hover:text-indigo-300 transition-colors">3. Automatiser</Link> — Webhook, cron ou API pour la génération en masse</li>
          </ol>
        </div>
      )}
    </div>
  );
}
