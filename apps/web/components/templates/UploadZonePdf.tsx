"use client";
import { useCallback } from "react";

interface Props {
  onFile: (file: File) => void;
  loading: boolean;
}

export function UploadZonePdf({ onFile, loading }: Props) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <label
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      className={`block border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
        loading
          ? "border-[#2ee8c8]/40 bg-[#2ee8c8]/5 cursor-wait"
          : "border-[#1e2235] hover:border-[#2ee8c8]/40 hover:bg-[#2ee8c8]/5"
      }`}
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
          <div className="w-10 h-10 border-2 border-[#2ee8c8] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#6b7290] text-sm">Analyse des champs AcroForm…</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#2ee8c8]/10 border border-[#2ee8c8]/20 flex items-center justify-center text-2xl">
            ⊡
          </div>
          <div>
            <div className="text-white font-semibold mb-1">Glissez votre PDF AcroForm ici</div>
            <div className="text-[#6b7290] text-sm">ou cliquez pour parcourir</div>
          </div>
          <div className="text-xs text-[#3a3f5c] bg-[#0d0f18] border border-[#181c2c] rounded-xl px-4 py-2 max-w-sm">
            Le PDF doit contenir des <span className="text-[#2ee8c8]">champs de formulaire AcroForm</span>.<br />
            Créez-les avec Adobe Acrobat, LibreOffice Draw ou{" "}
            <a href="https://www.pdfescape.com" target="_blank" rel="noreferrer" className="text-[#2ee8c8] hover:underline" onClick={e => e.stopPropagation()}>
              PDFescape.io
            </a>
          </div>
          <div className="text-xs text-[#3a3f5c]">PDF · max 20 Mo · 2 crédits / génération</div>
        </div>
      )}
    </label>
  );
}
