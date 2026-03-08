/**
 * Module Juridique — Documents courants
 * 3 templates Word Tier 1
 */
import type { WordSchema } from "@/lib/engine/word-ingestion";

function f(
  balise: string, label: string, group: string,
  type: "text" | "date" | "number" | "select" = "text",
  options: string[] = [], hint = "", required = true
) {
  return { balise, label, type, group, required, hint, options };
}

// ── MISE EN DEMEURE ───────────────────────────────────────────────────────────
const MISE_EN_DEMEURE: WordSchema = {
  tier: "tier1_word",
  templateName: "Mise en demeure",
  fieldCount: 0,
  fields: [
    f("expediteur_nom", "Nom de l'expéditeur", "expéditeur"),
    f("expediteur_adresse", "Adresse", "expéditeur"),
    f("destinataire_nom", "Nom du destinataire", "destinataire"),
    f("destinataire_adresse", "Adresse", "destinataire"),
    f("date_courrier", "Date du courrier", "courrier", "date"),
    f("lieu", "Fait à", "courrier"),
    f("objet", "Objet de la mise en demeure", "contenu"),
    f("montant_du", "Montant dû (€)", "contenu", "number"),
    f("date_echeance", "Date d'échéance initiale", "contenu", "date"),
    f("delai_jours", "Délai accordé (jours)", "contenu", "number", [], "8"),
    f("reference_contrat", "Référence du contrat / facture", "contenu"),
    f("description_faits", "Description des faits", "contenu"),
  ],
  groups: ["expéditeur", "destinataire", "courrier", "contenu"],
  rawBalises: [], warnings: [],
};
MISE_EN_DEMEURE.fieldCount = MISE_EN_DEMEURE.fields.length;

// ── PROCURATION ───────────────────────────────────────────────────────────────
const PROCURATION: WordSchema = {
  tier: "tier1_word",
  templateName: "Procuration",
  fieldCount: 0,
  fields: [
    f("mandant_nom", "Nom du mandant", "mandant"),
    f("mandant_date_naissance", "Date de naissance", "mandant", "date"),
    f("mandant_lieu_naissance", "Lieu de naissance", "mandant"),
    f("mandant_adresse", "Adresse", "mandant"),
    f("mandant_piece_identite", "Pièce d'identité (type + n°)", "mandant"),
    f("mandataire_nom", "Nom du mandataire", "mandataire"),
    f("mandataire_date_naissance", "Date de naissance", "mandataire", "date"),
    f("mandataire_adresse", "Adresse", "mandataire"),
    f("mandataire_piece_identite", "Pièce d'identité (type + n°)", "mandataire"),
    f("objet_procuration", "Objet de la procuration", "procuration"),
    f("duree", "Durée de validité", "procuration", "text", [], "Ex: 6 mois"),
    f("date_signature", "Date de signature", "procuration", "date"),
    f("lieu_signature", "Lieu", "procuration"),
  ],
  groups: ["mandant", "mandataire", "procuration"],
  rawBalises: [], warnings: [],
};
PROCURATION.fieldCount = PROCURATION.fields.length;

// ── COURRIER RECOMMANDÉ ───────────────────────────────────────────────────────
const COURRIER: WordSchema = {
  tier: "tier1_word",
  templateName: "Courrier officiel / Recommandé",
  fieldCount: 0,
  fields: [
    f("expediteur_nom", "Nom de l'expéditeur", "expéditeur"),
    f("expediteur_adresse", "Adresse", "expéditeur"),
    f("expediteur_tel", "Téléphone", "expéditeur", "text", [], "", false),
    f("destinataire_nom", "Nom du destinataire", "destinataire"),
    f("destinataire_adresse", "Adresse", "destinataire"),
    f("date_courrier", "Date", "courrier", "date"),
    f("lieu", "Fait à", "courrier"),
    f("objet", "Objet", "courrier"),
    f("reference", "Référence / N° dossier", "courrier", "text", [], "", false),
    f("corps", "Corps du courrier", "courrier"),
    f("formule_politesse", "Formule de politesse", "courrier", "text", [], "Veuillez agréer..."),
  ],
  groups: ["expéditeur", "destinataire", "courrier"],
  rawBalises: [], warnings: [],
};
COURRIER.fieldCount = COURRIER.fields.length;

export const JURIDIQUE_MODULE = {
  id: "juridique",
  templates: [
    { id: "mise-en-demeure", name: "Mise en demeure", emoji: "⚠️", schema: MISE_EN_DEMEURE },
    { id: "procuration", name: "Procuration", emoji: "🤝", schema: PROCURATION },
    { id: "courrier", name: "Courrier officiel / Recommandé", emoji: "✉️", schema: COURRIER },
  ],
};
