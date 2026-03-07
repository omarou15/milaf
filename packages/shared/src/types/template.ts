export type Tier = "tier1_word" | "tier2_pdf_form" | "tier3_pixel";
export type FieldType = "text" | "number" | "date" | "boolean" | "select" | "ai_generated";

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  balise: string; // e.g. {{client.nom}}
  sourceHint?: string;
  rules?: Record<string, unknown>;
}

export interface Template {
  id: string;
  name: string;
  tier: Tier;
  category?: string;
  version: number;
  fields: TemplateField[];
  sourceFileUrl?: string;
  createdAt: string;
}
