"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface StoredTemplate {
  id: string;
  schema: { templateName: string; tier: string; fieldCount: number; fields?: { name: string; required: boolean }[] };
  templateB64: string;
  createdAt: string;
}

const TIER_COLORS: Record<string, string> = {
  tier1_word: "#3B5BDB",
  tier2_pdf_form: "#F59E0B",
  tier3_pixel: "#10B981",
};
const TIER_LABELS: Record<string, string> = {
  tier1_word: "Word · Tier 1",
  tier2_pdf_form: "PDF Form · Tier 2",
  tier3_pixel: "Pixel Perfect · Tier 3",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setTemplates(JSON.parse(localStorage.getItem("milaf_templates") || "[]"));
  }, []);

  function handleDelete(id: string) {
    setDeleting(id);
    setTimeout(() => {
      const updated = templates.filter(t => t.id !== id);
      setTemplates(updated);
      localStorage.setItem("milaf_templates", JSON.stringify(updated));
      setDeleting(null);
    }, 400);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b border-[#181c2c] p-6 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Templates</h1>
          <p className="text-[#6b7290] text-sm mt-0.5">{templates.length} template{templates.length !== 1 ? "s" : ""} · Modèles de documents balisés</p>
        </div>
        <Link href="/templates/new" className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#3451c7] text-white rounded-lg text-sm font-semibold transition-colors">
          + Nouveau template
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {templates.length === 0 ? (
          <div className="border border-dashed border-[#1e2235] rounded-2xl p-16 text-center">
            <div className="text-4xl mb-4">◈</div>
            <p className="text-white font-semibold mb-2">Aucun template</p>
            <p className="text-[#6b7290] text-sm mb-6 max-w-sm mx-auto">
              Uploadez un Word avec des balises <code className="text-[#3B5BDB] bg-[#3B5BDB]/10 px-1.5 py-0.5 rounded">{"{{champ}}"}</code> pour créer votre premier template
            </p>
            <Link href="/templates/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B5BDB] hover:bg-[#3451c7] text-white rounded-xl text-sm font-semibold transition-colors">
              Créer mon premier template →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((t) => {
              const tierColor = TIER_COLORS[t.schema.tier] || "#3B5BDB";
              const tierLabel = TIER_LABELS[t.schema.tier] || t.schema.tier;
              return (
                <div key={t.id} className={`bg-[#0d0f18] border border-[#181c2c] rounded-xl p-5 flex flex-col gap-3 transition-all ${deleting === t.id ? "opacity-40 scale-95" : "hover:border-[#252a40]"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: `${tierColor}18`, color: tierColor }}>◈</div>
                      <div>
                        <div className="text-sm font-semibold text-white leading-tight">{t.schema.templateName}</div>
                        <div className="text-xs mt-0.5" style={{ color: tierColor }}>{tierLabel}</div>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(t.id)} className="text-[#3a3f5c] hover:text-red-400 text-xs transition-colors px-1 py-0.5">✕</button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#6b7290]">
                    <span>{t.schema.fieldCount} champs</span>
                    <span>{new Date(t.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>

                  {t.schema.fields && t.schema.fields.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {t.schema.fields.slice(0, 4).map((f) => (
                        <span key={f.name} className="text-[10px] px-2 py-0.5 bg-[#181c2c] rounded" style={{ color: f.required ? tierColor : "#6b7290" }}>
                          {f.name}
                        </span>
                      ))}
                      {t.schema.fields.length > 4 && <span className="text-[10px] text-[#3a3f5c]">+{t.schema.fields.length - 4}</span>}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1 border-t border-[#181c2c]">
                    <Link href={`/generate?id=${t.id}`} className="flex-1 py-2 rounded-lg text-xs font-semibold text-center transition-all" style={{ background: `${tierColor}15`, color: tierColor }}>
                      Générer →
                    </Link>
                    <Link href={`/templates/new?edit=${t.id}`} className="px-3 py-2 rounded-lg text-xs font-medium text-[#6b7290] hover:text-white border border-[#252a40] transition-all">
                      Éditer
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Add new card */}
            <Link href="/templates/new" className="border border-dashed border-[#1e2235] hover:border-[#3B5BDB]/40 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-[#3a3f5c] hover:text-[#3B5BDB] transition-all min-h-[160px]">
              <span className="text-2xl">+</span>
              <span className="text-xs font-medium">Nouveau template</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
