"use client";

/**
 * Muestra la bandera del país a partir de su código ISO-2 (vía flagcdn.com).
 * Si el código no es ISO-2 válido (ej. departamentos, entradas temporales),
 * cae al texto del código para no perder la referencia.
 */
export function Flag({
  code,
  className = "h-4 w-auto",
  showCodeFallback = true,
}: {
  code?: string;
  className?: string;
  showCodeFallback?: boolean;
}) {
  const c = (code || "").toLowerCase().trim();
  const isIso2 = /^[a-z]{2}$/.test(c);

  if (!isIso2) {
    return showCodeFallback ? (
      <span className="font-mono text-[#8892b0]">{code}</span>
    ) : null;
  }

  return (
    <img
      src={`https://flagcdn.com/w80/${c}.png`}
      alt={code}
      loading="lazy"
      className={`${className} rounded-sm object-cover`}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
