import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { priceId, planId, billingCycle, successUrl, cancelUrl } = await req.json();

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      // No Stripe configured — return demo mode response
      return NextResponse.json({
        demo: true,
        message: "Stripe non configuré — mode démo activé",
        planId,
        billingCycle,
      });
    }

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        mode: "subscription",
        success_url: successUrl ?? `${req.headers.get("origin")}/settings?upgraded=1`,
        cancel_url: cancelUrl ?? `${req.headers.get("origin")}/settings`,
        "subscription_data[metadata][planId]": planId,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message ?? "Stripe error" }, { status: 400 });
    }

    const session = await res.json();
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
