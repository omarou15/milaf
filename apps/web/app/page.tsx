import Link from "next/link";

const FEATURES = [
  {
    icon: "📝",
    tier: "Tier 1",
    title: "Word balisé",
    desc: "Uploadez un .docx avec des balises {{champs}}. Mi-Laf détecte et remplit automatiquement.",
    credits: "1 crédit",
    color: "#3B5BDB",
  },
  {
    icon: "📄",
    tier: "Tier 2",
    title: "PDF AcroForm",
    desc: "Vos formulaires PDF existants remplis en masse. Checkboxes, listes déroulantes, tout.",
    credits: "2 crédits",
    color: "#2ee8c8",
  },
  {
    icon: "🎯",
    tier: "Tier 3",
    title: "Pixel Perfect",
    desc: "Vision IA pour tout document figé. Remplit même les PDFs sans formulaire.",
    credits: "5 crédits",
    color: "#a16ef8",
  },
];

const USECASES = [
  { emoji: "🇫🇷", label: "CEE France", sub: "Devis, attestations, factures, FOS" },
  { emoji: "⚖️", label: "Juridique", sub: "Contrats, mandats, procurations" },
  { emoji: "🏗️", label: "BTP", sub: "PPSPS, DOE, PV de réception" },
  { emoji: "🏥", label: "Santé", sub: "Ordonnances, certificats médicaux" },
  { emoji: "🎓", label: "Éducation", sub: "Bulletins, diplômes, attestations" },
  { emoji: "🏦", label: "Finance", sub: "Factures, devis, rapports" },
];

const PLANS = [
  { name: "Gratuit", price: 0, credits: 10, color: "#6b7290", features: ["10 crédits/mois", "Tier 1 uniquement", "3 templates"] },
  { name: "Starter", price: 15, credits: 100, color: "#3B5BDB", features: ["100 crédits/mois", "Tier 1 + Tier 2", "10 templates", "3 automations"] },
  { name: "Pro", price: 39, credits: 500, color: "#2ee8c8", popular: true, features: ["500 crédits/mois", "Tous les tiers", "Illimité", "10 automations", "API access"] },
  { name: "Business", price: 99, credits: 2000, color: "#a16ef8", features: ["2 000 crédits/mois", "Tous les tiers", "Illimité", "Automations ∞", "Chat dédié"] },
];

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-[#06070c] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">M</div>
          <span className="font-bold text-white">Mi-Laf</span>
          <span className="text-[#3a3f5c] text-sm">ملف</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#6b7290] hover:text-white transition-colors px-3 py-1.5">
            Se connecter
          </Link>
          <Link href="/signup" className="text-sm font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors">
            Essayer gratuitement
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-xs text-indigo-400 font-semibold mb-6">
          ✦ Génération documentaire universelle
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-6">
          N&apos;importe quel document.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            N&apos;importe quel pays.
          </span>
        </h1>
        <p className="text-[#6b7290] text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Mi-Laf transforme vos templates Word et PDF en machines à générer des documents.
          Automatisez, multipliez, livrez — en quelques secondes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/onboarding"
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-colors text-sm">
            Commencer gratuitement →
          </Link>
          <Link href="/login"
            className="px-8 py-3.5 bg-[#0d0f18] border border-[#1e2235] hover:border-[#2a2f48] text-white font-semibold rounded-2xl transition-colors text-sm">
            Se connecter
          </Link>
        </div>
        <p className="text-xs text-[#3a3f5c] mt-4">Pas de carte bancaire. 10 crédits gratuits.</p>
      </section>

      {/* 3 Tiers */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">3 niveaux de puissance</h2>
          <p className="text-[#6b7290]">Du simple Word balisé à la vision IA pour tout document figé.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.tier}
              className="p-6 bg-[#0d0f18] border border-[#1e2235] rounded-2xl relative overflow-hidden group hover:border-[#2a2f48] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20"
                style={{ background: f.color }} />
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="text-xs font-bold mb-1" style={{ color: f.color }}>{f.tier}</div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-[#6b7290] leading-relaxed mb-4">{f.desc}</p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                style={{ color: f.color, borderColor: `${f.color}30`, background: `${f.color}10` }}>
                {f.credits}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Automations feature */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20 rounded-3xl p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="text-xs font-bold text-indigo-400 mb-3 uppercase tracking-wider">⚡ Automation Engine</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Générez des documents<br />
              <span className="text-indigo-400">sans lever le petit doigt</span>
            </h2>
            <p className="text-[#6b7290] leading-relaxed mb-6">
              Créez des automatisations déclenchées par un cron, un webhook HTTP ou votre propre API.
              Mappez les champs une fois, génération infinie.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: "⏱", label: "Planifié", sub: "Quotidien · Hebdo · Mensuel" },
                { icon: "⚡", label: "Webhook", sub: "HTTP entrant signé HMAC" },
                { icon: "⟁", label: "API REST", sub: "POST /api/automations/{id}/run" },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-2.5 px-4 py-2.5 bg-[#0d0f18] border border-[#1e2235] rounded-xl">
                  <span className="text-lg">{t.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-white">{t.label}</div>
                    <div className="text-[10px] text-[#6b7290]">{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Pour tous les secteurs</h2>
          <p className="text-[#6b7290]">Mi-Laf s&apos;adapte à n&apos;importe quel pays, langue et secteur.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {USECASES.map(u => (
            <div key={u.label} className="p-4 bg-[#0d0f18] border border-[#1e2235] rounded-2xl text-center hover:border-[#2a2f48] transition-all">
              <div className="text-3xl mb-2">{u.emoji}</div>
              <div className="text-xs font-semibold text-white">{u.label}</div>
              <div className="text-[10px] text-[#6b7290] mt-0.5 leading-tight">{u.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 pb-24 max-w-6xl mx-auto" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Tarifs simples et transparents</h2>
          <p className="text-[#6b7290]">Commencez gratuitement. Upgradez quand vous avez besoin de plus.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {PLANS.map(p => (
            <div key={p.name}
              className={`p-6 rounded-2xl border relative ${p.popular ? "border-2" : "border border-[#1e2235] bg-[#0d0f18]"}`}
              style={p.popular ? { borderColor: p.color, background: `${p.color}08` } : {}}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 rounded-full text-white" style={{ background: p.color }}>
                  Populaire
                </div>
              )}
              <div className="text-sm font-bold mb-1" style={{ color: p.color }}>{p.name}</div>
              <div className="text-3xl font-black text-white mb-0.5">
                {p.price === 0 ? "0€" : `${p.price}€`}
                {p.price > 0 && <span className="text-sm text-[#6b7290] font-normal">/mois</span>}
              </div>
              <div className="text-xs text-[#6b7290] mb-4">{p.credits} crédits/mois</div>
              <ul className="space-y-2 mb-6">
                {p.features.map(f => (
                  <li key={f} className="text-xs text-[#6b7290] flex items-start gap-1.5">
                    <span style={{ color: p.color }} className="flex-shrink-0 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/onboarding"
                className="block w-full py-2.5 rounded-xl text-xs font-bold text-center transition-colors text-white"
                style={{ background: p.popular ? p.color : "#1e2235" }}>
                {p.price === 0 ? "Commencer" : `Choisir ${p.name}`}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-br from-indigo-600/15 to-cyan-600/5 border border-indigo-500/20 rounded-3xl p-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Prêt à automatiser vos documents ?
          </h2>
          <p className="text-[#6b7290] mb-6">10 crédits gratuits. Aucune carte requise. Prêt en 2 minutes.</p>
          <Link href="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-colors">
            Créer mon compte gratuit →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e2235] px-6 py-6 max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">M</div>
          <span className="text-sm text-[#6b7290]">Mi-Laf ملف</span>
          <span className="text-xs text-[#3a3f5c]">v0.5.0 — Beta</span>
        </div>
        <div className="flex gap-4 text-xs text-[#3a3f5c]">
          <Link href="#pricing" className="hover:text-white transition-colors">Tarifs</Link>
          <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
          <Link href="/onboarding" className="hover:text-white transition-colors">S&apos;inscrire</Link>
        </div>
      </footer>

    </main>
  );
}
