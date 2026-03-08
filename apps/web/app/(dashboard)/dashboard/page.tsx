"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface StoredTemplate { id: string; schema: { templateName: string; tier: string; fieldCount: number }; createdAt: string; }
interface StoredDoc { id: string; templateId: string; filename: string; createdAt: string; }

export default function DashboardPage() {
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [docs, setDocs] = useState<StoredDoc[]>([]);

  useEffect(() => {
    setTemplates(JSON.parse(localStorage.getItem("milaf_templates") || "[]"));
    setDocs(JSON.parse(localStorage.getItem("milaf_docs") || "[]"));
  }, []);

  const recent = [...templates]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const stats = [
    { label: "Templates actifs", value: templates.length, icon: "◈", color: "#3B5BDB", href: "/templates" },
    { label: "Documents générés", value: docs.length, icon: "⊡", color: "#2ee8c8", href: "/generate" },
    { label: "Automations", value: 0, icon: "⟳", color: "#a16ef8", href: "/automations" },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Tableau de bord</h1>
        <p className="text-[#6b7290] text-sm mt-1">Bienvenue sur Mi-Laf — ملف · Plateforme documentaire</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-[#0d0f18] border border-[#181c2c] hover:border-[#252a40] rounded-2xl p-6 transition-all group">
            <div className="text-2xl mb-3" style={{ color: s.color }}>{s.icon}</div>
            <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
            <div className="text-sm text-[#6b7290] group-hover:text-[#9ca3af] transition-colors">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-[#3B5BDB]/10 to-transparent border border-[#3B5BDB]/20 rounded-2xl p-6">
          <div className="text-[#3B5BDB] text-lg mb-2">◈ Tier 1 — Word balisé</div>
          <p className="text-[#6b7290] text-sm mb-4">Uploadez un <code className="text-[#9ca3af] bg-[#141624] px-1.5 py-0.5 rounded text-xs">.docx</code> avec des balises <code className="text-[#3B5BDB] bg-[#3B5BDB]/10 px-1.5 py-0.5 rounded text-xs">{"{{champ}}"}</code> — 1 crédit par document généré</p>
          <Link href="/templates/new" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B5BDB] hover:text-white transition-colors">
            Créer un template →
          </Link>
        </div>
        <div className="bg-gradient-to-br from-[#2ee8c8]/5 to-transparent border border-[#2ee8c8]/10 rounded-2xl p-6">
          <div className="text-[#2ee8c8] text-lg mb-2">⊡ Tier 2 — PDF AcroForm</div>
          <p className="text-[#6b7290] text-sm mb-4">Remplissez des formulaires PDF existants automatiquement — 2 crédits par document</p>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3a3f5c]">
            Bientôt disponible
          </span>
        </div>
      </div>

      {/* Recent templates */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-[#9ca3af]">Templates récents</div>
            <Link href="/templates" className="text-xs text-[#3B5BDB] hover:text-white transition-colors">Voir tous →</Link>
          </div>
          <div className="space-y-2">
            {recent.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 bg-[#0d0f18] border border-[#181c2c] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#3B5BDB]" />
                  <span className="text-sm text-white font-medium">{t.schema.templateName}</span>
                  <span className="text-xs text-[#3a3f5c]">{t.schema.fieldCount} champs</span>
                </div>
                <Link href={`/generate?id=${t.id}`} className="text-xs text-[#3B5BDB] hover:text-white transition-colors">Générer →</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <div className="border border-dashed border-[#1e2235] rounded-2xl p-12 text-center">
          <div className="text-3xl mb-3">✦</div>
          <p className="text-white font-semibold mb-2">Commencez ici</p>
          <p className="text-[#6b7290] text-sm mb-6 max-w-sm mx-auto">Créez votre premier template Word Tier 1 en uploadant un document <code className="text-[#3B5BDB] bg-[#3B5BDB]/10 px-1.5 py-0.5 rounded">{"{{balisé}}"}</code></p>
          <Link href="/templates/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B5BDB] hover:bg-[#3451c7] text-white rounded-xl text-sm font-semibold transition-colors">
            Créer mon premier template →
          </Link>
        </div>
      )}
    </div>
  );
}
