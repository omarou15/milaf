import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const PLAN_CREDITS: Record<string, number> = { starter: 100, pro: 500, business: 2000 };

export async function POST(req: NextRequest) {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!key || !whSecret) return NextResponse.json({ error: "Not configured" }, { status: 400 });

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key);
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

    const event = stripe.webhooks.constructEvent(body, sig, whSecret);
    console.log(`[webhook] ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const clerkId = session.metadata?.clerkId || session.client_reference_id;
      const planId = session.metadata?.planId;
      if (clerkId && planId) {
        await db.update(users).set({
          plan: planId as any, creditsTotal: PLAN_CREDITS[planId] || 10, creditsUsed: 0, updatedAt: new Date(),
        }).where(eq(users.clerkId, clerkId));
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as any;
      if (sub.metadata?.clerkId) {
        await db.update(users).set({ plan: "free" as any, creditsTotal: 10, creditsUsed: 0, updatedAt: new Date() }).where(eq(users.clerkId, sub.metadata.clerkId));
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as any;
      const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        if (sub.metadata?.clerkId && sub.metadata?.planId) {
          await db.update(users).set({ creditsUsed: 0, creditsTotal: PLAN_CREDITS[sub.metadata.planId] || 10, updatedAt: new Date() }).where(eq(users.clerkId, sub.metadata.clerkId));
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[webhook]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
