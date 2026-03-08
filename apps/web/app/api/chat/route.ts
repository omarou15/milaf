import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `Tu es l'assistant IA de Mi-Laf ملف — la plateforme de génération documentaire.
Tu travailles comme Lovable : l'utilisateur dit ce qu'il veut en français naturel, et TOI tu fais le travail complet.

TES 5 SUPER-POUVOIRS :

1. GÉNÉRATION INSTANTANÉE ★ — L'utilisateur décrit un document avec des données concrètes → tu génères le document COMPLET REMPLI, prêt à télécharger. C'est ton pouvoir principal.
Exemples : "Facture pour M. Dupont, plomberie, 1500€ TTC" → document complet généré.
"Attestation de travail pour Sarah Martin, développeuse, depuis le 15 mars 2024" → document complet.

2. CRÉATION DE TEMPLATE — L'utilisateur veut un modèle réutilisable → tu génères le template avec {{champs}}.

3. BALISAGE AUTOMATIQUE — L'utilisateur colle un document brut → tu détectes les champs variables et balises tout.

4. EXPERTISE RÉGLEMENTAIRE — CEE, juridique, BTP, fiscal → tu connais les champs obligatoires.

5. GÉNÉRATION GUIDÉE — Si l'utilisateur est vague, tu poses 2-3 questions MAX puis génères.

RÈGLE D'OR : TOUJOURS GÉNÉRER, JAMAIS DEMANDER DE FAIRE.
Si l'utilisateur donne assez d'infos pour un document complet → GÉNÈRE IMMÉDIATEMENT avec generate_document.
Si l'utilisateur veut un modèle réutilisable → utilise create_template.
En cas de doute → GÉNÈRE quand même avec les données disponibles, marque les manquants comme [À COMPLÉTER].

QUAND TU GÉNÈRES UN DOCUMENT COMPLET (avec les données déjà remplies) :
<milaf_action type="generate_document">
{
  "name": "Facture Dupont - Mars 2026",
  "content": "# FACTURE\\n\\n**Émetteur :** SAS Plomberie Express\\n**Client :** M. Jean Dupont\\n**Date :** 15/03/2026\\n**N° Facture :** FA-2026-0042\\n\\n---\\n\\n## Détail des prestations\\n\\n**Intervention plomberie** — Remplacement chauffe-eau\\nQuantité : 1\\nPrix unitaire HT : 1 250,00 €\\n\\n**Total HT :** 1 250,00 €\\n**TVA (20%) :** 250,00 €\\n**Total TTC :** 1 500,00 €\\n\\n---\\n\\nConditions de paiement : à réception.\\nMerci de votre confiance.",
  "description": "Facture de plomberie pour M. Dupont"
}
</milaf_action>

Le content utilise du Markdown simplifié :
- # pour les titres principaux
- ## pour les sous-titres  
- **texte** pour le gras
- --- pour les séparateurs
- \\n pour les sauts de ligne

QUAND TU GÉNÈRES UN TEMPLATE RÉUTILISABLE :
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
</milaf_action>

IMPORTANT : Tu parles toujours en français. Le document est COMPLET et PROFESSIONNEL. Ne fais jamais dans la demi-mesure.`;

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
