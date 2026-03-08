/**
 * Mi-Laf Railway API Client
 * Connects to the backend for Tier 4 (PyMuPDF analysis + Claude renderer)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://milafapi-production.up.railway.app";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

class RailwayAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async fetch<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {}, timeout = 120_000 } = options;
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
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
    return this.fetch<{ status: string; service: string; capabilities: string[] }>("/health");
  }

  /** Tier 4: Analyse PDF avec PyMuPDF (pixel-level extraction) */
  async analyzePdf(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120_000);

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

  /** Tier 4: Analyse PDF depuis base64 */
  async analyzePdfBase64(pdfBase64: string, filename: string) {
    return this.fetch("/pdf/analyze", {
      method: "POST",
      body: { pdfBase64, filename },
    });
  }

  /** Tier 4: Claude génère le renderer à partir de l'analyse PyMuPDF */
  async generateRenderer(analysis: any, targetPage: number, templateName: string) {
    return this.fetch<{ success: boolean; code: string; tokens_used: any }>("/claude/analyze-pdf", {
      method: "POST",
      body: { analysis, target_page: targetPage, template_name: templateName },
    });
  }

  /** Claude streaming proxy (pour le chat) */
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
export type { RequestOptions };
