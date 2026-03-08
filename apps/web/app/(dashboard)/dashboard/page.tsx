"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Template { id: string; schema: { templateName: string; tier: string; fieldCount: number }; moduleId?: string; emoji?: string; createdAt: string; }
interface Doc { id: string; filename: string; createdAt: string; }

const TIER_COLOR: Record<string, string> = { tier1_word: "#3B5BDB", tier2_pdf_form: "#2ee8c8", tier3_pixel: "#a16ef8" };
const TIER_LABEL: Record<string, string> = { tier1_word: "T1 Word", tier2_pdf_form: "T2 PDF", tier3_pixel: "T3 Pixel" };

export default function DashboardPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    setTemplates(JSON.parse(localStorage.getItem("milaf_templates") || "[]"));
    setDocs(JSON.parse(localStorage.getItem("milaf_docs") || "[]"));
  }, []);

  const recentTemplates = [...templates].reverse().slice(0, 4);
  const recentDocs = [...docs].reverse().slice(0, 3);

  const stats = [
    { label: "Templates", value: templates.length, icon: "◈", color: "#3B5BDB", href: "/templates" },
    { label: "Documents générés", value: docs.length, icon: "✦", color: "#2ee8c8", href: "/generate" },
    { label: "Modules installés", value: new Set(templates.filter(t => t.moduleId).map(t => t.moduleId)).size, icon: "⊞", color: "#a16ef8", href: "/marketplace" },
    { label: "Automations", value: 0, icon: "⟳", color: "#f59e0b", href: "/automations" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Tableau de bord</h1>
        <p className="text-[#6b7290] text-sm mt-1">Bienvenue sur Mi-Laf — plateforme universelle de génération documentaire</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-[#0d0f18] border border-[#181c2c] hover:border-[#252a40] rounded-xl p-5 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg" style={{ color: s.color }}>{s.icon}</span>
              <span className="text-xs text-[#3a3f5c] group-hover:text-[#6b7290] transition-colors">→</span>
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-[#6b7290] mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1">
          <div className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider mb-3">Actions rapides</div>
          <div className="space-y-2">
            {[
              { href: "/templates/new", icon: "◈", label: "Nouveau template", sub: "Word Tier 1 ou PDF Tier 2", color: "#3B5BDB" },
              { href: "/generate", icon: "✦", label: "Générer un document", sub: `${templates.length} template${templates.length > 1 ? "s" : ""} disponible${templates.length > 1 ? "s" : ""}`, color: "#2ee8c8" },
              { href: "/marketplace", icon: "⊞", label: "Explorer la marketplace", sub: "CEE France, Immobilier, RH…", color: "#a16ef8" },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className="flex items-center gap-3 p-3.5 bg-[#0d0f18] border border-[#181c2c] hover:border-[#252a40] rounded-xl transition-all group">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm"
                  style={{ background: `${a.color}18`, color: a.color }}>
                  {a.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white group-hover:text-white">{a.label}</div>
                  <div className="text-xs text-[#6b7290] truncate">{a.sub}</div>
                </div>
                <span className="ml-auto text-[#3a3f5c] group-hover:text-[#6b7290] text-sm transition-colors">→</span>
              </Link>
            ))}
          </div>

          {/* CEE Banner if no CEE module installed */}
          {!templates.some(t => t.moduleId === "cee-france") && (
            <Link href="/marketplace" className="mt-4 flex items-center gap-3 p-4 bg-gradient-to-r from-[#3B5BDB]/10 to-[#2ee8c8]/5 border border-[#3B5BDB]/20 rounded-xl hover:border-[#3B5BDB]/40 transition-all group block">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="text-sm font-semibold text-white">Module CEE France</div>
                <div className="text-xs text-[#6b7290]">4 templates conformes ADEME — gratuit</div>
              </div>
              <span className="ml-auto text-xs text-[#3B5BDB] font-semibold group-hover:underline">Installer →</span>
            </Link>
          )}
        </div>

        {/* Recent templates */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider">Templates récents</div>
            <Link href="/templates" className="text-xs text-[#3B5BDB] hover:underline">Voir tous →</Link>
          </div>

          {recentTemplates.length === 0 ? (
            <div className="bg-[#0d0f18] border border-dashed border-[#1e2235] rounded-xl p-8 text-center">
              <div className="text-3xl mb-3">◈</div>
              <p className="text-sm text-[#6b7290] mb-3">Aucun template encore</p>
              <Link href="/templates/new" className="text-sm text-[#3B5BDB] hover:underline">Créer un template →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentTemplates.map(t => {
                const color = TIER_COLOR[t.schema.tier] ?? "#3B5BDB";
                const tierLabel = TIER_LABEL[t.schema.tier] ?? "T1";
                return (
                  <Link key={t.id} href={`/generate?id=${t.id}`}
                    className="bg-[#0d0f18] border border-[#181c2c] hover:border-[#252a40] rounded-xl p-4 transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{t.emoji ?? (t.schema.tier === "tier2_pdf_form" ? "⊡" : "◈")}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ color, background: `${color}18` }}>{tierLabel}</span>
                    </div>
                    <div className="text-sm font-semibold text-white group-hover:text-white truncate">{t.schema.templateName}</div>
                    <div className="text-xs text-[#6b7290] mt-1">{t.schema.fieldCount} champs</div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Recent docs */}
          {recentDocs.length > 0 && (
            <div className="mt-6">
              <div className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider mb-3">Derniers documents générés</div>
              <div className="space-y-2">
                {recentDocs.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 bg-[#0d0f18] border border-[#181c2c] rounded-xl">
                    <span className="text-sm text-[#2ee8c8]">✦</span>
                    <span className="text-sm text-white flex-1 truncate">{d.filename}</span>
                    <span className="text-xs text-[#3a3f5c] shrink-0">
                      {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
