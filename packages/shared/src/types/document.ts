export type DocumentStatus = "queued" | "processing" | "done" | "error";

export interface Document {
  id: string;
  templateId: string;
  status: DocumentStatus;
  inputData: Record<string, unknown>;
  outputFileUrl?: string;
  creditsUsed: number;
  generatedAt: string;
}
