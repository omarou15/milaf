"use client";
import { useState } from "react";
import type { PdfSchema, PdfFormField } from "@/lib/engine/pdf-ingestion";

const TYPE_ICONS: Record<string, string> = {
  text: "T",
  checkbox: "☑",
  radio: "◉",
  dropdown: "▾",
  list: "≡",
  unknown: "?",
};
const TYPE_COLORS: Record<string, string> = {
  text: "#3B5BDB",
  checkbox: "#2ee8c8",
  radio: "#a16ef8",
  dropdown: "#f59e0b",
  list: "#ec4899",
  unknown: "#6b7290",
};

interface Props {
  schema: PdfSchema;
  templateB64: string;
  onSave: (schema: PdfSchema) => void;
}

export function SchemaBuilderPdf({ schema, templateB64, onSave }: Props) {
  const [fields, setFields] = useState<PdfFormField[]>(schema.fields);
  const [saving, setSaving] = useState(false);

  function updateLabel(idx: number, label: string) {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, label } : f));
  }
  function updateGroup(idx: number, group: string) {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, group } : f));
  }
  function removeField(idx: number) {
    setFields(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    setSaving(true);
    const updated: PdfSchema = { ...schema, fields, fieldCount: fields.length, groups: [...new Set(fields.map(f => f.group))] };
    onSave(updated);
  }

  const groups = [...new Set(fields.map(f => f.group))];

  return (
    <div>
      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-[#0d0f18] border border-[#181c2c] rounded-xl">
        <div className="text-center">
          <div className="text-xl font-bold text-white">{fields.length}</div>
          <div className="text-xs text-[#6b7290]">champs</div>
        </div>
        <div className="w-px h-8 bg-[#1e2235]" />
        <div className="text-center">
          <div className="text-xl font-bold text-white">{schema.pageCount}</div>
          <div className="text-xs text-[#6b7290]">pages</div>
        </div>
        <div className="w-px h-8 bg-[#1e2235]" />
        <div className="text-center">
          <div className="text-xl font-bold text-[#2ee8c8]">2</div>
          <div className="text-xs text-[#6b7290]">crédits</div>
        </div>
        <div className="ml-auto text-xs text-[#6b7290]">
          {schema.templateName}
        </div>
      </div>

      {/* Field types legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(TYPE_ICONS).filter(([k]) => fields.some(f => f.type === k)).map(([type, icon]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg" style={{ color: TYPE_COLORS[type], background: `${TYPE_COLORS[type]}18` }}>
            <span>{icon}</span>
            <span>{type}</span>
            <span className="opacity-50">×{fields.filter(f => f.type === type).length}</span>
          </div>
        ))}
      </div>

      {/* Fields by group */}
      {groups.map(group => (
        <div key={group} className="mb-6">
          <div className="text-xs font-semibold text-[#6b7290] uppercase tracking-wider mb-3 capitalize flex items-center gap-2">
            <span>{group}</span>
            <span className="text-[#3a3f5c]">({fields.filter(f => f.group === group).length})</span>
          </div>
          <div className="space-y-2">
            {fields.map((field, idx) => field.group !== group ? null : (
              <div key={field.name} className="flex items-center gap-3 p-3 bg-[#0d0f18] border border-[#181c2c] rounded-xl hover:border-[#252a40] transition-colors group">
                {/* Type badge */}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ color: TYPE_COLORS[field.type], background: `${TYPE_COLORS[field.type]}18` }}>
                  {TYPE_ICONS[field.type]}
                </div>

                {/* Field name (readonly) */}
                <div className="font-mono text-xs text-[#3a3f5c] w-32 shrink-0 truncate" title={field.name}>
                  {field.name}
                </div>

                {/* Label (editable) */}
                <input
                  type="text"
                  value={field.label}
                  onChange={e => updateLabel(idx, e.target.value)}
                  placeholder="Label affiché"
                  className="flex-1 bg-transparent border-0 text-sm text-white placeholder-[#3a3f5c] outline-none min-w-0"
                />

                {/* Group (editable) */}
                <input
                  type="text"
                  value={field.group}
                  onChange={e => updateGroup(idx, e.target.value)}
                  placeholder="groupe"
                  className="w-24 bg-[#141624] border border-[#1e2235] rounded-lg px-2 py-1 text-xs text-[#9ca3af] outline-none focus:border-[#2ee8c8] shrink-0"
                />

                {/* Page indicator */}
                <span className="text-xs text-[#3a3f5c] w-12 text-right shrink-0">p.{field.page}</span>

                {/* Options hint */}
                {field.options && field.options.length > 0 && (
                  <span className="text-xs text-[#3a3f5c] shrink-0" title={field.options.join(", ")}>
                    {field.options.length} opts
                  </span>
                )}

                {/* Remove */}
                <button onClick={() => removeField(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#3a3f5c] hover:text-red-400 text-lg leading-none shrink-0">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {fields.length === 0 && (
        <div className="text-center py-8 text-[#6b7290] text-sm">Tous les champs ont été supprimés.</div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={saving || fields.length === 0}
          className="flex-1 px-5 py-3 bg-[#2ee8c8] hover:bg-[#25c9ae] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0d14] font-bold rounded-xl text-sm transition-all"
        >
          {saving ? "Enregistrement…" : `✓ Sauvegarder le template (${fields.length} champs)`}
        </button>
      </div>
    </div>
  );
}
