import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key);

    const customers = await stripe.customers.search({
      query: `metadata['clerkId']:'${userId}'`,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ error: "Aucun abonnement trouvé" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${baseUrl}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[billing/portal]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
