import { Automation, addRun } from "./store";

// ── Runner ────────────────────────────────────────────────────────────────────

export async function runAutomation(
  automation: Automation,
  triggeredBy: "cron" | "webhook" | "api" | "manual",
  overrides?: Record<string, string>
): Promise<{ success: boolean; docName?: string; error?: string }> {
  const start = Date.now();

  try {
    // Load template from localStorage
    const templates = JSON.parse(localStorage.getItem("milaf_templates") || "[]");
    const template = templates.find((t: any) => t.id === automation.templateId);
    if (!template) throw new Error(`Template introuvable : ${automation.templateId}`);

    // Merge static mappings + overrides
    const data = { ...automation.fieldMappings, ...(overrides ?? {}) };

    // Replace {{var}} placeholders with override values if passed
    const resolved: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      const match = value.match(/^\{\{(.+)\}\}$/);
      resolved[key] = match ? (overrides?.[match[1]] ?? value) : value;
    }

    // Call the right generation API
    const isTier2 = template.tier === 2;
    const endpoint = isTier2 ? "/api/pdf/generate" : "/api/templates/generate";
    const body = isTier2
      ? { templateId: automation.templateId, data: resolved }
      : { templateId: automation.templateId, data: resolved };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "Échec génération");
    }

    const result = await res.json();
    const docName = `${template.name}_${new Date().toISOString().slice(0, 10)}.${isTier2 ? "pdf" : "docx"}`;

    // Save to generated docs list
    const docs = JSON.parse(localStorage.getItem("milaf_documents") || "[]");
    docs.unshift({
      id: crypto.randomUUID(),
      name: docName,
      templateId: automation.templateId,
      templateName: template.name,
      tier: template.tier ?? 1,
      data: resolved,
      fileBase64: result.docxBase64 || result.pdfBase64,
      createdAt: new Date().toISOString(),
      source: `automation:${automation.id}`,
    });
    localStorage.setItem("milaf_documents", JSON.stringify(docs.slice(0, 200)));

    addRun({
      automationId: automation.id,
      status: "success",
      triggeredBy,
      docGenerated: docName,
      durationMs: Date.now() - start,
    });

    return { success: true, docName };
  } catch (err: any) {
    addRun({
      automationId: automation.id,
      status: "error",
      triggeredBy,
      errorMessage: err.message,
      durationMs: Date.now() - start,
    });
    return { success: false, error: err.message };
  }
}
