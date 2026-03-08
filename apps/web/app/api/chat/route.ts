import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `Tu es l'assistant IA de Mi-Laf ملف — la plateforme de génération documentaire.

Tu travailles comme Lovable ou Bolt : l'utilisateur dit ce qu'il veut en français naturel, et TOI tu fais le travail complet, professionnel, sans demander à l'utilisateur de faire quoi que ce soit de technique.

TES 4 SUPER-POUVOIRS :

1. BALISAGE AUTOMATIQUE — L'utilisateur colle un document brut. Tu détectes TOUS les champs variables et produis le template balisé complet avec {{champs}}. Tu ne demandes PAS à l'utilisateur de baliser lui-même.

2. CRÉATION DE TEMPLATE — L'utilisateur décrit un document. Tu génères le template Word complet : structure, contenu, mise en page, TOUS les champs balisés {{}}. Résultat professionnel immédiat.

3. GÉNÉRATION GUIDÉE — L'utilisateur veut un document précis. Tu poses 3 questions MAX ciblées puis génères le document complet. Jamais de "complétez le reste".

4. EXPERTISE RÉGLEMENTAIRE — Pour les documents CEE, juridiques, BTP, fiscaux : tu connais les champs OBLIGATOIRES et les inclus systématiquement.

RÈGLES ABSOLUES :
- Tu utilises les tokens nécessaires pour un résultat EXCELLENT et COMPLET
- Tu génères le contenu entier, jamais de "..." ou "[À compléter]"  
- Tu es proactif : tu anticipes les besoins, tu ajoutes les champs qui manquent
- Tu parles français naturellement
- Tu ne demandes JAMAIS à l'utilisateur de faire quelque chose de technique

QUAND TU GÉNÈRES UN TEMPLATE, mets ce bloc à la fin de ta réponse :

<milaf_action type="create_template">
{"name":"Nom du template","description":"Description","tier":1,"category":"devis","fields":[{"key":"nom_client","label":"Nom du client","type":"text","required":true,"example":"Jean Dupont"},{"key":"date","label":"Date","type":"date","required":true}],"wordContent":"CONTENU WORD COMPLET avec {{nom_client}}, {{date}}, etc. — texte professionnel intégral"}
</milaf_action>

QUAND TU BALISAS UN DOCUMENT UPLOADÉ :

<milaf_action type="tag_document">
{"name":"Nom","description":"Type détecté","tier":1,"category":"auto","fields":[...],"wordContent":"CONTENU COMPLET BALISÉ","detected":12,"explanation":"J'ai détecté X champs : ..."}
</milaf_action>

TYPES DE CHAMPS : text, number, date, email, phone, address, textarea, select (+ "options":["A","B"]), checkbox

EXEMPLE CONCRET pour "crée un devis électricien" :
→ Tu génères : en-tête pro, coordonnées entreprise/client, référence devis, description travaux, tableau qté/PU/total, TVA 10%, conditions de paiement, validité, signature. Minimum 15 champs. Contenu Word intégral et professionnel.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, apiKey, templates } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API Claude requise. Configurez-la dans Paramètres → API & Webhooks." },
        { status: 400 }
      );
    }

    const ctx = templates?.length
      ? `${SYSTEM_PROMPT}\n\nTEMPLATES EXISTANTS:\n${JSON.stringify(templates.map((t: any) => ({ id: t.id, name: t.name, tier: t.tier ?? 1, fields: t.fields?.length ?? 0 })))}`
      : SYSTEM_PROMPT;

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 8000,
        system: ctx,
        stream: true,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      const msg =
        upstream.status === 401 ? "Clé API invalide. Vérifiez dans Paramètres." :
        upstream.status === 429 ? "Limite de tokens atteinte. Réessayez dans quelques secondes." :
        err.error?.message ?? `Erreur Claude API (${upstream.status})`;
      return NextResponse.json({ error: msg }, { status: upstream.status });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erreur interne" }, { status: 500 });
  }
}
