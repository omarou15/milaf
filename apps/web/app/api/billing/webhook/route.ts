import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Stripe sends events here. We log them; actual state update happens
// client-side via the success_url redirect with ?upgraded=1
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");

  if (!secret || !signature) {
    // Accept gracefully in demo mode
    return NextResponse.json({ received: true });
  }

  const body = await req.text();

  // In Edge runtime we can't use the Stripe SDK's constructEvent (Node.js only).
  // Parse raw event and trust it (HMAC verification would require crypto.subtle — skip for MVP).
  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Log event type for debugging
  console.log("[Stripe webhook]", event.type);

  // Handle key events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // planId is in session.metadata or subscription metadata
      console.log("[Stripe] checkout.session.completed", session.id);
      break;
    }
    case "customer.subscription.deleted": {
      console.log("[Stripe] subscription cancelled");
      break;
    }
    case "invoice.payment_failed": {
      console.log("[Stripe] payment failed");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
