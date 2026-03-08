/**
 * Module RH — Contrats de travail & attestations
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

// ── CDI ───────────────────────────────────────────────────────────────────────
const CDI: WordSchema = {
  tier: "tier1_word",
  templateName: "Contrat CDI",
  fieldCount: 0,
  fields: [
    f("employeur_nom", "Raison sociale", "employeur"),
    f("employeur_adresse", "Adresse du siège", "employeur"),
    f("employeur_siret", "SIRET", "employeur"),
    f("employeur_representant", "Représentant légal", "employeur"),
    f("salarie_nom", "Nom du salarié", "salarié"),
    f("salarie_prenom", "Prénom", "salarié"),
    f("salarie_date_naissance", "Date de naissance", "salarié", "date"),
    f("salarie_adresse", "Adresse", "salarié"),
    f("salarie_num_secu", "N° Sécurité sociale", "salarié"),
    f("poste_intitule", "Intitulé du poste", "poste"),
    f("poste_classification", "Classification / Coefficient", "poste", "text", [], "", false),
    f("poste_lieu", "Lieu de travail", "poste"),
    f("contrat_date_debut", "Date de début", "contrat", "date"),
    f("contrat_periode_essai", "Période d'essai", "contrat", "select", ["1 mois", "2 mois", "3 mois", "4 mois"]),
    f("contrat_temps", "Temps de travail", "contrat", "select", ["Temps plein (35h)", "Temps partiel"]),
    f("salaire_brut", "Salaire brut mensuel (€)", "rémunération", "number"),
    f("salaire_avantages", "Avantages en nature", "rémunération", "text", [], "", false),
    f("convention_collective", "Convention collective applicable", "convention"),
    f("date_signature", "Date de signature", "signature", "date"),
  ],
  groups: ["employeur", "salarié", "poste", "contrat", "rémunération", "convention", "signature"],
  rawBalises: [], warnings: [],
};
CDI.fieldCount = CDI.fields.length;

// ── ATTESTATION DE TRAVAIL ────────────────────────────────────────────────────
const ATTESTATION: WordSchema = {
  tier: "tier1_word",
  templateName: "Attestation de travail",
  fieldCount: 0,
  fields: [
    f("employeur_nom", "Raison sociale", "employeur"),
    f("employeur_adresse", "Adresse", "employeur"),
    f("employeur_siret", "SIRET", "employeur"),
    f("employeur_representant", "Nom du signataire", "employeur"),
    f("employeur_fonction", "Fonction du signataire", "employeur"),
    f("salarie_nom", "Nom du salarié", "salarié"),
    f("salarie_prenom", "Prénom", "salarié"),
    f("salarie_poste", "Poste occupé", "salarié"),
    f("salarie_date_embauche", "Date d'embauche", "salarié", "date"),
    f("salarie_type_contrat", "Type de contrat", "salarié", "select", ["CDI", "CDD", "Intérim"]),
    f("date_attestation", "Date de l'attestation", "document", "date"),
    f("lieu", "Fait à", "document"),
  ],
  groups: ["employeur", "salarié", "document"],
  rawBalises: [], warnings: [],
};
ATTESTATION.fieldCount = ATTESTATION.fields.length;

// ── FICHE DE PAIE SIMPLIFIÉE ──────────────────────────────────────────────────
const FICHE_PAIE: WordSchema = {
  tier: "tier1_word",
  templateName: "Bulletin de paie simplifié",
  fieldCount: 0,
  fields: [
    f("employeur_nom", "Raison sociale", "employeur"),
    f("employeur_adresse", "Adresse", "employeur"),
    f("employeur_siret", "SIRET", "employeur"),
    f("salarie_nom", "Nom complet du salarié", "salarié"),
    f("salarie_poste", "Poste", "salarié"),
    f("salarie_num_secu", "N° Sécurité sociale", "salarié"),
    f("periode", "Période", "bulletin", "text", [], "Ex: Mars 2026"),
    f("salaire_base", "Salaire de base (€)", "bulletin", "number"),
    f("heures_travaillees", "Heures travaillées", "bulletin", "number", [], "151.67"),
    f("heures_sup", "Heures supplémentaires", "bulletin", "number", [], "", false),
    f("primes", "Primes (€)", "bulletin", "number", [], "", false),
    f("brut_total", "Salaire brut total (€)", "bulletin", "number"),
    f("cotisations_salariales", "Cotisations salariales (€)", "bulletin", "number"),
    f("net_imposable", "Net imposable (€)", "bulletin", "number"),
    f("net_a_payer", "Net à payer (€)", "bulletin", "number"),
    f("date_paiement", "Date de virement", "paiement", "date"),
    f("mode_paiement", "Mode de paiement", "paiement", "select", ["Virement", "Chèque"]),
  ],
  groups: ["employeur", "salarié", "bulletin", "paiement"],
  rawBalises: [], warnings: [],
};
FICHE_PAIE.fieldCount = FICHE_PAIE.fields.length;

export const RH_MODULE = {
  id: "contrat-travail",
  templates: [
    { id: "cdi", name: "Contrat CDI", emoji: "👔", schema: CDI },
    { id: "attestation", name: "Attestation de travail", emoji: "📜", schema: ATTESTATION },
    { id: "fiche-paie", name: "Bulletin de paie simplifié", emoji: "💰", schema: FICHE_PAIE },
  ],
};
