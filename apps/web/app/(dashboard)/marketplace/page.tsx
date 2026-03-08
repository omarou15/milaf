"use client";
import { useState, useEffect } from "react";
import { MODULES_REGISTRY } from "@/lib/modules/registry";
import type { MarketplaceModule } from "@/lib/modules/registry";

const CATEGORIES = ["Tout", "Finance", "Énergie", "Immobilier", "RH", "Juridique"];

const MODULES = MODULES_REGISTRY.map(m => ({ ...m, desc: m.description }));

const TIER_LABELS: Record<string, string> = { "Tier 1": "Word", "Tier 2": "PDF Form", "Tier 3": "Pixel Perfect" };

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [search, setSearch] = useState("");
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Load already-installed modules from localStorage
  useEffect(() => {
    const templates = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
    const moduleIds = new Set<string>(templates.filter((t: { moduleId?: string }) => t.moduleId).map((t: { moduleId: string }) => t.moduleId));
    setInstalled(moduleIds);
  }, []);

  const filtered = MODULES.filter(m => {
    const matchCat = activeCategory === "Tout" || m.category === activeCategory;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase()) || m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  async function handleInstall(moduleId: string, hasTemplates: boolean) {
    if (installed.has(moduleId)) return;
    setInstalling(moduleId);
    setInstallError(null);

    try {
      if (!hasTemplates) {
        // Coming soon modules — just mark installed with a delay
        await new Promise(r => setTimeout(r, 800));
        setInstalled(prev => new Set([...prev, moduleId]));
        setInstalling(null);
        return;
      }

      const res = await fetch(`/api/modules?id=${moduleId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur d'installation");

      if (json.templates && json.templates.length > 0) {
        const existing = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
        const newTemplates = json.templates.map((t: { id: string; schema: unknown; templateB64: string; createdAt: string; moduleId: string; emoji: string }) => ({
          id: crypto.randomUUID(),
          schema: t.schema,
          templateB64: t.templateB64 ?? "",
          createdAt: new Date().toISOString(),
          moduleId,
          emoji: t.emoji,
        }));
        localStorage.setItem("milaf_templates", JSON.stringify([...existing, ...newTemplates]));
        setInstalled(prev => new Set([...prev, moduleId]));
        setExpandedModule(moduleId);
      }
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : "Erreur d'installation");
    } finally {
      setInstalling(null);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#181c2c] p-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Marketplace</h1>
            <p className="text-[#6b7290] text-sm mt-0.5">{MODULES.length} modules · Secteurs France & MENA</p>
          </div>
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7290] text-sm">⌕</span>
            <input
              className="w-full bg-[#0d0f18] border border-[#252a40] rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder-[#6b7290] focus:outline-none focus:border-[#3B5BDB]"
              placeholder="Rechercher un module…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat ? "bg-[#3B5BDB] text-white" : "bg-[#0d0f18] border border-[#252a40] text-[#6b7290] hover:text-white"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {installError && (
          <div className="mb-4 p-3 bg-red-950/20 border border-red-800/40 rounded-xl text-red-400 text-sm">⚠ {installError}</div>
        )}

        <div className="flex gap-4 mb-6 text-xs text-[#6b7290]">
          <span><span className="text-white font-semibold">{filtered.length}</span> modules</span>
          <span><span className="text-white font-semibold">{filtered.filter(m => m.official).length}</span> officiels</span>
          <span><span className="text-white font-semibold">{installed.size}</span> installés</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(m => {
            const isInstalled = installed.has(m.id);
            const isInstalling = installing === m.id;
            const isExpanded = expandedModule === m.id;

            return (
              <div key={m.id} className={`bg-[#0d0f18] border rounded-xl p-5 flex flex-col gap-3 transition-all ${isExpanded ? "border-[#3B5BDB]/50" : "border-[#181c2c] hover:border-[#252a40]"}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{m.emoji}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-white text-sm">{m.name}</h3>
                        {m.official && <span className="text-[#3B5BDB] text-xs" title="Officiel">✦</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-base">{m.country}</span>
                        <span className="text-[#6b7290] text-xs">{m.author}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap" style={{ color: m.tierColor, background: `${m.tierColor}18` }}>
                    {TIER_LABELS[m.tier]}
                  </span>
                </div>

                <p className="text-xs text-[#6b7290] leading-relaxed flex-1">{m.desc}</p>

                <div className="flex flex-wrap gap-1.5">
                  {m.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-[#181c2c] text-[#6b7290] rounded">{tag}</span>
                  ))}
                </div>

                {/* Install success expanded */}
                {isExpanded && (
                  <div className="p-3 bg-[#3B5BDB]/10 border border-[#3B5BDB]/20 rounded-xl text-xs text-[#9ca3af]">
                    <div className="text-[#3B5BDB] font-semibold mb-1.5">✓ {m.docs} templates installés</div>
                    <p className="mb-2">Retrouvez-les dans <strong className="text-white">Templates</strong> pour générer vos documents.</p>
                    <a href="/templates" className="text-[#3B5BDB] hover:underline">Voir mes templates →</a>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[#181c2c]">
                  <div className="flex items-center gap-3 text-xs text-[#6b7290]">
                    <span>★ {m.rating}</span>
                    <span>{m.docs} docs</span>
                    <span>{m.installs >= 1000 ? `${(m.installs / 1000).toFixed(1)}k` : m.installs} inst.</span>
                  </div>
                  <button
                    onClick={() => handleInstall(m.id, m.hasTemplates)}
                    disabled={isInstalled || isInstalling}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isInstalled ? "bg-emerald-500/15 text-emerald-400 cursor-default"
                      : isInstalling ? "bg-[#3B5BDB]/20 text-[#3B5BDB] cursor-wait"
                      : m.price > 0 ? "bg-[#F59E0B]/15 text-[#F59E0B] hover:bg-[#F59E0B]/25"
                      : "bg-[#3B5BDB]/15 text-[#3B5BDB] hover:bg-[#3B5BDB]/25"
                    }`}
                  >
                    {isInstalled ? "✓ Installé" : isInstalling ? "Installation…" : m.price > 0 ? `${m.price}€/mois` : "Installer"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#6b7290]">
            <div className="text-3xl mb-3">⊞</div>
            <p className="text-sm">Aucun module pour cette recherche</p>
          </div>
        )}

        <div className="mt-8 p-5 border border-dashed border-[#252a40] rounded-xl text-center">
          <p className="text-sm text-[#6b7290] mb-2">Vous créez des templates pour votre secteur ?</p>
          <button className="text-sm text-[#3B5BDB] font-medium hover:underline">Publier un module → commission 20% sur les ventes</button>
        </div>
      </div>
    </div>
  );
}
