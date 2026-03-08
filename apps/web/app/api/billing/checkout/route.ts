import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const PRICE_MAP: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "",
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || "",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe non configuré. Contactez le support." }, { status: 503 });
    }

    const { planId, cycle = "monthly" } = await req.json();

    const prices = PRICE_MAP[planId];
    if (!prices) return NextResponse.json({ error: "Plan invalide" }, { status: 400 });

    const priceId = cycle === "yearly" ? prices.yearly : prices.monthly;
    if (!priceId) return NextResponse.json({ error: "Prix non configuré pour ce plan" }, { status: 400 });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/settings?billing=success&plan=${planId}`,
      cancel_url: `${baseUrl}/settings?billing=cancel`,
      client_reference_id: userId,
      metadata: { clerkId: userId, planId, cycle },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[billing/checkout]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
