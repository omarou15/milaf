export default function TemplatesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="text-[#6b7290] text-sm mt-1">Gérez vos modèles de documents</p>
        </div>
        <button className="px-4 py-2 bg-[#3B5BDB] text-white rounded-lg text-sm font-semibold">+ Nouveau template</button>
      </div>
      <div className="border border-dashed border-[#252a40] rounded-xl p-16 text-center">
        <div className="text-4xl mb-4">◈</div>
        <div className="text-white font-semibold mb-2">Aucun template</div>
        <p className="text-[#6b7290] text-sm">Uploadez un Word (Tier 1), PDF AcroForm (Tier 2) ou créez depuis zéro</p>
      </div>
    </div>
  );
}
