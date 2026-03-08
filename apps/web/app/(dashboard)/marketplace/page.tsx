"use client";
import { useState } from "react";

const CATEGORIES = ["Tout", "Énergie", "Immobilier", "RH", "Juridique", "Finance", "Santé"];

const MODULES = [
  { id: "cee-france", name: "CEE France", emoji: "⚡", country: "🇫🇷", category: "Énergie", desc: "Dossier complet CEE : Devis, Facture, Attestation sur l'honneur, FOS, Avis de chantier", tier: "Tier 2", tierColor: "#F59E0B", docs: 6, installs: 1240, rating: 4.9, author: "Mi-Laf Officiel", official: true, price: 0, tags: ["B2B", "Artisan", "CEE"] },
  { id: "maprimerénov", name: "MaPrimeRénov", emoji: "🏠", country: "🇫🇷", category: "Énergie", desc: "Dossier MPR complet : demande, devis réglementaire, justificatifs, facture conforme ANAH", tier: "Tier 2", tierColor: "#F59E0B", docs: 5, installs: 890, rating: 4.8, author: "Mi-Laf Officiel", official: true, price: 0, tags: ["ANAH", "Rénovation", "Subvention"] },
  { id: "etat-des-lieux", name: "État des lieux", emoji: "🔑", country: "🇫🇷🇲🇦", category: "Immobilier", desc: "Entrée, sortie, inventaire contradictoire. Conforme loi ALUR. Version bilingue FR/AR disponible", tier: "Tier 1", tierColor: "#3B5BDB", docs: 3, installs: 2100, rating: 4.7, author: "Mi-Laf Officiel", official: true, price: 0, tags: ["Locatif", "ALUR", "Bilingue"] },
  { id: "bail-habitation", name: "Bail d'habitation", emoji: "📋", country: "🇫🇷", category: "Immobilier", desc: "Contrat de bail résidentiel, avenant, notice d'information, règlement intérieur", tier: "Tier 1", tierColor: "#3B5BDB", docs: 4, installs: 1560, rating: 4.6, author: "Mi-Laf Officiel", official: true, price: 0, tags: ["Location", "Contrat", "ALUR"] },
  { id: "contrat-travail", name: "Contrat de travail", emoji: "👔", country: "🇫🇷🇲🇦🇩🇿", category: "RH", desc: "CDI, CDD, Avenant, Rupture conventionnelle — modèles conformes Code du Travail", tier: "Tier 1", tierColor: "#3B5BDB", docs: 5, installs: 780, rating: 4.5, author: "LexDocs Pro", official: false, price: 9.9, tags: ["CDI", "CDD", "RH"] },
  { id: "devis-facture", name: "Devis & Facture B2B", emoji: "💼", country: "🌍", category: "Finance", desc: "Devis professionnel, facture, avoir, bon de commande — multidevise, multilangue", tier: "Tier 1", tierColor: "#3B5BDB", docs: 4, installs: 3200, rating: 4.9, author: "Mi-Laf Officiel", official: true, price: 0, tags: ["International", "Facturation", "Multi-devise"] },
  { id: "audit-energetique", name: "Audit Énergétique", emoji: "🌿", country: "🇲🇦🇩🇿🇹🇳", category: "Énergie", desc: "Audit bâtiment tertiaire & industriel. Méthode sur facture, inventaire, rapport GIZ", tier: "Tier 3", tierColor: "#10B981", docs: 8, installs: 230, rating: 4.8, author: "Tetra", official: false, price: 29, tags: ["MENA", "GIZ", "Tertiaire"] },
  { id: "ordonnance", name: "Ordonnance Médicale", emoji: "🏥", country: "🇫🇷🇲🇦", category: "Santé", desc: "Ordonnance, certificat médical, compte-rendu de consultation — sécurisé RGPD", tier: "Tier 2", tierColor: "#F59E0B", docs: 4, installs: 420, rating: 4.4, author: "MedDocs", official: false, price: 14.9, tags: ["Médical", "Confidentiel", "RGPD"] },
  { id: "statuts-sas", name: "Statuts SAS / SARL", emoji: "⚖️", country: "🇫🇷", category: "Juridique", desc: "Statuts constitutifs, PV d'AG, rapport de gestion — pack création d'entreprise", tier: "Tier 2", tierColor: "#F59E0B", docs: 7, installs: 310, rating: 4.6, author: "JuriDocs", official: false, price: 19, tags: ["Création", "SAS", "SARL"] },
];

const TIER_LABELS: Record<string, string> = { "Tier 1": "Word", "Tier 2": "PDF Form", "Tier 3": "Pixel Perfect" };

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [search, setSearch] = useState("");
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<string | null>(null);

  const filtered = MODULES.filter((m) => {
    const matchCat = activeCategory === "Tout" || m.category === activeCategory;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase()) || m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  function handleInstall(id: string) {
    if (installed.has(id)) return;
    setInstalling(id);
    setTimeout(() => { setInstalled((prev) => new Set([...prev, id])); setInstalling(null); }, 1200);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b border-[#181c2c] p-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Marketplace</h1>
            <p className="text-[#6b7290] text-sm mt-0.5">{MODULES.length} modules · Documents certifiés par secteur et pays</p>
          </div>
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7290] text-sm">⌕</span>
            <input className="w-full bg-[#0d0f18] border border-[#252a40] rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder-[#6b7290] focus:outline-none focus:border-[#3B5BDB]" placeholder="Rechercher un module…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat ? "bg-[#3B5BDB] text-white" : "bg-[#0d0f18] border border-[#252a40] text-[#6b7290] hover:text-white"}`}>{cat}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-6 mb-6 text-xs text-[#6b7290]">
          <span><span className="text-white font-semibold">{filtered.length}</span> modules</span>
          <span><span className="text-white font-semibold">{filtered.filter(m => m.official).length}</span> officiels</span>
          <span><span className="text-white font-semibold">{installed.size}</span> installés</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const isInstalled = installed.has(m.id);
            const isInstalling = installing === m.id;
            return (
              <div key={m.id} className="bg-[#0d0f18] border border-[#181c2c] rounded-xl p-5 flex flex-col gap-3 hover:border-[#252a40] transition-all">
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
                  <span className="text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap" style={{ color: m.tierColor, background: `${m.tierColor}18` }}>{TIER_LABELS[m.tier]}</span>
                </div>
                <p className="text-xs text-[#6b7290] leading-relaxed flex-1">{m.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.tags.map((tag) => (<span key={tag} className="text-[10px] px-2 py-0.5 bg-[#181c2c] text-[#6b7290] rounded">{tag}</span>))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#181c2c]">
                  <div className="flex items-center gap-3 text-xs text-[#6b7290]">
                    <span>★ {m.rating}</span>
                    <span>{m.docs} docs</span>
                    <span>{m.installs >= 1000 ? `${(m.installs/1000).toFixed(1)}k` : m.installs} inst.</span>
                  </div>
                  <button onClick={() => handleInstall(m.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isInstalled ? "bg-[#10B981]/15 text-[#10B981]" : isInstalling ? "bg-[#3B5BDB]/30 text-[#3B5BDB]" : m.price > 0 ? "bg-[#F59E0B]/15 text-[#F59E0B] hover:bg-[#F59E0B]/25" : "bg-[#3B5BDB]/15 text-[#3B5BDB] hover:bg-[#3B5BDB]/25"}`}>
                    {isInstalled ? "✓ Installé" : isInstalling ? "…" : m.price > 0 ? `${m.price}€/mois` : "Installer"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (<div className="text-center py-16 text-[#6b7290]"><div className="text-3xl mb-3">⊞</div><p className="text-sm">Aucun module pour cette recherche</p></div>)}
        <div className="mt-8 p-5 border border-dashed border-[#252a40] rounded-xl text-center">
          <p className="text-sm text-[#6b7290] mb-2">Vous créez des templates pour votre secteur ?</p>
          <button className="text-sm text-[#3B5BDB] font-medium hover:underline">Publier un module → commission 20% sur les ventes</button>
        </div>
      </div>
    </div>
  );
}
