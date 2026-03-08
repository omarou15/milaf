"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Template {
  id: string;
  schema: { templateName: string; tier: string; fieldCount: number; groups: string[] };
  templateB64: string;
  createdAt: string;
  moduleId?: string;
  emoji?: string;
}

const TIER_COLOR: Record<string, string> = { tier1_word: "#3B5BDB", tier2_pdf_form: "#2ee8c8", tier3_pixel: "#a16ef8" };
const TIER_LABEL: Record<string, string> = { tier1_word: "Tier 1 · Word", tier2_pdf_form: "Tier 2 · PDF", tier3_pixel: "Tier 3 · Pixel" };
const TIER_CREDITS: Record<string, number> = { tier1_word: 1, tier2_pdf_form: 2, tier3_pixel: 5 };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState<"all" | "tier1_word" | "tier2_pdf_form">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setTemplates(JSON.parse(localStorage.getItem("milaf_templates") || "[]"));
  }, []);

  function deleteTemplate(id: string) {
    setDeleting(id);
    setTimeout(() => {
      const updated = templates.filter(t => t.id !== id);
      localStorage.setItem("milaf_templates", JSON.stringify(updated));
      setTemplates(updated);
      setDeleting(null);
    }, 300);
  }

  const filtered = filter === "all" ? templates : templates.filter(t => t.schema.tier === filter);
  const grouped = filtered.reduce<Record<string, Template[]>>((acc, t) => {
    const key = t.moduleId ?? "__custom__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const tierCounts = {
    all: templates.length,
    tier1_word: templates.filter(t => t.schema.tier === "tier1_word").length,
    tier2_pdf_form: templates.filter(t => t.schema.tier === "tier2_pdf_form").length,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#181c2c] p-6 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Templates</h1>
          <p className="text-[#6b7290] text-sm mt-0.5">{templates.length} template{templates.length !== 1 ? "s" : ""} · Word Tier 1 et PDF Tier 2</p>
        </div>
        <Link href="/templates/new"
          className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#3451c7] text-white rounded-lg text-sm font-semibold transition-colors">
          + Nouveau
        </Link>
      </div>

      {/* Filters */}
      <div className="border-b border-[#181c2c] px-6 py-3 flex gap-2 flex-shrink-0">
        {([
          { id: "all", label: "Tous", count: tierCounts.all },
          { id: "tier1_word", label: "Word T1", count: tierCounts.tier1_word, color: "#3B5BDB" },
          { id: "tier2_pdf_form", label: "PDF T2", count: tierCounts.tier2_pdf_form, color: "#2ee8c8" },
        ] as const).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.id ? "bg-[#1a1f35] text-white border border-[#252a40]" : "text-[#6b7290] hover:text-white"
            }`}>
            {f.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={filter === f.id && "color" in f ? { color: f.color, background: `${f.color}18` } : { background: "#1e2235", color: "#6b7290" }}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="text-4xl mb-4">◈</div>
            <h2 className="text-lg font-semibold text-white mb-2">Aucun template</h2>
            <p className="text-[#6b7290] text-sm mb-6 max-w-xs">
              Créez votre premier template Word ou PDF, ou installez un module depuis la marketplace.
            </p>
            <div className="flex gap-3">
              <Link href="/templates/new" className="px-4 py-2.5 bg-[#3B5BDB] hover:bg-[#3451c7] text-white rounded-xl text-sm font-semibold transition-colors">
                Créer un template
              </Link>
              <Link href="/marketplace" className="px-4 py-2.5 border border-[#252a40] hover:border-[#3a3f5c] text-[#9ca3af] hover:text-white rounded-xl text-sm font-semibold transition-colors">
                Marketplace
              </Link>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#6b7290] text-sm">Aucun template dans cette catégorie</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([moduleId, moduleTemplates]) => (
              <div key={moduleId}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider">
                    {moduleId === "__custom__" ? "Templates personnalisés" : `Module : ${moduleId}`}
                  </span>
                  {moduleId !== "__custom__" && (
                    <span className="text-xs px-2 py-0.5 bg-[#3B5BDB]/10 text-[#3B5BDB] rounded">
                      {moduleTemplates.length} template{moduleTemplates.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {moduleTemplates.map(t => {
                    const color = TIER_COLOR[t.schema.tier] ?? "#3B5BDB";
                    const isDeleting = deleting === t.id;
                    return (
                      <div key={t.id} className={`bg-[#0d0f18] border border-[#181c2c] rounded-xl p-4 flex flex-col gap-3 transition-all ${isDeleting ? "opacity-30 scale-95" : "hover:border-[#252a40]"}`}>
                        {/* Top */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{t.emoji ?? (t.schema.tier === "tier2_pdf_form" ? "⊡" : "◈")}</span>
                            <div>
                              <div className="text-sm font-semibold text-white leading-snug">{t.schema.templateName}</div>
                              <div className="text-xs text-[#6b7290] mt-0.5">{t.schema.fieldCount} champs</div>
                            </div>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 whitespace-nowrap"
                            style={{ color, background: `${color}18` }}>
                            {TIER_LABEL[t.schema.tier]}
                          </span>
                        </div>

                        {/* Groups */}
                        <div className="flex flex-wrap gap-1">
                          {(t.schema.groups ?? []).slice(0, 4).map(g => (
                            <span key={g} className="text-[10px] px-1.5 py-0.5 bg-[#141624] border border-[#1e2235] text-[#6b7290] rounded capitalize">{g}</span>
                          ))}
                          {(t.schema.groups ?? []).length > 4 && (
                            <span className="text-[10px] text-[#3a3f5c]">+{t.schema.groups.length - 4}</span>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-2 pt-2 border-t border-[#141624]">
                          <span className="text-[10px] text-[#3a3f5c]">
                            {new Date(t.createdAt).toLocaleDateString("fr-FR")} · {TIER_CREDITS[t.schema.tier]} crédit{TIER_CREDITS[t.schema.tier] > 1 ? "s" : ""}
                          </span>
                          <div className="ml-auto flex gap-2">
                            <Link href={`/generate?id=${t.id}`}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                              style={{ background: `${color}18`, color }}>
                              Générer
                            </Link>
                            <button onClick={() => deleteTemplate(t.id)}
                              className="px-2 py-1 rounded-lg text-xs text-[#3a3f5c] hover:text-red-400 hover:bg-red-950/20 transition-colors">
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
