import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const TIERS = [
  { icon: "📝", tier: "Tier 1", title: "Word balisé", desc: "Templates {{balisés}} remplis automatiquement", credits: "1", color: "indigo" },
  { icon: "📄", tier: "Tier 2", title: "PDF AcroForm", desc: "Formulaires PDF officiels remplis en masse", credits: "2", color: "teal" },
  { icon: "🎯", tier: "Tier 3", title: "Pixel Perfect", desc: "Vision IA pour tout document figé", credits: "5", color: "purple" },
  { icon: "🧬", tier: "Tier 4", title: "Clone IA", desc: "Upload un PDF, Mi-Laf l'apprend pour toujours", credits: "10", color: "amber" },
];

const SECTORS = [
  { emoji: "💼", label: "Finance" }, { emoji: "🔑", label: "Immobilier" },
  { emoji: "👔", label: "RH" }, { emoji: "⚖️", label: "Juridique" },
  { emoji: "⚡", label: "Énergie" }, { emoji: "🏗️", label: "BTP" },
];

const PLANS = [
  { name: "Gratuit", price: "0", credits: "10", features: ["10 crédits/mois", "Tier 1", "3 templates"], pop: false },
  { name: "Starter", price: "15", credits: "100", features: ["100 crédits/mois", "Tier 1 + 2", "10 templates"], pop: false },
  { name: "Pro", price: "39", credits: "500", features: ["500 crédits/mois", "Tous les tiers", "Illimité", "API"], pop: true },
  { name: "Business", price: "99", credits: "2 000", features: ["2 000 crédits/mois", "Tous les tiers", "Chat dédié"], pop: false },
];

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto fade-up">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">M</div>
          <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Mi-Laf</span>
          <span className="text-gray-400 text-sm">ملف</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-1.5 hidden sm:block">Connexion</Link>
          <Link href="/signup" className="text-sm font-semibold px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors">
            Essayer gratuitement
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 sm:pt-24 pb-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 rounded-full text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-8 fade-up delay-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Génération documentaire par IA
        </div>

        <h1 className="text-5xl sm:text-7xl font-normal tracking-tight leading-[1.1] mb-6 fade-up delay-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Tu décris.
          <br />
          <em className="text-indigo-600 dark:text-indigo-400">Mi-Laf génère.</em>
        </h1>

        <p className="text-gray-500 dark:text-gray-400 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed fade-up delay-3">
          Le document parfait en 30 secondes.
          <br className="hidden sm:block" />
          Factures, contrats, baux, attestations — décrivez en français, recevez votre document prêt à envoyer.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center fade-up delay-4">
          <Link href="/signup" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full transition-colors text-sm">
            Commencer gratuitement →
          </Link>
          <Link href="/login" className="px-8 py-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-full transition-colors text-sm">
            Se connecter
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-5 fade-up delay-5">Pas de carte bancaire · 10 crédits gratuits</p>
      </section>

      {/* Demo */}
      <section className="px-6 pb-20 max-w-3xl mx-auto fade-up delay-6">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-[10px] text-gray-400 ml-2 font-mono">milaf.vercel.app/chat</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%]">
                Facture pour M. Dupont, plomberie, remplacement chauffe-eau, 1500€ TTC
              </div>
            </div>
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">M</div>
              <div className="space-y-2 max-w-[85%]">
                <div className="text-sm text-gray-600 dark:text-gray-300">Votre facture est prête :</div>
                <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Facture Dupont — Mars 2026</div>
                    <div className="text-[10px] text-gray-500">TVA, mentions légales, prêt à envoyer</div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="px-2.5 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg">⬇ .pdf</div>
                    <div className="px-2.5 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg">⬇ .docx</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Tiers */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl tracking-tight mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>4 niveaux de puissance</h2>
          <p className="text-gray-500">Du simple Word balisé au clonage IA de n&apos;importe quel document.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((t) => (
            <div key={t.tier} className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:shadow-md transition-all">
              <div className="text-3xl mb-4">{t.icon}</div>
              <div className="text-[10px] font-bold tracking-wider uppercase mb-1 text-indigo-600 dark:text-indigo-400">{t.tier}</div>
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>{t.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{t.desc}</p>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40">
                {t.credits} crédit{Number(t.credits) > 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Clone IA highlight */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3">🧬 Clone IA — La rupture</div>
              <h2 className="text-2xl sm:text-3xl tracking-tight mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Uploadez un document.
                <br /><em className="text-amber-600 dark:text-amber-400">Mi-Laf l&apos;apprend pour toujours.</em>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                PyMuPDF analyse chaque pixel. Claude détecte les champs variables.
                Le format devient reproductible à l&apos;infini avec vos données.
              </p>
              <Link href="/signup" className="inline-flex px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full text-sm transition-colors">
                Essayer le Clone IA →
              </Link>
            </div>
            <div className="space-y-2.5">
              {["📄 Upload — N'importe quel PDF", "🔬 Analyse — PyMuPDF pixel par pixel", "🧠 Claude IA — Détecte les champs", "♾️ Reproduit — À l'infini, vos données"].map((s) => (
                <div key={s} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-amber-100 dark:border-amber-900/40 rounded-xl">
                  <span className="text-sm">{s.split(" — ")[0]}</span>
                  <span className="text-xs text-gray-500">{s.split(" — ")[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="px-6 pb-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl tracking-tight mb-8" style={{ fontFamily: "'Instrument Serif', serif" }}>Tous les secteurs</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {SECTORS.map((s) => (
            <div key={s.label} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full text-sm font-medium">
              <span>{s.emoji}</span>{s.label}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 pb-20 max-w-5xl mx-auto" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl tracking-tight mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>Tarifs transparents</h2>
          <p className="text-gray-500">Commencez gratuitement. Pas de carte bancaire.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p) => (
            <div key={p.name} className={`p-6 rounded-2xl transition-all hover:shadow-md ${p.pop ? "border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" : "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"}`}>
              {p.pop && <div className="text-[10px] font-bold text-indigo-600 mb-2">★ POPULAIRE</div>}
              <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1">{p.name}</div>
              <div className="flex items-baseline gap-0.5 mb-1">
                <span className="text-3xl font-bold" style={{ fontFamily: "'Instrument Serif', serif" }}>{p.price}€</span>
                {Number(p.price) > 0 && <span className="text-sm text-gray-400">/mois</span>}
              </div>
              <div className="text-xs text-gray-400 mb-5">{p.credits} crédits/mois</div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-indigo-500">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`block w-full py-2.5 rounded-xl text-xs font-bold text-center transition-colors ${p.pop ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                {Number(p.price) === 0 ? "Commencer" : `Choisir ${p.name}`}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 rounded-3xl p-10">
          <h2 className="text-3xl tracking-tight mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Prêt à ne plus perdre de temps
            <br /><em className="text-indigo-600 dark:text-indigo-400">sur vos documents ?</em>
          </h2>
          <p className="text-gray-500 mb-8">10 crédits gratuits. Aucune carte requise.</p>
          <Link href="/signup" className="inline-flex px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-sm transition-colors">
            Créer mon compte gratuit →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 px-6 py-8 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">M</div>
            <span className="text-sm text-gray-500">Mi-Laf ملف</span>
          </div>
          <div className="flex gap-5 text-xs text-gray-400">
            <Link href="#pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Tarifs</Link>
            <Link href="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Connexion</Link>
            <Link href="/signup" className="hover:text-gray-900 dark:hover:text-white transition-colors">S&apos;inscrire</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
