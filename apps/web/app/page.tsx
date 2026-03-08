import Link from "next/link";

const TIERS = [
  { icon: "📝", tier: "Tier 1", title: "Word balisé", desc: "Templates {{balisés}} remplis automatiquement", credits: "1", color: "#3B5BDB" },
  { icon: "📄", tier: "Tier 2", title: "PDF AcroForm", desc: "Formulaires PDF officiels remplis en masse", credits: "2", color: "#2ee8c8" },
  { icon: "🎯", tier: "Tier 3", title: "Pixel Perfect", desc: "Vision IA pour tout document figé", credits: "5", color: "#a16ef8" },
  { icon: "🧬", tier: "Tier 4", title: "Clone IA", desc: "Upload un PDF, Mi-Laf l'apprend pour toujours", credits: "10", color: "#f59e0b" },
];

const SECTORS = [
  { emoji: "💼", label: "Finance", sub: "Factures, devis, avoirs" },
  { emoji: "🔑", label: "Immobilier", sub: "Baux, EDL, quittances" },
  { emoji: "👔", label: "RH", sub: "Contrats, attestations, paie" },
  { emoji: "⚖️", label: "Juridique", sub: "Mise en demeure, procuration" },
  { emoji: "⚡", label: "Énergie", sub: "CEE, DPE, audits" },
  { emoji: "🏗️", label: "BTP", sub: "PPSPS, DOE, PV réception" },
];

const PLANS = [
  { name: "Gratuit", price: "0", credits: "10", color: "#6b7290", features: ["10 crédits/mois", "Tier 1", "3 templates"] },
  { name: "Starter", price: "15", credits: "100", color: "#3B5BDB", features: ["100 crédits/mois", "Tier 1 + 2", "10 templates", "3 automations"] },
  { name: "Pro", price: "39", credits: "500", color: "#2ee8c8", popular: true, features: ["500 crédits/mois", "Tous les tiers", "Illimité", "API access"] },
  { name: "Business", price: "99", credits: "2 000", color: "#f59e0b", features: ["2 000 crédits/mois", "Tous les tiers", "Illimité", "Chat dédié"] },
];

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-[#06070c] text-white overflow-x-hidden grain">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto fade-up">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-600/20">M</div>
          <span className="font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Mi-Laf</span>
          <span className="text-[#3a3f5c] text-sm ml-0.5">ملف</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#6b7290] hover:text-white transition-colors px-3 py-1.5 hidden sm:block">Connexion</Link>
          <Link href="/signup" className="text-sm font-semibold px-5 py-2.5 bg-white text-[#06070c] hover:bg-gray-100 rounded-full transition-colors">
            Essayer gratuitement
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="px-6 pt-20 pb-24 text-center max-w-4xl mx-auto relative">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/[0.07] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0d0f18] border border-[#1e2235] rounded-full text-xs text-[#6b7290] font-medium mb-8 fade-up delay-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Génération documentaire par IA
          </div>

          <h1 className="text-5xl sm:text-7xl font-normal tracking-tight leading-[1.1] mb-6 fade-up delay-2" style={{ fontFamily: 'var(--font-display)' }}>
            Tu décris.
            <br />
            <em className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400">
              Mi-Laf génère.
            </em>
          </h1>

          <p className="text-[#6b7290] text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed fade-up delay-3" style={{ fontFamily: 'var(--font-body)' }}>
            Le document parfait en 30 secondes.
            <br className="hidden sm:block" />
            Factures, contrats, baux, attestations — décrivez en français, téléchargez en .docx.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center fade-up delay-4">
            <Link href="/signup"
              className="px-8 py-4 bg-white text-[#06070c] font-bold rounded-full transition-all hover:shadow-lg hover:shadow-white/10 text-sm">
              Commencer gratuitement →
            </Link>
            <Link href="/login"
              className="px-8 py-4 bg-[#0d0f18] border border-[#1e2235] hover:border-[#2a2f48] text-white font-semibold rounded-full transition-all text-sm">
              Se connecter
            </Link>
          </div>
          <p className="text-xs text-[#3a3f5c] mt-5 fade-up delay-5">Pas de carte bancaire · 10 crédits gratuits</p>
        </div>
      </section>

      {/* ── Demo visual ── */}
      <section className="px-6 pb-24 max-w-4xl mx-auto fade-up delay-6">
        <div className="bg-[#0d0f18] border border-[#1e2235] rounded-2xl p-6 sm:p-8 glow-indigo">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            <span className="text-[10px] text-[#3a3f5c] ml-2 font-mono">milaf.vercel.app/chat</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%]">
                Facture pour M. Dupont, plomberie, remplacement chauffe-eau 200L, total 1500€ TTC
              </div>
            </div>
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">M</div>
              <div className="space-y-2 max-w-[85%]">
                <div className="text-sm text-[#c8cfe8]">Voici votre facture complète, prête à envoyer :</div>
                <div className="border border-emerald-500/30 bg-emerald-500/[0.03] rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">Facture Dupont — Mars 2026</div>
                    <div className="text-[10px] text-[#6b7290]">Document complet avec TVA, mentions légales</div>
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">⬇ .docx</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 Tiers ── */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            4 niveaux de puissance
          </h2>
          <p className="text-[#6b7290]">Du simple Word balisé au clonage IA de n&apos;importe quel document.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((t, i) => (
            <div key={t.tier}
              className={`p-6 bg-[#0d0f18] border border-[#1e2235] rounded-2xl relative overflow-hidden group hover:border-[#2a2f48] transition-all hover-lift fade-up delay-${i + 1}`}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"
                style={{ background: t.color }} />
              <div className="text-3xl mb-4">{t.icon}</div>
              <div className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: t.color }}>{t.tier}</div>
              <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>{t.title}</h3>
              <p className="text-sm text-[#6b7290] leading-relaxed mb-4">{t.desc}</p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                style={{ color: t.color, borderColor: `${t.color}30`, background: `${t.color}10` }}>
                {t.credits} crédit{Number(t.credits) > 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Killer feature: Clone IA ── */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-amber-500/[0.06] to-orange-600/[0.03] border border-amber-500/20 rounded-3xl p-8 sm:p-12 glow-amber">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">🧬 Clone IA — La rupture</div>
              <h2 className="text-2xl sm:text-3xl tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Uploadez un document.
                <br />
                <em className="text-amber-400">Mi-Laf l&apos;apprend pour toujours.</em>
              </h2>
              <p className="text-[#6b7290] leading-relaxed mb-6">
                PyMuPDF analyse chaque pixel. Claude détecte les champs variables.
                Le format devient disponible dans Mi-Laf — reproductible à l&apos;infini avec vos données.
              </p>
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full text-sm transition-all">
                Essayer le Clone IA →
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { n: "1", icon: "📄", label: "Upload", desc: "N'importe quel PDF" },
                { n: "2", icon: "🔬", label: "Analyse", desc: "PyMuPDF extrait tout pixel par pixel" },
                { n: "3", icon: "🧠", label: "Claude IA", desc: "Détecte les champs variables" },
                { n: "4", icon: "♾️", label: "Reproduit", desc: "À l'infini, avec vos données" },
              ].map((s, i) => (
                <div key={s.n} className={`flex items-center gap-4 p-3 bg-[#06070c]/60 border border-amber-500/10 rounded-xl slide-in delay-${i + 1}`}>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-sm flex-shrink-0">{s.icon}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">{s.label}</div>
                    <div className="text-[10px] text-[#6b7290]">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Sectors ── */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Tous les secteurs. Tous les pays.
          </h2>
          <p className="text-[#6b7290]">16 templates prêts à l&apos;emploi. Des centaines à venir.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {SECTORS.map((s, i) => (
            <div key={s.label} className={`p-4 bg-[#0d0f18] border border-[#1e2235] rounded-2xl text-center hover:border-[#2a2f48] transition-all hover-lift fade-up delay-${i + 1}`}>
              <div className="text-2xl mb-2">{s.emoji}</div>
              <div className="text-xs font-semibold text-white">{s.label}</div>
              <div className="text-[10px] text-[#6b7290] mt-0.5 leading-tight">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── vs Competition ── */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Pourquoi Mi-Laf ?
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { vs: "vs Canva / Visme", icon: "🎨", text: "Eux : 1h de drag & drop. Mi-Laf : 30 secondes, document conforme, prêt à signer." },
            { vs: "vs Secrétariat", icon: "👩‍💼", text: "Ce qu'une secrétaire fait en 2h, Mi-Laf en 30 secondes. 24/7, zéro erreur, 15€/mois." },
            { vs: "vs Pixel CRM", icon: "📊", text: "Leur core feature, en mieux. Plus de secteurs. Clone IA. 10x moins cher." },
          ].map((c) => (
            <div key={c.vs} className="p-6 bg-[#0d0f18] border border-[#1e2235] rounded-2xl hover-lift">
              <div className="text-2xl mb-3">{c.icon}</div>
              <div className="text-xs font-bold text-amber-400 mb-2">{c.vs}</div>
              <p className="text-sm text-[#6b7290] leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-6 pb-24 max-w-5xl mx-auto" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Tarifs transparents
          </h2>
          <p className="text-[#6b7290]">Commencez gratuitement. Pas de carte bancaire.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p) => (
            <div key={p.name}
              className={`p-6 rounded-2xl relative hover-lift ${p.popular ? "border-2 bg-[#0d0f18]" : "border border-[#1e2235] bg-[#0d0f18]"}`}
              style={p.popular ? { borderColor: p.color } : {}}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 rounded-full text-[#06070c]" style={{ background: p.color }}>
                  Populaire
                </div>
              )}
              <div className="text-sm font-bold mb-1" style={{ color: p.color }}>{p.name}</div>
              <div className="flex items-baseline gap-0.5 mb-0.5">
                <span className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{p.price}€</span>
                {Number(p.price) > 0 && <span className="text-sm text-[#6b7290]">/mois</span>}
              </div>
              <div className="text-xs text-[#6b7290] mb-5">{p.credits} crédits/mois</div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="text-xs text-[#6b7290] flex items-start gap-1.5">
                    <span style={{ color: p.color }} className="flex-shrink-0 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup"
                className="block w-full py-2.5 rounded-xl text-xs font-bold text-center transition-all"
                style={{ background: p.popular ? p.color : "#1e2235", color: p.popular ? "#06070c" : "white" }}>
                {Number(p.price) === 0 ? "Commencer" : `Choisir ${p.name}`}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 pb-24 max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-br from-indigo-600/10 to-cyan-600/5 border border-indigo-500/20 rounded-3xl p-10 glow-indigo">
          <h2 className="text-3xl sm:text-4xl tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Prêt à ne plus jamais perdre
            <br />
            <em className="text-indigo-400">de temps sur un document ?</em>
          </h2>
          <p className="text-[#6b7290] mb-8">10 crédits gratuits. Aucune carte requise. Prêt en 30 secondes.</p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#06070c] font-bold rounded-full transition-all hover:shadow-lg hover:shadow-white/10 text-sm">
            Créer mon compte gratuit →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1e2235] px-6 py-8 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold">M</div>
            <span className="text-sm text-[#6b7290]">Mi-Laf ملف</span>
            <span className="text-xs text-[#3a3f5c]">· Génération documentaire par IA</span>
          </div>
          <div className="flex gap-5 text-xs text-[#3a3f5c]">
            <Link href="#pricing" className="hover:text-white transition-colors">Tarifs</Link>
            <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
            <Link href="/signup" className="hover:text-white transition-colors">S&apos;inscrire</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
