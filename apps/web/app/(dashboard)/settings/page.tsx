export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Paramètres</h1>
      <div className="bg-[#0d0f18] border border-[#181c2c] rounded-xl p-6 max-w-xl">
        <h2 className="font-semibold text-white mb-2">Clé API Anthropic (BYOK)</h2>
        <p className="text-sm text-[#6b7290] mb-4">Chiffrée AES-256. Jamais stockée en clair.</p>
        <div className="flex gap-3">
          <input type="password" placeholder="sk-ant-..." className="flex-1 bg-[#06070c] border border-[#252a40] rounded-lg px-4 py-2 text-sm text-white outline-none" />
          <button className="px-4 py-2 bg-[#3B5BDB] text-white rounded-lg text-sm font-semibold">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
