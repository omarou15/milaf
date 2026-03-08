"use client";
import { useState, useCallback } from "react";
import type { WordSchema, DetectedField, FieldType } from "@/lib/engine/word-ingestion";

interface Props {
  schema: WordSchema;
  templateB64: string | null;
  onSave: (schema: WordSchema) => void;
}

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: "text",    label: "Texte",    icon: "Aa" },
  { value: "number",  label: "Nombre",   icon: "12" },
  { value: "date",    label: "Date",     icon: "📅" },
  { value: "boolean", label: "Oui/Non",  icon: "☑" },
  { value: "select",  label: "Choix",    icon: "▾" },
];

const GROUP_COLORS: Record<string, string> = {
  client:     "#3B5BDB",
  chantier:   "#2ee8c8",
  travaux:    "#a16ef8",
  entreprise: "#f59e0b",
  financier:  "#22c55e",
  dates:      "#f43f5e",
  general:    "#6b7290",
};

function groupColor(group: string): string {
  return GROUP_COLORS[group] ?? "#6b7290";
}

export function SchemaBuilder({ schema: initialSchema, templateB64, onSave }: Props) {
  const [schema, setSchema] = useState<WordSchema>(initialSchema);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [testData, setTestData] = useState<Record<string, string>>({});
  const [showTest, setShowTest] = useState(false);
  const [generating, setGenerating] = useState(false);

  const visibleFields = activeGroup
    ? schema.fields.filter((f) => f.group === activeGroup)
    : schema.fields;

  const updateField = useCallback((balise: string, update: Partial<DetectedField>) => {
    setSchema((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => f.balise === balise ? { ...f, ...update } : f),
    }));
  }, []);

  const handleGenerate = async () => {
    if (!templateB64) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateBuffer: templateB64,
          schema,
          data: testData,
          skipValidation: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // Téléchargement automatique
      const bytes = Uint8Array.from(atob(json.buffer), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = json.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur de génération");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{schema.templateName}</h2>
          <p className="text-[#6b7290] text-sm mt-0.5">
            {schema.fieldCount} champs détectés • {schema.groups.length} groupes
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTest(!showTest)}
            className="px-4 py-2 border border-[#252a40] text-[#9ca3af] text-sm rounded-lg hover:border-[#3B5BDB] hover:text-white transition"
          >
            {showTest ? "← Retour" : "🧪 Tester"}
          </button>
          <button
            onClick={() => onSave(schema)}
            className="px-4 py-2 bg-[#3B5BDB] text-white text-sm rounded-lg font-semibold hover:bg-[#2f4dc4] transition"
          >
            Sauvegarder →
          </button>
        </div>
      </div>

      {/* Warnings */}
      {schema.warnings.length > 0 && (
        <div className="space-y-2">
          {schema.warnings.map((w, i) => (
            <div key={i} className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-amber-400 text-sm flex gap-2">
              <span>⚠</span><span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {!showTest ? (
        <>
          {/* Group filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveGroup(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!activeGroup ? "bg-[#3B5BDB] text-white" : "bg-[#0d0f18] text-[#6b7290] border border-[#181c2c] hover:text-white"}`}
            >
              Tous ({schema.fieldCount})
            </button>
            {schema.groups.map((g) => {
              const count = schema.fields.filter((f) => f.group === g).length;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g === activeGroup ? null : g)}
                  style={activeGroup === g ? { backgroundColor: groupColor(g) + "30", color: groupColor(g), borderColor: groupColor(g) + "60" } : {}}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${activeGroup === g ? "" : "bg-[#0d0f18] text-[#6b7290] border-[#181c2c] hover:text-white"}`}
                >
                  {g} ({count})
                </button>
              );
            })}
          </div>

          {/* Fields table */}
          <div className="bg-[#0d0f18] border border-[#181c2c] rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1.5fr_1fr_80px_80px] gap-4 px-4 py-3 border-b border-[#181c2c] text-xs font-semibold text-[#6b7290] uppercase tracking-wide">
              <div>Balise</div>
              <div>Label affiché</div>
              <div>Type</div>
              <div>Groupe</div>
              <div className="text-center">Requis</div>
            </div>

            {/* Fields */}
            <div className="divide-y divide-[#181c2c]">
              {visibleFields.map((field) => (
                <div key={field.balise} className="grid grid-cols-[1fr_1.5fr_1fr_80px_80px] gap-4 px-4 py-3 items-center hover:bg-white/[0.02] transition">
                  {/* Balise */}
                  <div className="font-mono text-xs text-[#3B5BDB] bg-[#3B5BDB]/10 px-2 py-1 rounded truncate">
                    {`{{${field.balise}}}`}
                  </div>

                  {/* Label */}
                  <input
                    value={field.label}
                    onChange={(e) => updateField(field.balise, { label: e.target.value })}
                    className="bg-transparent text-white text-sm outline-none border-b border-transparent hover:border-[#252a40] focus:border-[#3B5BDB] py-0.5 transition"
                  />

                  {/* Type */}
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.balise, { type: e.target.value as FieldType })}
                    className="bg-[#06070c] border border-[#252a40] text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-[#3B5BDB]"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>

                  {/* Group badge */}
                  <div
                    className="text-xs font-medium px-2 py-1 rounded text-center"
                    style={{ color: groupColor(field.group), backgroundColor: groupColor(field.group) + "20" }}
                  >
                    {field.group}
                  </div>

                  {/* Required toggle */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => updateField(field.balise, { required: !field.required })}
                      className={`w-10 h-5 rounded-full transition-all relative ${field.required ? "bg-[#3B5BDB]" : "bg-[#252a40]"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${field.required ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Test panel */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Test de génération</h3>
              <p className="text-[#6b7290] text-sm mt-0.5">Remplissez les champs et téléchargez le document généré</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#2f4dc4] transition"
            >
              {generating ? "⚙ Génération..." : "⬇ Générer & Télécharger"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {schema.fields.map((field) => (
              <div key={field.balise}>
                <label className="block text-xs text-[#6b7290] mb-1.5 font-medium">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                  <span className="ml-2 font-mono text-[#252a40] text-[10px]">{`{{${field.balise}}}`}</span>
                </label>
                <input
                  type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                  placeholder={field.hint ?? `Valeur pour ${field.label}`}
                  value={testData[field.balise] ?? ""}
                  onChange={(e) => setTestData((p) => ({ ...p, [field.balise]: e.target.value }))}
                  className="w-full bg-[#0d0f18] border border-[#181c2c] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#4a5070] outline-none focus:border-[#3B5BDB] transition"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
