/** Croquis del contorno de Colombia — silueta real, simplificada a partir de
 *  la misma geometría (public/world.topojson) que usa el globo. Se dibuja
 *  como trazo (no relleno) para calzar con el resto de íconos del sidebar
 *  (Lucide, stroke-based, 24x24). */
export function ColombiaIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M19.5,15.78 L19.03,15.2 L18.27,15.24 L15.88,15.98 L16.56,16.59 L15.61,16.66 L16.16,18.01 L16.32,19.26 L15.15,22 L15.57,20.71 L13.88,20.24 L12.75,20.35 L11.1,18.89 L10.13,17.99 L8.98,17.52 L7.84,16.82 L6.44,16.84 L5.9,16.33 L4.5,15.24 L4.9,14.52 L5.81,13.99 L6.8,12.56 L6.58,11.55 L6.57,10.09 L5.87,8.38 L6.43,7.87 L6.37,6.77 L7.16,6.63 L8.6,5.63 L8.84,4.18 L10.33,3.58 L11.4,3.42 L12.86,2.52 L13.9,2 L13.98,2.74 L12.87,3.57 L12.03,4.39 L11.54,5.99 L12.34,6.65 L12.71,7.42 L12.6,8.14 L13.21,8.67 L15.52,8.71 L16.89,9.64 L18.49,9.57 L18.71,10.45 L18.33,11.75 L18.93,12.94 L18.35,13.84 L19.12,14.55 L19.5,15.78 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
