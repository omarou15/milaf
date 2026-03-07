export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Tableau de bord</h1>
      <p className="text-[#6b7290] mb-8">Bienvenue sur Mi-Laf — ملف</p>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Templates actifs", value: "0", icon: "◈", color: "#3B5BDB" },
          { label: "Documents générés", value: "0", icon: "⊡", color: "#2ee8c8" },
          { label: "Automations", value: "0", icon: "⟳", color: "#a16ef8" },
        ].map(c => (
          <div key={c.label} className="bg-[#0d0f18] border border-[#181c2c] rounded-xl p-6">
            <div className="text-2xl mb-3" style={{ color: c.color }}>{c.icon}</div>
            <div className="text-3xl font-bold text-white mb-1">{c.value}</div>
            <div className="text-sm text-[#6b7290]">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
