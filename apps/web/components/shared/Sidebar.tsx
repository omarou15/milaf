"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getBilling, getCreditsRemaining, PLANS } from "@/lib/billing/plans";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const NAV = [
  { href: "/dashboard",    icon: "⊡", label: "Dashboard" },
  { href: "/chat",         icon: "✦", label: "IA Chat", badge: "NEW" },
  { href: "/clone",        icon: "🧬", label: "Clone IA", badge: "T4" },
  { href: "/templates",    icon: "◈", label: "Templates" },
  { href: "/generate",     icon: "⚡", label: "Générer" },
  { href: "/automations",  icon: "⟳", label: "Automatisations" },
  { href: "/marketplace",  icon: "⊞", label: "Marketplace" },
  { href: "/settings",     icon: "⚙", label: "Paramètres" },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [credits, setCredits] = useState<{ used: number; total: number; planId: string } | null>(null);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const b = getBilling();
    setCredits({ used: b.creditsUsed, total: b.creditsTotal, planId: b.planId });
  }, [pathname]); // refresh on nav

  const plan = credits ? PLANS[credits.planId as keyof typeof PLANS] : null;
  const remaining = credits ? Math.max(0, credits.total - credits.used) : 0;
  const pct = credits ? Math.min(100, Math.round((credits.used / credits.total) * 100)) : 0;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} />}
      <button onClick={() => setOpen(true)} className="lg:hidden fixed top-4 left-4 z-30 w-9 h-9 bg-surface border border-theme rounded-lg flex items-center justify-center text-white text-lg">☰</button>

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-surface border-r border-theme flex flex-col transform transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="p-5 border-b border-theme flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">M</div>
            <div>
              <span className="font-bold text-white text-sm">Mi-Laf</span>
              <span className="text-muted ml-1.5 text-xs">ملف</span>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-secondary hover:text-white">✕</button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(n => {
            const active = pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20" : "text-secondary hover:text-white hover:bg-white/5 border border-transparent"}`}>
                <span className="text-base w-5 text-center">{n.icon}</span>
                <span className="flex-1">{n.label}</span>
                {(n as any).badge && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-600 text-white rounded-full">{(n as any).badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Credits widget */}
        {credits && plan && (
          <Link href="/settings" className="mx-3 mb-2 p-3 bg-page border border-theme rounded-xl hover:border-[#2a2f48] transition-colors block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider">Crédits</span>
              <span className="text-[10px] font-semibold" style={{ color: plan.color }}>{plan.name}</span>
            </div>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="text-lg font-bold text-white">{remaining}</span>
              <span className="text-xs text-secondary">/ {credits.total}</span>
            </div>
            <div className="h-1.5 bg-[#1e2235] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: pct > 80 ? "#ef4444" : plan.color }} />
            </div>
            {pct > 80 && <p className="text-[10px] text-red-400 mt-1">Upgrade recommandé</p>}
          </Link>
        )}

        {/* User */}
        <div className="p-4 border-t border-theme flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-xs text-secondary flex-1">Mon compte</span>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
