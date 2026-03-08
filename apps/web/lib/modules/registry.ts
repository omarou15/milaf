import { CEE_MODULE } from "./cee-france";

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
}

export const MODULES_REGISTRY: MarketplaceModule[] = [
  {
    id: "cee-france",
    name: "CEE France",
    emoji: "⚡",
    country: "🇫🇷",
    category: "Énergie",
    description: "Dossier complet CEE : Devis, Facture, Attestation sur l'honneur, Fiche Opération Standardisée — conforme ADEME",
    tier: "Tier 1",
    tierColor: "#3B5BDB",
    docs: 4,
    installs: 1240,
    rating: 4.9,
    author: "Mi-Laf Officiel",
    official: true,
    price: 0,
    tags: ["CEE", "ADEME", "Artisan", "RGE"],
    templates: CEE_MODULE.templates.map(t => ({ id: t.id, name: t.name, emoji: t.emoji })),
  },
  {
    id: "maprimerénov",
    name: "MaPrimeRénov",
    emoji: "🏠",
    country: "🇫🇷",
    category: "Énergie",
    description: "Dossier MPR complet : demande, devis réglementaire, justificatifs, facture conforme ANAH",
    tier: "Tier 2",
    tierColor: "#F59E0B",
    docs: 5,
    installs: 890,
    rating: 4.8,
    author: "Mi-Laf Officiel",
    official: true,
    price: 0,
    tags: ["ANAH", "Rénovation", "Subvention"],
    templates: [],
  },
  {
    id: "etat-des-lieux",
    name: "État des lieux",
    emoji: "🔑",
    country: "🇫🇷🇲🇦",
    category: "Immobilier",
    description: "Entrée, sortie, inventaire contradictoire. Conforme loi ALUR. Version bilingue FR/AR disponible",
    tier: "Tier 1",
    tierColor: "#3B5BDB",
    docs: 3,
    installs: 2100,
    rating: 4.7,
    author: "Mi-Laf Officiel",
    official: true,
    price: 0,
    tags: ["Locatif", "ALUR", "Bilingue"],
    templates: [],
  },
  {
    id: "bail-habitation",
    name: "Bail d'habitation",
    emoji: "📋",
    country: "🇫🇷",
    category: "Immobilier",
    description: "Contrat de bail résidentiel, avenant, notice d'information, règlement intérieur",
    tier: "Tier 1",
    tierColor: "#3B5BDB",
    docs: 4,
    installs: 1560,
    rating: 4.6,
    author: "Mi-Laf Officiel",
    official: true,
    price: 0,
    tags: ["Location", "Contrat", "ALUR"],
    templates: [],
  },
  {
    id: "contrat-travail",
    name: "Contrat de travail",
    emoji: "👔",
    country: "🇫🇷🇲🇦🇩🇿",
    category: "RH",
    description: "CDI, CDD, Avenant, Rupture conventionnelle — modèles conformes Code du Travail",
    tier: "Tier 1",
    tierColor: "#3B5BDB",
    docs: 5,
    installs: 780,
    rating: 4.5,
    author: "LexDocs Pro",
    official: false,
    price: 9.9,
    tags: ["CDI", "CDD", "RH"],
    templates: [],
  },
  {
    id: "devis-facture",
    name: "Devis & Facture B2B",
    emoji: "💼",
    country: "🌍",
    category: "Finance",
    description: "Devis professionnel, facture, avoir, bon de commande — multidevise, multilangue",
    tier: "Tier 1",
    tierColor: "#3B5BDB",
    docs: 4,
    installs: 3200,
    rating: 4.9,
    author: "Mi-Laf Officiel",
    official: true,
    price: 0,
    tags: ["International", "Facturation", "Multi-devise"],
    templates: [],
  },
  {
    id: "audit-energetique",
    name: "Audit Énergétique",
    emoji: "🌿",
    country: "🇲🇦🇩🇿🇹🇳",
    category: "Énergie",
    description: "Audit bâtiment tertiaire & industriel. Méthode sur facture, inventaire, rapport GIZ",
    tier: "Tier 3",
    tierColor: "#10B981",
    docs: 8,
    installs: 230,
    rating: 4.8,
    author: "Tetra",
    official: false,
    price: 29,
    tags: ["MENA", "GIZ", "Tertiaire"],
    templates: [],
  },
  {
    id: "statuts-sas",
    name: "Statuts SAS / SARL",
    emoji: "⚖️",
    country: "🇫🇷",
    category: "Juridique",
    description: "Statuts constitutifs, PV d'AG, rapport de gestion — pack création d'entreprise",
    tier: "Tier 2",
    tierColor: "#F59E0B",
    docs: 7,
    installs: 310,
    rating: 4.6,
    author: "JuriDocs",
    official: false,
    price: 19,
    tags: ["Création", "SAS", "SARL"],
    templates: [],
  },
];

// Map module id → installer function
export type ModuleInstaller = (moduleId: string) => Array<{ id: string; schema: unknown; templateB64: string; createdAt: string }>;

export function getModuleTemplates(moduleId: string) {
  if (moduleId === "cee-france") return CEE_MODULE.templates;
  return [];
}
