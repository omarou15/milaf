import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const PLAN_CREDITS: Record<string, number> = {
  starter: 100,
  pro: 500,
  business: 2000,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("[webhook] Signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`[webhook] ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId || session.client_reference_id;
        const planId = session.metadata?.planId;

        if (clerkId && planId) {
          const credits = PLAN_CREDITS[planId] || 10;
          await db.update(users).set({
            plan: planId as any,
            creditsTotal: credits,
            creditsUsed: 0,
            updatedAt: new Date(),
          }).where(eq(users.clerkId, clerkId));
          console.log(`[webhook] User ${clerkId} upgraded to ${planId} (${credits} credits)`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        // Handle plan changes, renewals
        console.log(`[webhook] Subscription updated: ${sub.id}, status: ${sub.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const clerkId = sub.metadata?.clerkId;
        if (clerkId) {
          await db.update(users).set({
            plan: "free",
            creditsTotal: 10,
            creditsUsed: 0,
            updatedAt: new Date(),
          }).where(eq(users.clerkId, clerkId));
          console.log(`[webhook] User ${clerkId} downgraded to free`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Monthly renewal — reset credits
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const clerkId = sub.metadata?.clerkId;
          const planId = sub.metadata?.planId;
          if (clerkId && planId) {
            const credits = PLAN_CREDITS[planId] || 10;
            await db.update(users).set({
              creditsUsed: 0,
              creditsTotal: credits,
              updatedAt: new Date(),
            }).where(eq(users.clerkId, clerkId));
            console.log(`[webhook] Credits reset for ${clerkId}: ${credits}`);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[webhook] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
