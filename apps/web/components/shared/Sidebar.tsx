"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/dashboard", icon: "⊡", label: "Dashboard" },
  { href: "/templates", icon: "◈", label: "Templates" },
  { href: "/generate", icon: "✦", label: "Générer" },
  { href: "/automations", icon: "⟳", label: "Automatisations" },
  { href: "/marketplace", icon: "⊞", label: "Marketplace" },
  { href: "/settings", icon: "⚙", label: "Paramètres" },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} />}
      <button onClick={() => setOpen(true)} className="lg:hidden fixed top-4 left-4 z-30 w-9 h-9 bg-[#0d0f18] border border-[#181c2c] rounded-lg flex items-center justify-center text-white">☰</button>
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-[#0d0f18] border-r border-[#181c2c] flex flex-col transform transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-[#181c2c] flex items-center justify-between">
          <div>
            <span className="font-bold text-[#3B5BDB] text-lg">Mi-Laf</span>
            <span className="text-white/40 ml-2 text-sm">ملف</span>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-[#6b7290]">✕</button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(n => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? "bg-[#3B5BDB]/15 text-[#3B5BDB]" : "text-[#6b7290] hover:text-white hover:bg-white/5"}`}>
                <span className="text-base w-5 text-center">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#181c2c] flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-xs text-[#6b7290]">Mon compte</span>
        </div>
      </aside>
    </>
  );
}
