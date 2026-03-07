const MODULES = [
  { name: "CEE France", country: "🇫🇷", desc: "Devis, Facture, AH, FOS — Dossier complet", tier: "Tier 2" },
  { name: "MaPrimeRénov", country: "🇫🇷", desc: "Dossier MPR, justificatifs réglementaires", tier: "Tier 2" },
  { name: "État des lieux", country: "🇫🇷🇲🇦", desc: "Entrée, sortie, inventaire contradictoire", tier: "Tier 1" },
];
export default function MarketplacePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Marketplace</h1>
      <div className="grid grid-cols-3 gap-4">
        {MODULES.map(m => (
          <div key={m.name} className="bg-[#0d0f18] border border-[#181c2c] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{m.country}</span>
              <span className="text-xs bg-[#3B5BDB]/20 text-[#3B5BDB] px-2 py-0.5 rounded font-medium">{m.tier}</span>
            </div>
            <h3 className="font-bold text-white mb-1">{m.name}</h3>
            <p className="text-xs text-[#6b7290] mb-4">{m.desc}</p>
            <button className="w-full py-2 border border-[#252a40] text-[#9ca3af] text-sm rounded-lg">Installer</button>
          </div>
        ))}
      </div>
    </div>
  );
}
