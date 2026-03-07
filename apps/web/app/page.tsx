import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#06070c] text-white px-6">
      <div className="text-center max-w-2xl">
        <div className="text-6xl font-bold text-[#3B5BDB] mb-1 tracking-tight">Mi-Laf</div>
        <div className="text-4xl font-bold text-white/80 mb-4">ملف</div>
        <p className="text-[#6b7290] text-lg mb-10">
          Le moteur universel de génération et d'automatisation documentaire.<br/>
          Clonez, automatisez, maintenez. N'importe quel document. N'importe quel pays.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/signup" className="px-6 py-3 rounded-xl bg-[#3B5BDB] text-white font-semibold hover:bg-[#2f4dc4] transition">
            Commencer gratuitement
          </Link>
          <Link href="/login" className="px-6 py-3 rounded-xl border border-[#252a40] text-[#9ca3af] font-semibold hover:border-[#3B5BDB] transition">
            Se connecter
          </Link>
        </div>
      </div>
    </main>
  );
}
