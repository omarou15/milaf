import { CEE_MODULE } from "./cee-france";
import { DEVIS_FACTURE_MODULE } from "./devis-facture";
import { IMMOBILIER_MODULE } from "./immobilier";
import { RH_MODULE } from "./rh";
import { JURIDIQUE_MODULE } from "./juridique";

export interface MarketplaceModule {
  id: string;
  name: string;
  emoji: string;
  country: string;
  category: string;
  description: string;
  tier: string;
  tierColor: string;
  docs: number;
  installs: number;
  rating: number;
  author: string;
  official: boolean;
  price: number;
  tags: string[];
  templates: Array<{ id: string; name: string; emoji: string }>;
  hasTemplates: boolean;
}

export const MODULES_REGISTRY: MarketplaceModule[] = [
  {
    id: "devis-facture", name: "Devis & Facture B2B", emoji: "💼", country: "🌍", category: "Finance",
    description: "Devis professionnel, facture, avoir / note de crédit — prêts à remplir et envoyer",
    tier: "Tier 1", tierColor: "#3B5BDB", docs: 3, installs: 3200, rating: 4.9,
    author: "Mi-Laf Officiel", official: true, price: 0,
    tags: ["Facturation", "Devis", "Avoir", "Universel"],
    templates: DEVIS_FACTURE_MODULE.templates.map(t => ({ id: t.id, name: t.name, emoji: t.emoji })),
    hasTemplates: true,
  },
  {
    id: "cee-france", name: "CEE France", emoji: "⚡", country: "🇫🇷", category: "Énergie",
    description: "Dossier complet CEE : Devis, Facture, Attestation sur l'honneur, FOS — conforme ADEME",
    tier: "Tier 1", tierColor: "#3B5BDB", docs: 4, installs: 1240, rating: 4.9,
    author: "Mi-Laf Officiel", official: true, price: 0,
    tags: ["CEE", "ADEME", "Artisan", "RGE"],
    templates: CEE_MODULE.templates.map(t => ({ id: t.id, name: t.name, emoji: t.emoji })),
    hasTemplates: true,
  },
  {
    id: "etat-des-lieux", name: "Immobilier — Bail & EDL", emoji: "🔑", country: "🇫🇷", category: "Immobilier",
    description: "Contrat de bail résidentiel, état des lieux entrée/sortie, quittance de loyer",
    tier: "Tier 1", tierColor: "#3B5BDB", docs: 3, installs: 2100, rating: 4.7,
    author: "Mi-Laf Officiel", official: true, price: 0,
    tags: ["Bail", "Location", "EDL", "Quittance"],
    templates: IMMOBILIER_MODULE.templates.map(t => ({ id: t.id, name: t.name, emoji: t.emoji })),
    hasTemplates: true,
  },
  {
    id: "contrat-travail", name: "RH — Contrats & Paie", emoji: "👔", country: "🇫🇷", category: "RH",
    description: "Contrat CDI, attestation de travail, bulletin de paie simplifié",
    tier: "Tier 1", tierColor: "#3B5BDB", docs: 3, installs: 780, rating: 4.5,
    author: "Mi-Laf Officiel", official: true, price: 0,
    tags: ["CDI", "Attestation", "Paie", "RH"],
    templates: RH_MODULE.templates.map(t => ({ id: t.id, name: t.name, emoji: t.emoji })),
    hasTemplates: true,
  },
  {
    id: "juridique", name: "Juridique courant", emoji: "⚖️", country: "🇫🇷", category: "Juridique",
    description: "Mise en demeure, procuration, courrier recommandé — documents juridiques du quotidien",
    tier: "Tier 1", tierColor: "#3B5BDB", docs: 3, installs: 950, rating: 4.6,
    author: "Mi-Laf Officiel", official: true, price: 0,
    tags: ["Mise en demeure", "Procuration", "Courrier"],
    templates: JURIDIQUE_MODULE.templates.map(t => ({ id: t.id, name: t.name, emoji: t.emoji })),
    hasTemplates: true,
  },
  {
    id: "maprimerénov", name: "MaPrimeRénov'", emoji: "🏠", country: "🇫🇷", category: "Énergie",
    description: "Dossier MPR : demande, devis réglementaire, justificatifs — conforme ANAH",
    tier: "Tier 2", tierColor: "#F59E0B", docs: 5, installs: 890, rating: 4.8,
    author: "Mi-Laf Officiel", official: true, price: 0,
    tags: ["ANAH", "Rénovation", "Subvention"],
    templates: [], hasTemplates: false,
  },
  {
    id: "audit-energetique", name: "Audit Énergétique", emoji: "🌿", country: "🇲🇦🇩🇿🇹🇳", category: "Énergie",
    description: "Audit bâtiment tertiaire & industriel. Méthode sur facture, rapport GIZ",
    tier: "Tier 3", tierColor: "#10B981", docs: 8, installs: 230, rating: 4.8,
    author: "Tetra", official: false, price: 29,
    tags: ["MENA", "GIZ", "Tertiaire"],
    templates: [], hasTemplates: false,
  },
  {
    id: "statuts-sas", name: "Statuts SAS / SARL", emoji: "🏢", country: "🇫🇷", category: "Juridique",
    description: "Statuts constitutifs, PV d'AG, rapport de gestion — pack création d'entreprise",
    tier: "Tier 2", tierColor: "#F59E0B", docs: 7, installs: 310, rating: 4.6,
    author: "JuriDocs", official: false, price: 19,
    tags: ["Création", "SAS", "SARL"],
    templates: [], hasTemplates: false,
  },
];

export function getModuleTemplates(moduleId: string) {
  const map: Record<string, { templates: any[] }> = {
    "cee-france": CEE_MODULE,
    "devis-facture": DEVIS_FACTURE_MODULE,
    "etat-des-lieux": IMMOBILIER_MODULE,
    "bail-habitation": IMMOBILIER_MODULE,
    "contrat-travail": RH_MODULE,
    "juridique": JURIDIQUE_MODULE,
  };
  return map[moduleId]?.templates ?? [];
}
