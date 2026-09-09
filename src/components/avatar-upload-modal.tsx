"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faXmark, faSpinner, faUser } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "./auth-provider";
import { toast } from "./ui/toast";

const MAX_BYTES = 3 * 1024 * 1024;

export function AvatarUploadModal({ onClose }: { onClose: () => void }) {
  const { avatarUrl, firstName, role, setAvatarUrl } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const initials = role === "superadmin" ? "SA" : role === "admin" ? "AD" : "LC";

  function pick(f: File | undefined | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Formato no soportado", "Elige una imagen (PNG, JPG, WEBP o GIF).");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("Imagen muy pesada", "El máximo es 3 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function save() {
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/perfil/avatar", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo actualizar la foto.");
      setAvatarUrl(json.avatarUrl);
      toast.success("Foto de perfil actualizada");
      onClose();
    } catch (e) {
      toast.error("No se pudo actualizar la foto", e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  const shown = preview ?? avatarUrl;

  // Portal a document.body: el header (`.glass`) usa backdrop-filter, y eso
  // convierte cualquier position:fixed dentro de él en fijo respecto al
  // header (60px) en vez de a toda la pantalla — el modal quedaba encajonado
  // arriba. Montarlo fuera del árbol del header evita ese "containing block".
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 panel border border-[#2a2a4a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-[#e4e9f5]">
            Foto de perfil
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-[#8892b0] transition-colors hover:bg-white/5 hover:text-white"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
          onClick={() => inputRef.current?.click()}
          className={`group relative mx-auto flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-2 transition-all ${
            dragging ? "ring-[#0094ff]" : "ring-[#2a2a4a] hover:ring-[#0094ff]/60"
          }`}
          style={{
            backgroundImage: shown ? undefined : "linear-gradient(135deg, var(--tab-accent), var(--tab-accent-2))",
            boxShadow: "0 0 22px var(--tab-accent-glow)",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="Foto de perfil" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-white">{initials}</span>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
            <FontAwesomeIcon icon={faCamera} className="h-5 w-5 text-white" />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[#8892b0]">
          {firstName ? `Hola, ${firstName}. ` : ""}Haz clic o arrastra una imagen (PNG, JPG, WEBP o GIF · máx. 3 MB).
        </p>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="cursor-pointer flex-1 rounded-xl border border-[#2a2a4a] bg-white/3 px-4 py-2.5 text-xs font-bold text-[#aab3cf] transition-colors hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!file || saving}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundImage: "linear-gradient(135deg, var(--tab-accent), var(--tab-accent-2))",
              boxShadow: "0 0 14px var(--tab-accent-glow)",
            }}
          >
            {saving ? <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" /> : <FontAwesomeIcon icon={faUser} className="h-3.5 w-3.5" />}
            {saving ? "Guardando..." : "Guardar foto"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
