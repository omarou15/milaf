// ── Types ─────────────────────────────────────────────────────────────────────

export type TriggerType = "cron" | "webhook" | "api";
export type AutomationStatus = "active" | "paused" | "error" | "draft";
export type CronFrequency = "daily" | "weekly" | "monthly" | "custom";

export interface CronConfig {
  frequency: CronFrequency;
  time: string;         // "HH:MM"
  dayOfWeek?: number;   // 0-6 for weekly
  dayOfMonth?: number;  // 1-31 for monthly
  customCron?: string;
}

export interface WebhookConfig {
  secret: string;       // HMAC secret for signature verification
  description?: string;
}

export interface ApiConfig {
  description?: string;
}

export interface Automation {
  id: string;
  name: string;
  status: AutomationStatus;
  trigger: TriggerType;
  templateId: string;
  templateName: string;
  fieldMappings: Record<string, string>; // fieldKey → static value or "{{var}}"
  cronConfig?: CronConfig;
  webhookConfig?: WebhookConfig;
  apiConfig?: ApiConfig;
  webhookUrl?: string;   // generated endpoint
  lastRunAt?: string;
  lastRunStatus?: "success" | "error";
  runCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRun {
  id: string;
  automationId: string;
  status: "success" | "error";
  triggeredBy: TriggerType | "manual";
  docGenerated?: string; // filename
  errorMessage?: string;
  durationMs: number;
  createdAt: string;
}

// ── Storage helpers ────────────────────────────────────────────────────────────

const AUTOMATIONS_KEY = "milaf_automations";
const RUNS_KEY = "milaf_automation_runs";

export function getAutomations(): Automation[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(AUTOMATIONS_KEY) || "[]");
}

export function saveAutomations(automations: Automation[]): void {
  localStorage.setItem(AUTOMATIONS_KEY, JSON.stringify(automations));
}

export function createAutomation(partial: Omit<Automation, "id" | "runCount" | "createdAt" | "updatedAt">): Automation {
  const automation: Automation = {
    ...partial,
    id: crypto.randomUUID(),
    runCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = getAutomations();
  saveAutomations([...all, automation]);
  return automation;
}

export function updateAutomation(id: string, patch: Partial<Automation>): Automation | null {
  const all = getAutomations();
  const idx = all.findIndex(a => a.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  saveAutomations(all);
  return updated;
}

export function deleteAutomation(id: string): void {
  saveAutomations(getAutomations().filter(a => a.id !== id));
}

export function getRuns(automationId?: string): AutomationRun[] {
  if (typeof window === "undefined") return [];
  const all: AutomationRun[] = JSON.parse(localStorage.getItem(RUNS_KEY) || "[]");
  return automationId ? all.filter(r => r.automationId === automationId) : all;
}

export function addRun(run: Omit<AutomationRun, "id" | "createdAt">): AutomationRun {
  const full: AutomationRun = { ...run, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const all = getRuns();
  const trimmed = [full, ...all].slice(0, 500); // keep last 500
  localStorage.setItem(RUNS_KEY, JSON.stringify(trimmed));
  // update parent automation
  updateAutomation(run.automationId, {
    lastRunAt: full.createdAt,
    lastRunStatus: run.status,
    runCount: (getAutomations().find(a => a.id === run.automationId)?.runCount ?? 0) + 1,
  });
  return full;
}

// ── Webhook URL generator ──────────────────────────────────────────────────────

export function generateWebhookUrl(automationId: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://milaf.vercel.app";
  return `${base}/api/automations/webhook/${automationId}`;
}

export function generateWebhookSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Cron description ──────────────────────────────────────────────────────────

export function describeCron(cfg: CronConfig): string {
  const DAYS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  switch (cfg.frequency) {
    case "daily": return `Tous les jours à ${cfg.time}`;
    case "weekly": return `Tous les ${DAYS[cfg.dayOfWeek ?? 1]} à ${cfg.time}`;
    case "monthly": return `Le ${cfg.dayOfMonth ?? 1} de chaque mois à ${cfg.time}`;
    case "custom": return cfg.customCron ?? "Personnalisé";
  }
}
