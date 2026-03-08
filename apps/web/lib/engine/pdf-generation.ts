import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList } from "pdf-lib";
import type { PdfSchema, PdfFormField } from "./pdf-ingestion";

export interface PdfGenerationResult {
  buffer: string;    // base64
  filename: string;
  fieldsFilled: number;
  fieldsSkipped: string[];
}

export interface PdfGenerationInput {
  templateBuffer: string;  // base64
  schema: PdfSchema;
  data: Record<string, string>;
  flattenForm?: boolean;   // flatten = non-editable output
}

function sanitizeValue(value: string, field: PdfFormField): string {
  if (!value) return "";
  // Normalize date formats
  if (field.type === "text" && /date/i.test(field.name)) {
    // Try to normalize yyyy-mm-dd → dd/mm/yyyy
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }
  return value.trim();
}

export async function generatePdfDocument(input: PdfGenerationInput): Promise<PdfGenerationResult> {
  const { templateBuffer, schema, data, flattenForm = false } = input;

  // Decode base64 buffer
  const pdfBytes = Uint8Array.from(Buffer.from(templateBuffer, "base64"));
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  const fieldsSkipped: string[] = [];
  let fieldsFilled = 0;

  for (const schemaField of schema.fields) {
    const rawValue = data[schemaField.name];
    const value = sanitizeValue(rawValue ?? "", schemaField);

    try {
      const field = form.getField(schemaField.name);

      if (field instanceof PDFTextField) {
        if (value !== undefined) {
          field.setText(value || "");
          fieldsFilled++;
        }
      } else if (field instanceof PDFCheckBox) {
        const isChecked = ["true", "1", "yes", "oui", "on"].includes(value.toLowerCase());
        if (isChecked) {
          field.check();
        } else {
          field.uncheck();
        }
        fieldsFilled++;
      } else if (field instanceof PDFRadioGroup) {
        if (value) {
          try {
            field.select(value);
            fieldsFilled++;
          } catch {
            // value might not be valid option — skip silently
            fieldsSkipped.push(`${schemaField.name} (valeur invalide: ${value})`);
          }
        }
      } else if (field instanceof PDFDropdown) {
        if (value) {
          try {
            field.select(value);
            fieldsFilled++;
          } catch {
            fieldsSkipped.push(`${schemaField.name} (option non trouvée: ${value})`);
          }
        }
      } else if (field instanceof PDFOptionList) {
        if (value) {
          try {
            field.select(value);
            fieldsFilled++;
          } catch {
            fieldsSkipped.push(`${schemaField.name} (option non trouvée: ${value})`);
          }
        }
      }
    } catch (err) {
      fieldsSkipped.push(`${schemaField.name} (champ introuvable)`);
    }
  }

  if (flattenForm) {
    try { form.flatten(); } catch { /* non-critical */ }
  }

  const filledBytes = await pdfDoc.save();
  const buffer = Buffer.from(filledBytes).toString("base64");

  // Generate filename
  const safeName = schema.templateName
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
  const date = new Date().toISOString().split("T")[0];
  const filename = `${safeName}_${date}.pdf`;

  return { buffer, filename, fieldsFilled, fieldsSkipped };
}
