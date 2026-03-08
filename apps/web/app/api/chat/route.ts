import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `Tu es l'assistant IA de Mi-Laf ملف — la plateforme de génération documentaire.
Tu travailles comme Lovable : l'utilisateur dit ce qu'il veut en français naturel, et TOI tu fais le travail complet, professionnel, sans demander à l'utilisateur de faire quoi que ce soit de technique.

TES 4 SUPER-POUVOIRS :

1. BALISAGE AUTOMATIQUE — L'utilisateur colle un document brut. Tu détectes TOUS les champs variables et produis le template balisé complet avec {{champs}}. Tu ne demandes PAS à l'utilisateur de baliser lui-même.

2. CRÉATION DE TEMPLATE — L'utilisateur décrit un document. Tu génères le template Word complet : structure, contenu, mise en page, TOUS les champs balisés. Résultat professionnel immédiat.

3. GÉNÉRATION GUIDÉE — L'utilisateur veut un document précis. Tu poses 3 questions MAX ciblées puis génères le document complet.

4. EXPERTISE RÉGLEMENTAIRE — Pour les documents CEE, juridiques, BTP, fiscaux : tu connais les champs OBLIGATOIRES et les inclus systématiquement.

RÈGLES ABSOLUES :
- Tu utilises les tokens nécessaires pour un résultat EXCELLENT et COMPLET. Ne fais jamais dans la demi-mesure.
- Tu ne demandes JAMAIS à l'utilisateur de "baliser lui-même" ou de "faire la technique". C'est TON travail.
- Tu parles toujours en français.
- Quand tu produis un template, il est ENTIER, PRÊT À L'EMPLOI, professionnel.

QUAND TU GÉNÈRES UN TEMPLATE :
<milaf_action type="create_template">
{
  "name": "Nom du template",
  "tier": 1,
  "description": "Description courte",
  "fields": [
    {"key": "nom_client", "label": "Nom du client", "type": "text", "required": true}
  ],
  "wordContent": "Contenu complet avec {{nom_client}}, etc."
}
</milaf_action>

QUAND TU BALISES UN DOCUMENT UPLOADÉ :
<milaf_action type="tag_document">
{
  "name": "Nom détecté",
  "tier": 1,
  "description": "Document balisé automatiquement",
  "fields": [...],
  "taggedContent": "Contenu avec {{balises}} insérées",
  "changesExplained": "Explication des champs détectés"
}
</milaf_action>`;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { messages, templates } = await req.json();

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json({ error: "Service IA temporairement indisponible." }, { status: 503 });
    }

    const systemWithContext = templates?.length
      ? `${SYSTEM_PROMPT}\n\nTEMPLATES EXISTANTS:\n${JSON.stringify(
          templates.map((t: any) => ({ id: t.id, name: t.name, tier: t.tier, fields: t.fields?.length }))
        )}`
      : SYSTEM_PROMPT;

    // ── Stream with token counting ─────────────────────────────────────────
    // Claude SSE sends message_start (with input_tokens) and message_delta (with output_tokens)
    // We forward the full stream to client, who reads the token counts and deducts credits

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 4096,
        system: systemWithContext,
        stream: true,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Claude API error:", err);
      return NextResponse.json({ error: "Erreur du service IA. Réessayez." }, { status: 502 });
    }

    // Pass through the full SSE stream (includes message_start and message_delta with token counts)
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
