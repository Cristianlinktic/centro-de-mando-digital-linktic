import { signOut } from "@/app/actions/auth";
import { BackdropOrbs } from "@/components/backdrop-orbs";

export default function SinAccesoPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6 bg-background text-white px-6 text-center relative overflow-hidden">
      <BackdropOrbs grid />
      <div className="relative z-10 flex flex-col items-center gap-5 max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-rose-400"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-2xl font-black">Sin acceso a este tablero</h1>
        <p className="text-sm text-[#aab3cf]">
          Tu cuenta está activa pero todavía no tiene pantallas asignadas en este
          panel. Solicita acceso al administrador para poder ingresar.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[#2a2a4a] px-5 py-2.5 text-sm font-bold transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
