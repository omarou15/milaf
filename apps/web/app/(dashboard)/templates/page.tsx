"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { WordSchema } from "@/lib/engine/word-ingestion";

interface StoredTemplate {
  id: string;
  schema: WordSchema;
  templateB64: string;
  createdAt: string;
}

const TIER_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  tier1_word:     { label: "Word Tier 1", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: "◈" },
  tier2_pdf_form: { label: "PDF Tier 2",  color: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: "◉" },
  tier3_pixel:    { label: "Pixel Tier 3",color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: "◆" },
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
      setTemplates(stored);
    } catch {}
  }, []);

  const deleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem("milaf_templates", JSON.stringify(updated));
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="text-[#6b7290] text-sm mt-1">
            {templates.length > 0 ? `${templates.length} template${templates.length > 1 ? "s" : ""} configuré${templates.length > 1 ? "s" : ""}` : "Gérez vos modèles de documents"}
          </p>
        </div>
        <Link href="/templates/new" className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#3451c7] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
          <span>+</span> Nouveau template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="border border-dashed border-[#1e2235] rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4 opacity-30">◈</div>
          <div className="text-white font-semibold mb-2">Aucun template</div>
          <p className="text-[#6b7290] text-sm mb-6 max-w-sm mx-auto">
            Uploadez un document Word balisé <code className="text-[#3B5BDB] text-xs bg-[#3B5BDB]/10 px-1.5 py-0.5 rounded">{"{{champs}}"}</code> pour créer votre premier template
          </p>
          <Link href="/templates/new" className="inline-flex px-5 py-2.5 bg-[#3B5BDB] hover:bg-[#3451c7] text-white rounded-xl text-sm font-semibold transition-colors">
            Créer mon premier template
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map(t => {
            const tier = TIER_LABELS[t.schema.tier] ?? TIER_LABELS.tier1_word;
            const groups = t.schema.groups ?? [];
            return (
              <div key={t.id} className="group bg-[#0d0f18] border border-[#1e2235] hover:border-[#3B5BDB]/40 rounded-2xl p-5 transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate mb-1">{t.schema.templateName}</h3>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${tier.color}`}>
                      <span>{tier.icon}</span> {tier.label}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-950/30 hover:bg-red-950/60 text-red-500 text-xs flex items-center justify-center transition-all ml-2 shrink-0"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#6b7290] mb-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B5BDB]"></span>
                    {t.schema.fieldCount} champ{t.schema.fieldCount > 1 ? "s" : ""}
                  </span>
                  {groups.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {groups.slice(0, 2).join(", ")}{groups.length > 2 ? ` +${groups.length - 2}` : ""}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/generate?id=${t.id}`}
                    className="flex-1 py-2 bg-[#3B5BDB]/10 hover:bg-[#3B5BDB]/20 text-[#3B5BDB] rounded-lg text-xs font-semibold text-center transition-colors"
                  >
                    Générer →
                  </Link>
                  <span className="py-2 px-3 bg-[#141624] text-[#6b7290] rounded-lg text-xs">
                    {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
