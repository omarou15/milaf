/**
 * Module Immobilier — Bail & État des lieux
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

// ── BAIL HABITATION ───────────────────────────────────────────────────────────
const BAIL: WordSchema = {
  tier: "tier1_word",
  templateName: "Contrat de bail résidentiel",
  fieldCount: 0,
  fields: [
    f("bailleur_nom", "Nom du bailleur", "bailleur"),
    f("bailleur_adresse", "Adresse du bailleur", "bailleur"),
    f("bailleur_tel", "Téléphone", "bailleur"),
    f("locataire_nom", "Nom du locataire", "locataire"),
    f("locataire_date_naissance", "Date de naissance", "locataire", "date"),
    f("locataire_lieu_naissance", "Lieu de naissance", "locataire"),
    f("bien_adresse", "Adresse du bien loué", "bien"),
    f("bien_type", "Type de logement", "bien", "select", ["Appartement", "Maison", "Studio", "Chambre"]),
    f("bien_surface", "Surface habitable (m²)", "bien", "number"),
    f("bien_nb_pieces", "Nombre de pièces", "bien", "number"),
    f("bien_etage", "Étage", "bien", "text", [], "", false),
    f("bien_parking", "Place de parking", "bien", "select", ["Oui", "Non"]),
    f("bien_cave", "Cave", "bien", "select", ["Oui", "Non"]),
    f("loyer_montant", "Loyer mensuel hors charges (€)", "loyer", "number"),
    f("loyer_charges", "Charges mensuelles (€)", "loyer", "number"),
    f("loyer_total", "Total mensuel (€)", "loyer", "number"),
    f("loyer_depot_garantie", "Dépôt de garantie (€)", "loyer", "number"),
    f("bail_date_debut", "Date de début du bail", "bail", "date"),
    f("bail_duree", "Durée du bail", "bail", "select", ["1 an", "3 ans", "6 ans"]),
    f("bail_date_signature", "Date de signature", "bail", "date"),
  ],
  groups: ["bailleur", "locataire", "bien", "loyer", "bail"],
  rawBalises: [], warnings: [],
};
BAIL.fieldCount = BAIL.fields.length;

// ── ÉTAT DES LIEUX ────────────────────────────────────────────────────────────
const ETAT_DES_LIEUX: WordSchema = {
  tier: "tier1_word",
  templateName: "État des lieux",
  fieldCount: 0,
  fields: [
    f("type_edl", "Type", "général", "select", ["Entrée", "Sortie"]),
    f("date_edl", "Date de l'état des lieux", "général", "date"),
    f("adresse_bien", "Adresse du bien", "général"),
    f("bailleur_nom", "Nom du bailleur / mandataire", "parties"),
    f("locataire_nom", "Nom du locataire", "parties"),
    f("entree_etat", "État entrée (hall / porte)", "pièces", "select", ["Bon", "Correct", "Usé", "Mauvais"]),
    f("salon_sols", "Salon — sols", "pièces", "select", ["Bon", "Correct", "Usé", "Mauvais"]),
    f("salon_murs", "Salon — murs", "pièces", "select", ["Bon", "Correct", "Usé", "Mauvais"]),
    f("salon_plafond", "Salon — plafond", "pièces", "select", ["Bon", "Correct", "Usé", "Mauvais"]),
    f("cuisine_etat", "Cuisine — état général", "pièces", "select", ["Bon", "Correct", "Usé", "Mauvais"]),
    f("cuisine_equipements", "Cuisine — équipements", "pièces"),
    f("chambre1_etat", "Chambre 1 — état", "pièces", "select", ["Bon", "Correct", "Usé", "Mauvais"]),
    f("sdb_etat", "Salle de bain — état", "pièces", "select", ["Bon", "Correct", "Usé", "Mauvais"]),
    f("sdb_equipements", "Salle de bain — équipements", "pièces"),
    f("wc_etat", "WC — état", "pièces", "select", ["Bon", "Correct", "Usé", "Mauvais"]),
    f("compteur_eau", "Compteur eau (relevé)", "compteurs"),
    f("compteur_elec", "Compteur électricité (relevé)", "compteurs"),
    f("compteur_gaz", "Compteur gaz (relevé)", "compteurs", "text", [], "", false),
    f("nb_cles", "Nombre de clés remises", "clés", "number"),
    f("nb_badges", "Nombre de badges / bips", "clés", "number", [], "", false),
    f("observations", "Observations générales", "observations", "text", [], "", false),
  ],
  groups: ["général", "parties", "pièces", "compteurs", "clés", "observations"],
  rawBalises: [], warnings: [],
};
ETAT_DES_LIEUX.fieldCount = ETAT_DES_LIEUX.fields.length;

// ── QUITTANCE DE LOYER ────────────────────────────────────────────────────────
const QUITTANCE: WordSchema = {
  tier: "tier1_word",
  templateName: "Quittance de loyer",
  fieldCount: 0,
  fields: [
    f("bailleur_nom", "Nom du bailleur", "bailleur"),
    f("bailleur_adresse", "Adresse du bailleur", "bailleur"),
    f("locataire_nom", "Nom du locataire", "locataire"),
    f("bien_adresse", "Adresse du bien loué", "bien"),
    f("mois_concerne", "Mois concerné", "quittance", "text", [], "Ex: Mars 2026"),
    f("montant_loyer", "Montant du loyer (€)", "quittance", "number"),
    f("montant_charges", "Montant des charges (€)", "quittance", "number"),
    f("montant_total", "Total payé (€)", "quittance", "number"),
    f("date_paiement", "Date de paiement", "quittance", "date"),
    f("date_quittance", "Date de la quittance", "quittance", "date"),
  ],
  groups: ["bailleur", "locataire", "bien", "quittance"],
  rawBalises: [], warnings: [],
};
QUITTANCE.fieldCount = QUITTANCE.fields.length;

export const IMMOBILIER_MODULE = {
  id: "immobilier",
  templates: [
    { id: "bail", name: "Contrat de bail résidentiel", emoji: "📋", schema: BAIL },
    { id: "edl", name: "État des lieux", emoji: "🔑", schema: ETAT_DES_LIEUX },
    { id: "quittance", name: "Quittance de loyer", emoji: "🧾", schema: QUITTANCE },
  ],
};
