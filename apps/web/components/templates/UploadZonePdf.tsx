"use client";
import { useCallback } from "react";

interface Props {
  onFile: (file: File) => void;
  loading: boolean;
  label?: string;
  hint?: string;
  accentColor?: string;
}

export function UploadZonePdf({ onFile, loading, label, hint, accentColor = "#2ee8c8" }: Props) {
  const isPixelPerfect = accentColor === "#a16ef8";

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  }, [onFile]);

  const borderStyle = loading
    ? { borderColor: `${accentColor}40`, background: `${accentColor}08` }
    : {};

  return (
    <label
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onMouseEnter={e => { if (!loading) { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${accentColor}50`; el.style.background = `${accentColor}08`; }}}
      onMouseLeave={e => { if (!loading) { const el = e.currentTarget as HTMLElement; el.style.borderColor = ""; el.style.background = ""; }}}
      className={`block border-2 border-dashed border-[#1e2235] rounded-2xl p-12 text-center transition-all duration-200 ${loading ? "cursor-wait" : "cursor-pointer"}`}
      style={borderStyle}
    >
      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleInput}
        disabled={loading}
        className="hidden"
      />

      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${accentColor} transparent transparent transparent` }} />
          <span className="text-[#6b7290] text-sm">
            {isPixelPerfect ? "Envoi vers Vision IA…" : "Analyse des champs AcroForm…"}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border"
            style={{ background: `${accentColor}10`, borderColor: `${accentColor}20` }}>
            {isPixelPerfect ? "✦" : "⊡"}
          </div>
          <div>
            <div className="text-white font-semibold mb-1">
              {label ?? "Glissez votre PDF AcroForm ici"}
            </div>
            <div className="text-[#6b7290] text-sm">ou cliquez pour parcourir</div>
          </div>
          <div className="text-xs text-[#3a3f5c] bg-[#0d0f18] border border-[#181c2c] rounded-xl px-4 py-2 max-w-sm">
            {hint ?? (
              <>
                Le PDF doit contenir des{" "}
                <span style={{ color: accentColor }}>champs de formulaire AcroForm</span>.<br />
                Créez-les avec Adobe Acrobat, LibreOffice Draw ou{" "}
                <a href="https://www.pdfescape.com" target="_blank" rel="noreferrer"
                  className="hover:underline" style={{ color: accentColor }}
                  onClick={e => e.stopPropagation()}>PDFescape.io</a>
              </>
            )}
          </div>
          <div className="text-xs text-[#3a3f5c]">
            PDF · max 20 Mo · {isPixelPerfect ? "5 crédits / génération" : "2 crédits / génération"}
          </div>
        </div>
      )}
    </label>
  );
}
