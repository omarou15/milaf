import { PDFDocument, PDFForm, PDFField, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList } from "pdf-lib";

export type PdfFieldType = "text" | "checkbox" | "radio" | "dropdown" | "list" | "unknown";

export interface PdfFormField {
  name: string;          // field name (AcroForm key)
  label: string;         // human-readable label (derived from name)
  type: PdfFieldType;
  required: boolean;
  readOnly: boolean;
  page: number;          // 1-based
  options?: string[];    // for dropdown/radio/list
  defaultValue?: string;
  group: string;         // derived group prefix
}

export interface PdfSchema {
  tier: "tier2_pdf_form";
  templateName: string;
  fieldCount: number;
  fields: PdfFormField[];
  groups: string[];
  rawFieldNames: string[];
  pageCount: number;
  hasAcroForm: boolean;
}

/** Convert AcroForm field name to readable label */
function nameToLabel(name: string): string {
  // Handle dotted paths like "Personal.FirstName" → "First Name"
  const last = name.split(".").pop() ?? name;
  return last
    .replace(/([A-Z])/g, " $1")
    .replace(/[_\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
}

/** Derive a group from field name prefix */
function nameToGroup(name: string): string {
  const parts = name.split(".");
  if (parts.length > 1) return parts[0].toLowerCase();
  // Try to infer from common prefixes
  const lower = name.toLowerCase();
  if (/^(first|last|name|prenom|nom|civilite|gender|titre)/.test(lower)) return "identité";
  if (/^(addr|address|rue|ville|city|zip|postal|pays|country)/.test(lower)) return "adresse";
  if (/^(date|day|month|year|annee|mois)/.test(lower)) return "dates";
  if (/^(phone|tel|fax|mobile|email|mail)/.test(lower)) return "contact";
  if (/^(amount|montant|price|prix|total|tax|tva|ht|ttc)/.test(lower)) return "montants";
  if (/^(company|societe|entreprise|siren|siret|rcs)/.test(lower)) return "société";
  return "général";
}

function getFieldType(field: PDFField): PdfFieldType {
  if (field instanceof PDFTextField) return "text";
  if (field instanceof PDFCheckBox) return "checkbox";
  if (field instanceof PDFRadioGroup) return "radio";
  if (field instanceof PDFDropdown) return "dropdown";
  if (field instanceof PDFOptionList) return "list";
  return "unknown";
}

function getFieldOptions(field: PDFField): string[] | undefined {
  if (field instanceof PDFDropdown) {
    try { return field.getOptions(); } catch { return undefined; }
  }
  if (field instanceof PDFRadioGroup) {
    try { return field.getOptions(); } catch { return undefined; }
  }
  if (field instanceof PDFOptionList) {
    try { return field.getOptions(); } catch { return undefined; }
  }
  return undefined;
}

function getDefaultValue(field: PDFField): string | undefined {
  try {
    if (field instanceof PDFTextField) return field.getText() || undefined;
    if (field instanceof PDFCheckBox) return field.isChecked() ? "true" : "false";
    if (field instanceof PDFDropdown) {
      const sel = field.getSelected();
      return sel.length > 0 ? sel[0] : undefined;
    }
  } catch { /* ignore */ }
  return undefined;
}

export async function ingestPdfTemplate(
  buffer: Buffer,
  name?: string
): Promise<PdfSchema> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  let form: PDFForm | null = null;
  let pdfFields: PDFField[] = [];
  let hasAcroForm = false;

  try {
    form = pdfDoc.getForm();
    pdfFields = form.getFields();
    hasAcroForm = pdfFields.length > 0;
  } catch {
    hasAcroForm = false;
  }

  const fields: PdfFormField[] = pdfFields.map((field) => {
    const fieldName = field.getName();
    const type = getFieldType(field);
    const options = getFieldOptions(field);
    const defaultValue = getDefaultValue(field);

    // Determine page (get first widget page index)
    let page = 1;
    try {
      const widgets = field.acroField.getWidgets();
      if (widgets.length > 0) {
        const pages = pdfDoc.getPages();
        const widgetRef = widgets[0].P();
        if (widgetRef) {
          const idx = pages.findIndex(p => p.ref === widgetRef);
          if (idx >= 0) page = idx + 1;
        }
      }
    } catch { /* default page 1 */ }

    return {
      name: fieldName,
      label: nameToLabel(fieldName),
      type,
      required: false, // AcroForm doesn't always expose this reliably
      readOnly: false,
      page,
      options,
      defaultValue,
      group: nameToGroup(fieldName),
    };
  });

  const groups = [...new Set(fields.map(f => f.group))];
  const templateName = name ?? `Formulaire PDF (${pageCount} page${pageCount > 1 ? "s" : ""})`;

  return {
    tier: "tier2_pdf_form",
    templateName,
    fieldCount: fields.length,
    fields,
    groups,
    rawFieldNames: fields.map(f => f.name),
    pageCount,
    hasAcroForm,
  };
}

export function validatePdfBuffer(buffer: Buffer): { valid: boolean; error?: string } {
  if (!buffer || buffer.length < 4) return { valid: false, error: "Fichier vide ou invalide" };
  const header = buffer.slice(0, 4).toString("ascii");
  if (header !== "%PDF") return { valid: false, error: "Format non reconnu. Le fichier doit être un PDF valide." };
  if (buffer.length > 20 * 1024 * 1024) return { valid: false, error: "Fichier trop volumineux. Maximum : 20 Mo." };
  return { valid: true };
}
