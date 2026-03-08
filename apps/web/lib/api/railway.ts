/**
 * Mi-Laf Railway API Client
 * Connects to the backend for Tier 4 (PyMuPDF analysis + Claude renderer)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://milafapi-production.up.railway.app";

export interface PDFAnalysisResult {
  page_count: number;
  page_width: number;
  page_height: number;
  pages: PageAnalysis[];
}

export interface PageAnalysis {
  page_number: number;
  text_blocks: TextBlock[];
  vector_shapes: VectorShape[];
  images: ImageInfo[];
  colors: ColorInfo[];
}

export interface TextBlock {
  text: string;
  x: number; y: number; w: number; h: number;
  font: string; size: number;
  color_rgb: number[];
  color_hex: string;
  bold: boolean; italic: boolean;
}

export interface VectorShape {
  index: number;
  x: number; y: number; w: number; h: number;
  fill_rgb: number[] | null;
  fill_hex: string | null;
  stroke_rgb: number[] | null;
  stroke_hex: string | null;
  stroke_width: number;
}

export interface ImageInfo {
  xref: number; width: number; height: number;
  ext: string; size_bytes: number;
}

export interface ColorInfo {
  rgb: number[];
  hex: string;
  usage_count: number;
  context: string;
}

export interface DetectedField {
  key: string;
  label: string;
  type: string;
  page: number;
  x: number;
  y: number;
  original_text: string;
}

export interface CloneAnalysisResult {
  success: boolean;
  fields: DetectedField[];
  code: string;
  tokens_used: { input_tokens: number; output_tokens: number };
  raw_response_length: number;
}

class RailwayAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async fetchJSON<T = any>(endpoint: string, options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    timeout?: number;
  } = {}): Promise<T> {
    const { method = "GET", body, headers = {}, timeout = 120_000 } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Erreur API (${res.status})`);
      }
      return res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  /** Health check */
  async health() {
    return this.fetchJSON<{ status: string; service: string; capabilities: string[] }>("/health");
  }

  /** Tier 4: Analyse PDF via PyMuPDF (multipart upload) */
  async analyzePdf(file: File): Promise<PDFAnalysisResult> {
    const formData = new FormData();
    formData.append("file", file);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180_000); // 3 min for large PDFs

    try {
      const res = await fetch(`${this.baseUrl}/pdf/analyze`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || "Erreur d'analyse PDF");
      }
      return res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  /** Tier 4: Claude detects fields + generates renderer from PyMuPDF analysis */
  async cloneAnalyze(
    analysis: PDFAnalysisResult,
    targetPage: number,
    templateName: string
  ): Promise<CloneAnalysisResult> {
    return this.fetchJSON<CloneAnalysisResult>("/claude/analyze-pdf", {
      method: "POST",
      body: { analysis, target_page: targetPage, template_name: templateName },
      timeout: 180_000,
    });
  }

  /** Claude streaming proxy */
  async streamChat(messages: any[], system?: string, maxTokens?: number) {
    const res = await fetch(`${this.baseUrl}/claude/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, system, max_tokens: maxTokens ?? 4096 }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || "Erreur streaming");
    }
    return res;
  }
}

export const railwayApi = new RailwayAPI(API_URL);
