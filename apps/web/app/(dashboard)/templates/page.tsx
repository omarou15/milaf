"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { WordSchema } from "@/lib/engine/word-ingestion";

interface StoredTemplate { id: string; schema: WordSchema; templateB64: string; createdAt: string; }

const TIER_COLORS: Record<string,string> = { tier1_word:"#3B5BDB", tier2_pdf_form:"#2ee8c8", tier3_pixel:"#a16ef8" };
const TIER_LABELS: Record<string,string> = { tier1_word:"Word · Tier 1", tier2_pdf_form:"PDF Form · Tier 2", tier3_pixel:"Pixel Perfect · Tier 3" };
const TIER_CREDITS: Record<string,number> = { tier1_word:1, tier2_pdf_form:2, tier3_pixel:5 };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [deleteId, setDeleteId] = useState<string|null>(null);

  useEffect(() => {
    setTemplates(JSON.parse(localStorage.getItem("milaf_templates") || "[]"));
  }, []);

  function handleDelete(id: string) {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem("milaf_templates", JSON.stringify(updated));
    setDeleteId(null);
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Templates</h1>
          <p className="text-[#6b7290] text-sm mt-1">{templates.length} template{templates.length!==1?"s":""} · Doc Engine Tier 1/2/3</p>
        </div>
        <Link href="/templates/new" className="flex items-center gap-2 px-4 py-2.5 bg-[#3B5BDB] hover:bg-[#3451c7] text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(59,91,219,0.25)]">
          <span>+</span> Nouveau template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="border border-dashed border-[#1e2235] rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0d0f18] border border-[#181c2c] flex items-center justify-center text-2xl mx-auto mb-5">◈</div>
          <div className="text-white font-semibold mb-2">Aucun template</div>
          <p className="text-[#6b7290] text-sm mb-6 max-w-xs mx-auto">Uploadez un Word balisé <code className="text-[#3B5BDB] bg-[#3B5BDB]/10 px-1.5 py-0.5 rounded text-xs">{"{{champ}}"}</code> pour démarrer</p>
          <Link href="/templates/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B5BDB] hover:bg-[#3451c7] text-white rounded-xl text-sm font-semibold transition-colors">Créer mon premier template →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(t => {
            const color = TIER_COLORS[t.schema.tier] ?? "#3B5BDB";
            const credits = TIER_CREDITS[t.schema.tier] ?? 1;
            const date = new Date(t.createdAt).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
            return (
              <div key={t.id} className="group relative bg-[#0d0f18] border border-[#181c2c] hover:border-[#252a40] rounded-2xl p-5 transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{color,background:`${color}18`}}>{TIER_LABELS[t.schema.tier]??t.schema.tier}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#6b7290]">{credits} crédit{credits>1?"s":""}</span>
                    <button onClick={()=>setDeleteId(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg hover:bg-red-900/30 flex items-center justify-center text-[#6b7290] hover:text-red-400">×</button>
                  </div>
                </div>
                <h3 className="text-white font-semibold mb-1 truncate">{t.schema.templateName}</h3>
                <p className="text-[#6b7290] text-xs mb-4">{t.schema.fieldCount} champs · {t.schema.groups.join(", ")}</p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {t.schema.rawBalises.slice(0,4).map(b=>(
                    <span key={b} className="text-xs px-2 py-0.5 bg-[#141624] border border-[#1e2235] rounded-md text-[#9ca3af] font-mono">{`{{${b}}}`}</span>
                  ))}
                  {t.schema.rawBalises.length>4&&<span className="text-xs text-[#3a3f5c]">+{t.schema.rawBalises.length-4}</span>}
                </div>
                <div className="flex gap-2 items-center">
                  <Link href={`/generate?id=${t.id}`} className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-semibold transition-all" style={{background:`${color}22`,border:`1px solid ${color}44`,color}}>Générer →</Link>
                  <div className="text-xs text-[#3a3f5c]">{date}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-2">Supprimer ce template ?</h3>
            <p className="text-[#6b7290] text-sm mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={()=>setDeleteId(null)} className="flex-1 px-4 py-2.5 border border-[#1e2235] text-[#9ca3af] hover:text-white rounded-xl text-sm font-semibold transition-colors">Annuler</button>
              <button onClick={()=>handleDelete(deleteId)} className="flex-1 px-4 py-2.5 bg-red-900/30 border border-red-800/40 text-red-400 rounded-xl text-sm font-semibold transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
