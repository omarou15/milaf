/**
 * Module CEE France — Certificats d'Économies d'Énergie
 * 4 templates Word Tier 1 : Devis, Attestation, Facture, FOS
 */
import type { WordSchema } from "@/lib/engine/word-ingestion";

function field(
  balise: string, label: string, group: string,
  type: "text" | "date" | "number" | "select" = "text",
  options: string[] = [], hint = "", required = true
) {
  return { balise, label, type, group, required, hint, options };
}

// ── Devis CEE ─────────────────────────────────────────────────────────────────
const DEVIS_CEE: WordSchema = {
  tier: "tier1_word",
  templateName: "Devis CEE — Travaux d'isolation",
  fieldCount: 0,
  fields: [
    field("artisan_raison_sociale", "Raison sociale de l'artisan", "artisan", "text", [], "Ex: ISOL PRO SARL"),
    field("artisan_siret", "SIRET de l'artisan", "artisan", "text", [], "14 chiffres"),
    field("artisan_adresse", "Adresse de l'artisan", "artisan"),
    field("artisan_tel", "Téléphone", "artisan"),
    field("artisan_email", "Email", "artisan"),
    field("artisan_rge", "Numéro de certification RGE", "artisan", "text", [], "Ex: E-E190105"),
    field("beneficiaire_nom", "Nom du bénéficiaire", "bénéficiaire"),
    field("beneficiaire_prenom", "Prénom", "bénéficiaire"),
    field("beneficiaire_adresse_travaux", "Adresse des travaux", "bénéficiaire"),
    field("beneficiaire_code_postal", "Code postal", "bénéficiaire"),
    field("beneficiaire_ville", "Ville", "bénéficiaire"),
    field("beneficiaire_tel", "Téléphone", "bénéficiaire"),
    field("beneficiaire_menage", "Catégorie de ménage", "bénéficiaire", "select", ["Très modeste", "Modeste", "Intermédiaire", "Supérieur"]),
    field("logement_type", "Type de logement", "logement", "select", ["Maison individuelle", "Appartement", "Immeuble collectif"]),
    field("logement_annee_construction", "Année de construction", "logement", "text", [], "Ex: 1975"),
    field("logement_surface", "Surface habitable (m²)", "logement", "number"),
    field("logement_departement", "Département", "logement"),
    field("travaux_type", "Type de travaux CEE", "travaux", "select", [
      "Isolation combles perdus", "Isolation rampants", "Isolation plancher bas",
      "Isolation murs extérieur", "Isolation murs intérieur",
      "Pompe à chaleur air/eau", "Pompe à chaleur air/air",
      "Chaudière à granulés", "Poêle à bois",
    ]),
    field("travaux_surface", "Surface traitée (m²)", "travaux", "number"),
    field("travaux_resistance", "Résistance thermique R (m².K/W)", "travaux", "number", [], "Ex: 7.5"),
    field("travaux_marque_produit", "Marque et référence du produit", "travaux"),
    field("travaux_epaisseur", "Épaisseur (mm)", "travaux", "number"),
    field("devis_numero", "Numéro de devis", "devis", "text", [], "Ex: DEV-2024-001"),
    field("devis_date", "Date du devis", "devis", "date"),
    field("devis_validite", "Validité (jours)", "devis", "number", [], "Ex: 30"),
    field("devis_ht", "Montant HT (€)", "devis", "number"),
    field("devis_tva", "Taux TVA (%)", "devis", "select", ["5.5", "10", "20"]),
    field("devis_ttc", "Montant TTC (€)", "devis", "number"),
    field("devis_prime_cee", "Prime CEE déduite (€)", "devis", "number"),
    field("devis_reste_a_charge", "Reste à charge (€)", "devis", "number"),
    field("devis_mode_paiement", "Mode de paiement", "devis", "select", ["Virement", "Chèque", "Financement"]),
  ],
  groups: ["artisan", "bénéficiaire", "logement", "travaux", "devis"],
  rawBalises: [],
};
DEVIS_CEE.fieldCount = DEVIS_CEE.fields.length;
DEVIS_CEE.rawBalises = DEVIS_CEE.fields.map(f => f.balise);

// ── Attestation sur l'Honneur ─────────────────────────────────────────────────
const ATTESTATION_CEE: WordSchema = {
  tier: "tier1_word",
  templateName: "Attestation sur l'Honneur CEE",
  fieldCount: 0,
  fields: [
    field("beneficiaire_nom_prenom", "Nom et prénom du bénéficiaire", "bénéficiaire"),
    field("beneficiaire_adresse_complete", "Adresse complète", "bénéficiaire"),
    field("beneficiaire_code_postal", "Code postal", "bénéficiaire"),
    field("beneficiaire_ville", "Ville", "bénéficiaire"),
    field("beneficiaire_date_naissance", "Date de naissance", "bénéficiaire", "date"),
    field("beneficiaire_revenu_fiscal", "Revenu fiscal de référence (€)", "bénéficiaire", "number"),
    field("beneficiaire_nb_personnes", "Nombre de personnes au foyer", "bénéficiaire", "number"),
    field("logement_type", "Type de logement", "logement", "select", ["Maison individuelle", "Appartement"]),
    field("logement_occupation", "Statut d'occupation", "logement", "select", ["Propriétaire occupant", "Locataire", "Propriétaire bailleur"]),
    field("logement_annee_construction", "Année de construction", "logement", "text", [], "Doit être > 2 ans"),
    field("travaux_nature", "Nature des travaux", "travaux"),
    field("travaux_artisan", "Nom de l'artisan réalisateur", "travaux"),
    field("artisan_siret", "SIRET de l'artisan", "travaux"),
    field("ah_date_signature", "Date de signature", "attestation", "date"),
    field("ah_lieu_signature", "Lieu de signature", "attestation"),
  ],
  groups: ["bénéficiaire", "logement", "travaux", "attestation"],
  rawBalises: [],
};
ATTESTATION_CEE.fieldCount = ATTESTATION_CEE.fields.length;
ATTESTATION_CEE.rawBalises = ATTESTATION_CEE.fields.map(f => f.balise);

// ── Facture CEE ───────────────────────────────────────────────────────────────
const FACTURE_CEE: WordSchema = {
  tier: "tier1_word",
  templateName: "Facture CEE — Travaux réalisés",
  fieldCount: 0,
  fields: [
    field("artisan_raison_sociale", "Raison sociale", "artisan"),
    field("artisan_siret", "SIRET", "artisan"),
    field("artisan_adresse", "Adresse", "artisan"),
    field("artisan_tel", "Téléphone", "artisan"),
    field("artisan_rge", "Certification RGE", "artisan"),
    field("facture_numero", "Numéro de facture", "facture", "text", [], "Ex: FAC-2024-001"),
    field("facture_date", "Date de facturation", "facture", "date"),
    field("devis_reference", "Référence devis associé", "facture"),
    field("beneficiaire_nom_prenom", "Nom et prénom du client", "client"),
    field("beneficiaire_adresse_travaux", "Adresse des travaux", "client"),
    field("travaux_date_debut", "Date de début des travaux", "travaux", "date"),
    field("travaux_date_fin", "Date de fin des travaux", "travaux", "date"),
    field("travaux_description", "Description des travaux réalisés", "travaux"),
    field("produit_marque", "Marque du produit posé", "produit"),
    field("produit_reference", "Référence / modèle", "produit"),
    field("produit_resistance", "Résistance thermique R (m².K/W)", "produit", "number"),
    field("produit_surface", "Surface posée (m²)", "produit", "number"),
    field("montant_ht", "Montant HT (€)", "montants", "number"),
    field("taux_tva", "Taux TVA (%)", "montants", "select", ["5.5", "10", "20"]),
    field("montant_tva", "Montant TVA (€)", "montants", "number"),
    field("montant_ttc", "Montant TTC (€)", "montants", "number"),
    field("prime_cee_deduite", "Prime CEE déduite (€)", "montants", "number"),
    field("reste_a_charge", "Reste à charge (€)", "montants", "number"),
  ],
  groups: ["artisan", "facture", "client", "travaux", "produit", "montants"],
  rawBalises: [],
};
FACTURE_CEE.fieldCount = FACTURE_CEE.fields.length;
FACTURE_CEE.rawBalises = FACTURE_CEE.fields.map(f => f.balise);

// ── Fiche Opération Standardisée (FOS) ───────────────────────────────────────
const FOS_CEE: WordSchema = {
  tier: "tier1_word",
  templateName: "Fiche Opération Standardisée (FOS) CEE",
  fieldCount: 0,
  fields: [
    field("fos_code", "Code FOS", "fiche", "select", [
      "BAR-EN-101 — Isolation combles perdus",
      "BAR-EN-102 — Isolation plancher bas",
      "BAR-EN-103 — Isolation murs",
      "BAR-TH-106 — Chaudière individuelle HP",
      "BAR-TH-112 — Appareil de chauffage bois",
      "BAR-TH-113 — PAC air/eau",
      "BAR-TH-129 — PAC air/air",
    ]),
    field("fos_volume_cee", "Volume de CEE (kWh cumac)", "fiche", "number"),
    field("artisan_nom", "Nom de l'entreprise réalisatrice", "entreprise"),
    field("artisan_siret", "SIRET", "entreprise"),
    field("artisan_rge_numero", "Numéro RGE", "entreprise"),
    field("artisan_rge_validite", "Validité RGE (date)", "entreprise", "date"),
    field("beneficiaire_nom", "Nom du bénéficiaire", "bénéficiaire"),
    field("beneficiaire_adresse", "Adresse de l'installation", "bénéficiaire"),
    field("beneficiaire_secteur", "Secteur", "bénéficiaire", "select", ["Résidentiel", "Tertiaire", "Industriel", "Agricole"]),
    field("travaux_date_devis", "Date du devis (avant travaux)", "calendrier", "date"),
    field("travaux_date_debut", "Date de début des travaux", "calendrier", "date"),
    field("travaux_date_achevement", "Date d'achèvement", "calendrier", "date"),
    field("controle_visite", "Visite de contrôle réalisée", "contrôle", "select", ["Oui", "Non"]),
    field("depot_dossier_date", "Date de dépôt du dossier", "dépôt", "date"),
    field("obligue_nom", "Nom de l'obligé (fournisseur énergie)", "dépôt"),
  ],
  groups: ["fiche", "entreprise", "bénéficiaire", "calendrier", "contrôle", "dépôt"],
  rawBalises: [],
};
FOS_CEE.fieldCount = FOS_CEE.fields.length;
FOS_CEE.rawBalises = FOS_CEE.fields.map(f => f.balise);

// ── Export ────────────────────────────────────────────────────────────────────
export const CEE_MODULE = {
  id: "cee-france",
  name: "CEE France",
  version: "1.0.0",
  templates: [
    { id: "cee-devis",        name: "Devis CEE",                       emoji: "📋", schema: DEVIS_CEE },
    { id: "cee-attestation",  name: "Attestation sur l'Honneur",       emoji: "✍",  schema: ATTESTATION_CEE },
    { id: "cee-facture",      name: "Facture CEE",                     emoji: "🧾", schema: FACTURE_CEE },
    { id: "cee-fos",          name: "Fiche Opération Standardisée",    emoji: "📊", schema: FOS_CEE },
  ],
};
