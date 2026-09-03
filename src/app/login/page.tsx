"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { LinkyIcon } from "@/components/linky-icon";

const initialState: AuthState = {
  error: null,
};

export default function LoginPage() {
  // useActionState requiere que el tipo de initialState coincida con el retorno de la acción
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <div className="h-screen w-full page-bg flex items-center justify-center font-sans antialiased relative overflow-hidden">
      {isPending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#03060d]/90 backdrop-blur-sm">
          <div className="loading-ring w-40 h-40 flex items-center justify-center">
            <LinkyIcon className="h-20 w-auto drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]" />
          </div>
          <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold animate-pulse">
            Validando acceso...
          </p>
        </div>
      )}

      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <LinkyIcon
          fly
          className="absolute left-[-4rem] bottom-[-3rem] h-[85vh] w-auto opacity-25 drop-shadow-[0_0_60px_rgba(59,130,246,0.4)]"
        />
      </div>

      <div
        className="neon-frame glass border rounded-3xl p-10 w-full max-w-md flex flex-col items-center z-10"
        style={{ background: "linear-gradient(180deg, hsl(222 40% 11% / 0.5), hsl(222 44% 7% / 0.5))" }}
      >
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-blue-500/20">
          <span className="text-3xl font-bold drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] text-white">LT</span>
        </div>

        <h1 className="text-2xl font-black mb-1 tracking-tight gradient-text text-glow-blue">Centro de Mando Digital LinkTIC</h1>
        <p className="text-slate-400 mb-8 text-center text-sm">Ingresa tus credenciales para acceder al Centro de Mando Digital LinkTIC</p>
        
        <form action={formAction} className="w-full space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold px-1">Usuario</label>
            <div className="relative">
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <Input 
                name="email"
                type="text" 
                placeholder="Ej: admin_linktic"
                required
                autoComplete="username"
                className="pl-10 h-12 bg-[#161d2b] border-white/10 text-white rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold px-1">Contraseña</label>
            <div className="relative">
              <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <Input 
                name="password"
                type="password" 
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="pl-10 h-12 bg-[#161d2b] border-white/10 text-white rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all font-mono"
              />
            </div>
          </div>
          
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              <p className="text-red-400 text-xs font-semibold text-center">{state.error}</p>
            </div>
          )}
          
          <Button 
              type="submit" 
              disabled={isPending}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 transition-all mt-4"
          >
            {isPending ? "Validando..." : "Ingresar al Tablero"}
          </Button>
        </form>
        
        <div className="mt-8 text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium opacity-50">
          SISTEMA DE SEGURIDAD LINKTIC
        </div>
      </div>
    </div>
  );
}
