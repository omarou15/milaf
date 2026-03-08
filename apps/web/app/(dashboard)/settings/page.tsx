"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [plan, setPlan] = useState("Starter");
  const [credits, setCredits] = useState(100);
  const [docsCount, setDocsCount] = useState(0);

  useEffect(() => {
    const d = parseInt(localStorage.getItem("milaf_docs_count") || "0");
    setDocsCount(d);
  }, []);

  const plans = [
    { name:"Starter", price:"15€/mois", credits:100, color:"#3B5BDB", features:["100 crédits/mois","Tier 1 + Tier 2","3 templates max","Support communauté"] },
    { name:"Pro", price:"39€/mois", credits:500, color:"#2ee8c8", features:["500 crédits/mois","Tous les tiers","Templates illimités","Automations (8h/j)","Support email"] },
    { name:"Business", price:"99€/mois", credits:2000, color:"#a16ef8", features:["2000 crédits/mois","API access","Marketplace custom","Automations 24/7","Chat dédié"] },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Paramètres</h1>
      <p className="text-[#6b7290] text-sm mb-8">Gérez votre compte et abonnement</p>

      {/* Current plan */}
      <div className="bg-[#0d0f18] border border-[#181c2c] rounded-2xl p-6 mb-8">
        <div className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider mb-4">Plan actuel</div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-[#3B5BDB]/15 border border-[#3B5BDB]/30 text-[#3B5BDB] rounded-lg text-sm font-semibold">{plan}</div>
            <div className="text-white font-semibold">15€/mois</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{credits - docsCount < 0 ? 0 : credits - docsCount}</div>
              <div className="text-xs text-[#6b7290]">crédits restants</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{docsCount}</div>
              <div className="text-xs text-[#6b7290]">docs générés</div>
            </div>
          </div>
        </div>
        {/* Credits bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[#6b7290] mb-1.5">
            <span>Utilisation des crédits</span>
            <span>{docsCount}/{credits}</span>
          </div>
          <div className="h-1.5 bg-[#141624] rounded-full overflow-hidden">
            <div className="h-full bg-[#3B5BDB] rounded-full transition-all" style={{width:`${Math.min((docsCount/credits)*100, 100)}%`}} />
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider mb-4">Changer de plan</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {plans.map(p => (
          <div key={p.name} className={`bg-[#0d0f18] rounded-2xl p-5 transition-all ${plan===p.name?"border-2":"border border-[#181c2c] hover:border-[#252a40]"}`}
            style={plan===p.name?{borderColor:p.color}:{}}>
            {plan===p.name && <div className="text-xs font-semibold mb-3" style={{color:p.color}}>✓ Plan actuel</div>}
            <div className="text-white font-bold mb-0.5">{p.name}</div>
            <div className="text-2xl font-bold mb-4" style={{color:p.color}}>{p.price}</div>
            <ul className="space-y-1.5 mb-5">
              {p.features.map(f => (
                <li key={f} className="text-xs text-[#9ca3af] flex gap-2"><span style={{color:p.color}}>✓</span>{f}</li>
              ))}
            </ul>
            {plan !== p.name && (
              <button className="w-full py-2 rounded-xl text-sm font-semibold border transition-colors hover:text-white" style={{borderColor:`${p.color}40`,color:p.color}}>
                Passer à {p.name} →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-6">
        <div className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider mb-4">Données locales</div>
        <p className="text-[#6b7290] text-sm mb-4">Vos templates et données sont actuellement stockés localement. La synchronisation cloud sera disponible après connexion à la base de données.</p>
        <button
          onClick={() => {
            if (confirm("Supprimer toutes les données locales ?")) {
              localStorage.removeItem("milaf_templates");
              localStorage.removeItem("milaf_docs_count");
              window.location.reload();
            }
          }}
          className="px-4 py-2 border border-red-800/40 text-red-400 hover:bg-red-900/20 rounded-xl text-sm font-semibold transition-colors"
        >
          Effacer les données locales
        </button>
      </div>
    </div>
  );
}
