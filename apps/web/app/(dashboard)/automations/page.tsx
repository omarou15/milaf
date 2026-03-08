"use client";
import { useState } from "react";
import Link from "next/link";

const TRIGGERS = [
  { id: "cron", icon: "⏱", label: "Planifié", desc: "Récurrent (quotidien, hebdo, mensuel)" },
  { id: "webhook", icon: "⚡", label: "Webhook", desc: "Déclenché par un appel HTTP externe" },
  { id: "email", icon: "✉", label: "Email entrant", desc: "À réception d'un email spécifique" },
  { id: "api", icon: "⟁", label: "API Mi-Laf", desc: "Via l'API REST de Mi-Laf" },
];

export default function AutomationsPage() {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b border-[#181c2c] p-6 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Automatisations</h1>
          <p className="text-[#6b7290] text-sm mt-0.5">Générez des documents automatiquement selon des déclencheurs</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#3451c7] text-white rounded-lg text-sm font-semibold transition-colors"
        >
          + Nouvelle automation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {showNew && (
          <div className="bg-[#0d0f18] border border-[#252a40] rounded-xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">Choisir un déclencheur</h3>
            <div className="grid grid-cols-2 gap-3">
              {TRIGGERS.map((t) => (
                <div key={t.id} className="p-4 border border-[#181c2c] hover:border-[#3B5BDB]/50 rounded-xl cursor-pointer transition-all group">
                  <span className="text-xl block mb-2">{t.icon}</span>
                  <div className="text-sm font-semibold text-white group-hover:text-[#3B5BDB] transition-colors">{t.label}</div>
                  <div className="text-xs text-[#6b7290] mt-0.5">{t.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#3a3f5c] mt-4 text-center">Disponible en Sprint 4 — Automation Engine (BullMQ + webhooks)</p>
          </div>
        )}

        {/* Empty state */}
        <div className="border border-dashed border-[#1e2235] rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">⟳</div>
          <p className="text-white font-semibold mb-2">Aucune automation active</p>
          <p className="text-[#6b7290] text-sm mb-6 max-w-sm mx-auto">
            Les automations permettent de déclencher la génération de documents depuis un cron, un webhook, ou un email entrant.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setShowNew(true)}
              className="px-5 py-2.5 bg-[#3B5BDB] hover:bg-[#3451c7] text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Créer une automation
            </button>
            <span className="text-xs text-[#3a3f5c]">Nécessite au moins un template Tier 1 ou 2</span>
          </div>
        </div>

        {/* Coming soon roadmap */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "📧", title: "Email to Doc", desc: "Recevez un email → générez un PDF → répondez avec la pièce jointe" },
            { icon: "🔗", title: "Webhook Zapier", desc: "Connectez à 5000+ apps via Zapier, Make, ou n8n" },
            { icon: "📅", title: "Cron quotidien", desc: "Générez des rapports, factures ou synthèses chaque matin" },
          ].map((item) => (
            <div key={item.title} className="bg-[#0d0f18] border border-[#181c2c] rounded-xl p-4 opacity-60">
              <span className="text-xl block mb-2">{item.icon}</span>
              <div className="text-sm font-semibold text-white mb-1">{item.title}</div>
              <div className="text-xs text-[#6b7290]">{item.desc}</div>
              <div className="text-[10px] text-[#3a3f5c] mt-2 font-medium">Sprint 4</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
