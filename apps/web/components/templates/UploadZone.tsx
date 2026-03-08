"use client";
import { useCallback, useState } from "react";

interface Props {
  onFile: (file: File) => void;
  loading: boolean;
}

export function UploadZone({ onFile, loading }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".docx")) {
      alert("Seuls les fichiers .docx sont acceptés pour le Tier 1.");
      return;
    }
    onFile(file);
  }, [onFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Nouveau template Word</h1>
        <p className="text-[#6b7290] text-sm">
          Uploadez un fichier <span className="text-white font-mono">.docx</span> contenant des balises{" "}
          <span className="text-[#3B5BDB] font-mono">{"{{champ}}"}</span> — Mi-Laf détecte et extrait automatiquement tous les champs.
        </p>
      </div>

      {/* Drop zone */}
      <label
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`block border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-[#3B5BDB] bg-[#3B5BDB]/10"
            : "border-[#252a40] hover:border-[#3B5BDB]/50 hover:bg-[#0d0f18]"
        } ${loading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input type="file" accept=".docx" className="hidden" onChange={onInputChange} disabled={loading} />

        {loading ? (
          <div className="space-y-3">
            <div className="text-3xl animate-pulse">⚙</div>
            <p className="text-white font-semibold">Analyse en cours...</p>
            <p className="text-[#6b7290] text-sm">Extraction des balises et construction du schéma</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl">◈</div>
            <p className="text-white font-semibold">Glissez votre fichier .docx ici</p>
            <p className="text-[#6b7290] text-sm">ou cliquez pour parcourir</p>
            <div className="inline-block mt-2 px-4 py-2 bg-[#3B5BDB] text-white text-sm rounded-lg font-medium">
              Choisir un fichier
            </div>
          </div>
        )}
      </label>

      {/* Guide balises */}
      <div className="bg-[#0d0f18] border border-[#181c2c] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Comment baliser votre document ?</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[#6b7290] mb-2">Balises simples</p>
            <div className="space-y-1 font-mono text-xs">
              {["{{nom_client}}", "{{adresse_chantier}}", "{{montant_ttc}}", "{{date_travaux}}"].map(b => (
                <div key={b} className="text-[#3B5BDB] bg-[#3B5BDB]/10 px-2 py-1 rounded">{b}</div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[#6b7290] mb-2">Balises avec namespace (recommandé)</p>
            <div className="space-y-1 font-mono text-xs">
              {["{{client.nom}}", "{{client.adresse}}", "{{chantier.surface}}", "{{travaux.montant_ht}}"].map(b => (
                <div key={b} className="text-[#2ee8c8] bg-[#2ee8c8]/10 px-2 py-1 rounded">{b}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
