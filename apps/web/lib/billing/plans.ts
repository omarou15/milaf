export type PlanId = "free" | "starter" | "pro" | "business";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;        // EUR/month
  priceYearly: number;  // EUR/month billed yearly
  credits: number;      // per month
  stripePriceId: string;
  stripePriceIdYearly: string;
  color: string;
  emoji: string;
  features: string[];
  limits: {
    templates: number | "unlimited";
    automations: number | "unlimited";
    tier3: boolean;
    apiAccess: boolean;
    alwaysOn: boolean;
    supportLevel: "community" | "email" | "chat";
    historyDays: number | "unlimited";
  };
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Gratuit",
    price: 0,
    priceYearly: 0,
    credits: 10,
    stripePriceId: "",
    stripePriceIdYearly: "",
    color: "#6b7290",
    emoji: "🌱",
    features: ["10 crédits/mois", "Tier 1 uniquement", "3 templates max", "Support communauté"],
    limits: { templates: 3, automations: 0, tier3: false, apiAccess: false, alwaysOn: false, supportLevel: "community", historyDays: 7 },
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 15,
    priceYearly: 12,
    credits: 100,
    stripePriceId: "price_starter_monthly",
    stripePriceIdYearly: "price_starter_yearly",
    color: "#3B5BDB",
    emoji: "⚡",
    features: ["100 crédits/mois", "Tier 1 + Tier 2", "10 templates", "3 automations", "Support communauté", "7 jours d'historique"],
    limits: { templates: 10, automations: 3, tier3: false, apiAccess: false, alwaysOn: false, supportLevel: "community", historyDays: 7 },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 39,
    priceYearly: 32,
    credits: 500,
    stripePriceId: "price_pro_monthly",
    stripePriceIdYearly: "price_pro_yearly",
    color: "#2ee8c8",
    emoji: "🚀",
    features: ["500 crédits/mois", "Tous les tiers (1, 2, 3)", "Templates illimités", "10 automations", "Always-on 8h/j", "API access", "Support email", "30 jours d'historique"],
    limits: { templates: "unlimited", automations: 10, tier3: true, apiAccess: true, alwaysOn: false, supportLevel: "email", historyDays: 30 },
  },
  business: {
    id: "business",
    name: "Business",
    price: 99,
    priceYearly: 82,
    credits: 2000,
    stripePriceId: "price_business_monthly",
    stripePriceIdYearly: "price_business_yearly",
    color: "#a16ef8",
    emoji: "🏆",
    features: ["2 000 crédits/mois", "Tous les tiers", "Templates illimités", "Automations illimitées", "Always-on 24/7", "API access", "Marketplace custom", "Chat dédié", "Historique illimité"],
    limits: { templates: "unlimited", automations: "unlimited", tier3: true, apiAccess: true, alwaysOn: true, supportLevel: "chat", historyDays: "unlimited" },
  },
};

export const ORDERED_PLANS: PlanId[] = ["free", "starter", "pro", "business"];

// ── Credit costs ──────────────────────────────────────────────────────────────
export const CREDIT_COSTS = { tier1: 1, tier2: 2, tier3: 5 };

// ── localStorage billing store ────────────────────────────────────────────────
export interface BillingState {
  planId: PlanId;
  creditsUsed: number;
  creditsTotal: number;
  billingCycle: "monthly" | "yearly";
  subscriptionId?: string;
  customerId?: string;
  currentPeriodEnd?: string;
  onboardingComplete: boolean;
}

const BILLING_KEY = "milaf_billing";

export function getBilling(): BillingState {
  if (typeof window === "undefined") return defaultBilling();
  return JSON.parse(localStorage.getItem(BILLING_KEY) || JSON.stringify(defaultBilling()));
}

export function saveBilling(state: BillingState) {
  localStorage.setItem(BILLING_KEY, JSON.stringify(state));
}

function defaultBilling(): BillingState {
  return { planId: "free", creditsUsed: 0, creditsTotal: 10, billingCycle: "monthly", onboardingComplete: false };
}

export function consumeCredits(n: number): boolean {
  const b = getBilling();
  if (b.creditsUsed + n > b.creditsTotal) return false;
  saveBilling({ ...b, creditsUsed: b.creditsUsed + n });
  return true;
}

export function getCreditsRemaining(): number {
  const b = getBilling();
  return Math.max(0, b.creditsTotal - b.creditsUsed);
}
