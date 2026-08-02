'use client';

import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface LogoUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  pressingName?: string;
}

export function LogoUploader({ value, onChange, pressingName = 'Nora' }: LogoUploaderProps) {
  const [preview, setPreview]         = useState<string | undefined>(value);
  const [isDragging, setIsDragging]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [uploadOk, setUploadOk]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (name: string) =>
    name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  // ─── Traitement du fichier ──────────────────────────────────
  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setUploadOk(false);

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setErrorMsg('Format non supporté. Choisissez PNG, JPG ou WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Fichier trop volumineux (max 2 Mo).');
      return;
    }

    setIsUploading(true);

    // Convertir en base64 → persiste dans localStorage
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setPreview(base64);

      // Tentative optionnelle : Supabase Storage
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const ext  = file.name.split('.').pop();
        const path = `logos/logo_${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage
          .from('pressing-logos')
          .upload(path, file, { upsert: true });
        if (!error && data) {
          const { data: pub } = supabase.storage.from('pressing-logos').getPublicUrl(path);
          onChange(pub.publicUrl);
          setUploadOk(true);
          return;
        }
      } catch {
        // Supabase non configuré → base64 local
      }

      onChange(base64);
      setUploadOk(true);
    } catch {
      setErrorMsg('Impossible de lire le fichier. Réessayez.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => { setPreview(undefined); onChange(''); setUploadOk(false); };

  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
        Logo officiel du pressing
      </label>

      {preview ? (
        /* Aperçu */
        <div className="flex items-start gap-4">
          <div className="relative w-28 h-28 rounded-2xl border-2 border-slate-200 bg-white shadow-sm flex items-center justify-center overflow-hidden group">
            <img src={preview} alt="Logo" className="w-full h-full object-contain p-2" />
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold shadow">
                Changer
              </button>
              <button type="button" onClick={handleRemove}
                className="p-1.5 bg-rose-600 text-white rounded-lg shadow">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {uploadOk && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Logo sauvegardé avec succès
              </div>
            )}
            <p className="text-xs text-slate-400">
              Survolez l'image pour la changer ou la supprimer.
            </p>
          </div>
        </div>
      ) : (
        /* Zone de drop */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging ? 'border-[#2563EB] bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/50'
          }`}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
          ) : (
            <img src="/assets/logo.jpg" alt="Nora Fallback" className="w-16 h-16 rounded-2xl object-cover shadow-md" />
          )}
          <div>
            <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5 justify-center">
              <Upload className="w-4 h-4 text-[#2563EB]" />
              {isUploading ? 'Traitement...' : 'Glissez votre logo ou cliquez'}
            </p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP · Max 2 Mo</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <p className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{errorMsg}
        </p>
      )}

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}
