/**
 * Module Devis & Facture — Templates universels
 * 3 templates Word Tier 1 : Devis, Facture, Avoir
 */
import type { WordSchema } from "@/lib/engine/word-ingestion";

function f(
  balise: string, label: string, group: string,
  type: "text" | "date" | "number" | "select" = "text",
  options: string[] = [], hint = "", required = true
) {
  return { balise, label, type, group, required, hint, options };
}

// ── DEVIS ─────────────────────────────────────────────────────────────────────
const DEVIS: WordSchema = {
  tier: "tier1_word",
  templateName: "Devis professionnel",
  fieldCount: 0,
  fields: [
    f("entreprise_nom", "Nom de l'entreprise", "entreprise", "text", [], "Ex: Dupont SARL"),
    f("entreprise_adresse", "Adresse", "entreprise"),
    f("entreprise_siret", "SIRET", "entreprise", "text", [], "14 chiffres"),
    f("entreprise_tel", "Téléphone", "entreprise"),
    f("entreprise_email", "Email", "entreprise"),
    f("client_nom", "Nom du client", "client"),
    f("client_adresse", "Adresse du client", "client"),
    f("client_tel", "Téléphone", "client", "text", [], "", false),
    f("client_email", "Email", "client", "text", [], "", false),
    f("devis_numero", "N° de devis", "devis", "text", [], "Ex: DEV-2026-001"),
    f("devis_date", "Date du devis", "devis", "date"),
    f("devis_validite", "Validité (jours)", "devis", "number", [], "30"),
    f("devis_objet", "Objet / Description des travaux", "devis"),
    f("ligne1_desc", "Ligne 1 — Description", "lignes"),
    f("ligne1_qte", "Quantité", "lignes", "number"),
    f("ligne1_pu_ht", "Prix unitaire HT", "lignes", "number"),
    f("ligne1_total_ht", "Total HT ligne 1", "lignes", "number"),
    f("ligne2_desc", "Ligne 2 — Description", "lignes", "text", [], "", false),
    f("ligne2_qte", "Quantité", "lignes", "number", [], "", false),
    f("ligne2_pu_ht", "Prix unitaire HT", "lignes", "number", [], "", false),
    f("ligne2_total_ht", "Total HT ligne 2", "lignes", "number", [], "", false),
    f("total_ht", "Total HT", "totaux", "number"),
    f("taux_tva", "Taux TVA (%)", "totaux", "select", ["5.5", "10", "20"]),
    f("montant_tva", "Montant TVA", "totaux", "number"),
    f("total_ttc", "Total TTC", "totaux", "number"),
    f("conditions_paiement", "Conditions de paiement", "conditions", "text", [], "Ex: 30 jours fin de mois"),
  ],
  groups: ["entreprise", "client", "devis", "lignes", "totaux", "conditions"],
  rawBalises: [], warnings: [],
};
DEVIS.fieldCount = DEVIS.fields.length;

// ── FACTURE ───────────────────────────────────────────────────────────────────
const FACTURE: WordSchema = {
  tier: "tier1_word",
  templateName: "Facture",
  fieldCount: 0,
  fields: [
    f("entreprise_nom", "Nom de l'entreprise", "entreprise"),
    f("entreprise_adresse", "Adresse", "entreprise"),
    f("entreprise_siret", "SIRET", "entreprise"),
    f("entreprise_tva_intra", "N° TVA intracommunautaire", "entreprise", "text", [], "", false),
    f("client_nom", "Nom du client", "client"),
    f("client_adresse", "Adresse du client", "client"),
    f("facture_numero", "N° de facture", "facture", "text", [], "Ex: FA-2026-001"),
    f("facture_date", "Date de facture", "facture", "date"),
    f("facture_echeance", "Date d'échéance", "facture", "date"),
    f("facture_objet", "Objet", "facture"),
    f("ligne1_desc", "Ligne 1 — Description", "lignes"),
    f("ligne1_qte", "Quantité", "lignes", "number"),
    f("ligne1_pu_ht", "Prix unitaire HT", "lignes", "number"),
    f("ligne1_total_ht", "Total HT", "lignes", "number"),
    f("ligne2_desc", "Ligne 2 — Description", "lignes", "text", [], "", false),
    f("ligne2_qte", "Quantité", "lignes", "number", [], "", false),
    f("ligne2_pu_ht", "Prix unitaire HT", "lignes", "number", [], "", false),
    f("ligne2_total_ht", "Total HT", "lignes", "number", [], "", false),
    f("total_ht", "Total HT", "totaux", "number"),
    f("taux_tva", "Taux TVA (%)", "totaux", "select", ["5.5", "10", "20"]),
    f("montant_tva", "Montant TVA", "totaux", "number"),
    f("total_ttc", "Total TTC", "totaux", "number"),
    f("mode_paiement", "Mode de paiement", "paiement", "select", ["Virement", "Chèque", "CB", "Espèces"]),
    f("iban", "IBAN", "paiement", "text", [], "", false),
  ],
  groups: ["entreprise", "client", "facture", "lignes", "totaux", "paiement"],
  rawBalises: [], warnings: [],
};
FACTURE.fieldCount = FACTURE.fields.length;

// ── AVOIR ─────────────────────────────────────────────────────────────────────
const AVOIR: WordSchema = {
  tier: "tier1_word",
  templateName: "Avoir / Note de crédit",
  fieldCount: 0,
  fields: [
    f("entreprise_nom", "Nom de l'entreprise", "entreprise"),
    f("entreprise_adresse", "Adresse", "entreprise"),
    f("entreprise_siret", "SIRET", "entreprise"),
    f("client_nom", "Nom du client", "client"),
    f("client_adresse", "Adresse", "client"),
    f("avoir_numero", "N° d'avoir", "avoir", "text", [], "Ex: AV-2026-001"),
    f("avoir_date", "Date", "avoir", "date"),
    f("facture_ref", "Facture de référence", "avoir"),
    f("motif", "Motif de l'avoir", "avoir"),
    f("montant_ht", "Montant HT", "avoir", "number"),
    f("taux_tva", "Taux TVA (%)", "avoir", "select", ["5.5", "10", "20"]),
    f("montant_tva", "Montant TVA", "avoir", "number"),
    f("montant_ttc", "Montant TTC", "avoir", "number"),
  ],
  groups: ["entreprise", "client", "avoir"],
  rawBalises: [], warnings: [],
};
AVOIR.fieldCount = AVOIR.fields.length;

export const DEVIS_FACTURE_MODULE = {
  id: "devis-facture",
  templates: [
    { id: "devis", name: "Devis professionnel", emoji: "📝", schema: DEVIS },
    { id: "facture", name: "Facture", emoji: "📄", schema: FACTURE },
    { id: "avoir", name: "Avoir / Note de crédit", emoji: "↩️", schema: AVOIR },
  ],
};
