"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PLANS, ORDERED_PLANS, getBilling, saveBilling, PlanId } from "@/lib/billing/plans";

const STEPS = [
  { id: "welcome",  label: "Bienvenue" },
  { id: "plan",     label: "Votre plan" },
  { id: "template", label: "Premier template" },
  { id: "done",     label: "C'est parti !" },
];

// ── Step 1 — Welcome ──────────────────────────────────────────────────────────
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      <div className="text-6xl">📄</div>
      <div>
        <h2 className="text-2xl font-bold text-white">Bienvenue sur Mi-Laf</h2>
        <p className="text-[#6b7290] mt-2 max-w-sm">
          Le moteur universel de génération documentaire. En 3 minutes, votre premier document sera prêt.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        {[
          { icon: "📝", label: "Word balisé", sub: "Tier 1 — 1 crédit" },
          { icon: "📄", label: "PDF AcroForm", sub: "Tier 2 — 2 crédits" },
          { icon: "🎯", label: "Pixel Perfect", sub: "Tier 3 — 5 crédits" },
        ].map(f => (
          <div key={f.label} className="bg-[#0d0f18] border border-[#1e2235] rounded-xl p-3">
            <div className="text-2xl mb-1">{f.icon}</div>
            <div className="text-xs font-semibold text-white">{f.label}</div>
            <div className="text-[10px] text-[#6b7290] mt-0.5">{f.sub}</div>
          </div>
        ))}
      </div>
      <button onClick={onNext}
        className="w-full max-w-sm py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-colors">
        Commencer →
      </button>
    </div>
  );
}

// ── Step 2 — Plan ─────────────────────────────────────────────────────────────
function PlanStep({ onNext }: { onNext: (planId: PlanId) => void }) {
  const [selected, setSelected] = useState<PlanId>("starter");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  const handleSelect = async () => {
    setLoading(true);
    const plan = PLANS[selected];

    if (selected === "free") {
      const b = getBilling();
      saveBilling({ ...b, planId: "free", creditsTotal: 10, billingCycle: cycle });
      onNext("free");
      return;
    }

    const priceId = cycle === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceId;
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, planId: selected, billingCycle: cycle }),
    });
    const data = await res.json();

    if (data.demo || !data.url) {
      // Demo mode — simulate upgrade
      const b = getBilling();
      saveBilling({ ...b, planId: selected, creditsTotal: plan.credits, billingCycle: cycle });
      onNext(selected);
    } else {
      window.location.href = data.url;
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Choisissez votre plan</h2>
        <p className="text-[#6b7290] mt-1 text-sm">Commencez gratuitement, upgradez quand vous voulez.</p>
      </div>

      {/* Cycle toggle */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => setCycle("monthly")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${cycle === "monthly" ? "bg-indigo-600 text-white" : "text-[#6b7290] hover:text-white"}`}>
          Mensuel
        </button>
        <button onClick={() => setCycle("yearly")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${cycle === "yearly" ? "bg-indigo-600 text-white" : "text-[#6b7290] hover:text-white"}`}>
          Annuel
          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full">-18%</span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["free","starter","pro","business"] as PlanId[]).map(pid => {
          const p = PLANS[pid];
          const price = cycle === "yearly" ? p.priceYearly : p.price;
          const isSelected = selected === pid;
          return (
            <button key={pid} onClick={() => setSelected(pid)}
              className={`p-4 rounded-2xl border text-left transition-all relative ${isSelected ? "border-2" : "border border-[#1e2235] bg-[#0a0b12] hover:border-[#2a2f48]"}`}
              style={isSelected ? { borderColor: p.color, background: `${p.color}12` } : {}}>
              {pid === "pro" && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Populaire</div>
              )}
              <div className="text-2xl mb-2">{p.emoji}</div>
              <div className="text-sm font-bold text-white">{p.name}</div>
              <div className="mt-1">
                {price === 0 ? (
                  <span className="text-xl font-bold text-white">Gratuit</span>
                ) : (
                  <span className="text-xl font-bold text-white">{price}€<span className="text-xs text-[#6b7290] font-normal">/mois</span></span>
                )}
              </div>
              <div className="text-[10px] text-[#6b7290] mt-1">{p.credits} crédits/mois</div>
              <ul className="mt-3 space-y-1">
                {p.features.slice(0, 3).map(f => (
                  <li key={f} className="text-[10px] text-[#6b7290] flex items-start gap-1">
                    <span style={{ color: p.color }} className="mt-0.5 flex-shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <button onClick={handleSelect} disabled={loading}
        className="w-full py-3 font-semibold rounded-2xl transition-colors text-white disabled:opacity-40"
        style={{ background: PLANS[selected].color }}>
        {loading ? "Chargement…" : selected === "free" ? "Continuer gratuitement" : `Choisir ${PLANS[selected].name}`}
      </button>
    </div>
  );
}

// ── Step 3 — First template ───────────────────────────────────────────────────
function TemplateStep({ onNext }: { onNext: () => void }) {
  const [choice, setChoice] = useState<"blank" | "cee" | "skip">("blank");
  const [done, setDone] = useState(false);

  const handleApply = () => {
    if (choice === "cee") {
      // Install CEE France module
      fetch("/api/modules?id=cee-france")
        .then(r => r.json())
        .then(data => {
          const existing = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
          const toAdd = (data.templates ?? []).filter((t: any) => !existing.find((e: any) => e.id === t.id));
          localStorage.setItem("milaf_templates", JSON.stringify([...existing, ...toAdd]));
        });
    }
    setDone(true);
    setTimeout(onNext, 600);
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-lg mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Votre premier template</h2>
        <p className="text-[#6b7290] mt-1 text-sm">Commencez avec un modèle ou créez le vôtre.</p>
      </div>

      <div className="space-y-3">
        {[
          { id: "blank" as const, icon: "✏️", title: "Template vierge", sub: "Je vais créer le mien depuis /templates" },
          { id: "cee" as const, icon: "🇫🇷", title: "Module CEE France", sub: "Devis, attestation, facture, FOS — 4 templates prêts à l'emploi" },
          { id: "skip" as const, icon: "⏭", title: "Passer cette étape", sub: "Je configurerai mes templates plus tard" },
        ].map(opt => (
          <button key={opt.id} onClick={() => setChoice(opt.id)}
            className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${choice === opt.id ? "border-indigo-500 bg-indigo-500/10" : "border-[#1e2235] bg-[#0a0b12] hover:border-[#2a2f48]"}`}>
            <span className="text-2xl flex-shrink-0">{opt.icon}</span>
            <div>
              <div className="text-sm font-semibold text-white">{opt.title}</div>
              <div className="text-xs text-[#6b7290] mt-0.5">{opt.sub}</div>
            </div>
            {choice === opt.id && <span className="ml-auto text-indigo-400 flex-shrink-0">✓</span>}
          </button>
        ))}
      </div>

      <button onClick={handleApply} disabled={done}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold rounded-2xl transition-colors">
        {done ? "✓ Prêt !" : "Continuer →"}
      </button>
    </div>
  );
}

// ── Step 4 — Done ─────────────────────────────────────────────────────────────
function DoneStep({ planId, onFinish }: { planId: PlanId; onFinish: () => void }) {
  const plan = PLANS[planId];
  useEffect(() => {
    const b = getBilling();
    saveBilling({ ...b, onboardingComplete: true });
  }, []);

  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-4xl">🎉</div>
      <div>
        <h2 className="text-2xl font-bold text-white">Tout est prêt !</h2>
        <p className="text-[#6b7290] mt-2">
          Vous êtes sur le plan <span className="font-semibold" style={{ color: plan.color }}>{plan.name}</span> avec{" "}
          <span className="text-white font-semibold">{plan.credits} crédits</span> par mois.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {[
          { href: "/templates/new", icon: "📝", label: "Créer un template" },
          { href: "/generate", icon: "⚡", label: "Générer un doc" },
          { href: "/marketplace", icon: "🏪", label: "Marketplace" },
          { href: "/automations", icon: "🤖", label: "Automatisations" },
        ].map(a => (
          <a key={a.href} href={a.href}
            className="flex items-center gap-2 p-3 bg-[#0d0f18] border border-[#1e2235] rounded-xl hover:border-[#2a2f48] transition-colors text-sm text-white">
            <span>{a.icon}</span>{a.label}
          </a>
        ))}
      </div>
      <button onClick={onFinish}
        className="w-full max-w-sm py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-colors">
        Accéder au dashboard →
      </button>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [planId, setPlanId] = useState<PlanId>("free");
  const router = useRouter();

  // Skip if already onboarded
  useEffect(() => {
    const b = getBilling();
    if (b.onboardingComplete) router.replace("/dashboard");
  }, [router]);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 py-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-2xl font-bold text-white">Mi-Laf <span className="text-[#6b7290] font-normal">ملف</span></div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < step ? "bg-indigo-600 text-white" :
              i === step ? "bg-indigo-600 text-white ring-2 ring-indigo-400/30" :
              "bg-[#0d0f18] border border-[#1e2235] text-[#6b7290]"
            }`}>
              {i < step ? "✓" : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-px transition-all ${i < step ? "bg-indigo-600" : "bg-[#1e2235]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="w-full max-w-2xl">
        {step === 0 && <WelcomeStep onNext={next} />}
        {step === 1 && <PlanStep onNext={(pid) => { setPlanId(pid); next(); }} />}
        {step === 2 && <TemplateStep onNext={next} />}
        {step === 3 && <DoneStep planId={planId} onFinish={() => router.push("/dashboard")} />}
      </div>
    </div>
  );
}
