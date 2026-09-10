"use client";

import { useActionState, useLayoutEffect, useState } from "react";
import { signIn, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { LinkyIcon } from "@/components/linky-icon";
import { ScrambleText } from "@/components/scramble-text";
import { BackdropOrbs } from "@/components/backdrop-orbs";

const initialState: AuthState = {
  error: null,
};

// Palabras distribuidas a los lados durante la intro, cada una "decodificándose"
// de caracteres aleatorios al texto real (estilo locomotive.ca).
const WORDS_LEFT = ["Innovación", "Tecnología", "Proyectos"];
const WORDS_RIGHT = ["Estrategia", "Comunicaciones", "Redes Sociales"];
const WORD_START_MS = 350; // cuándo arranca la primera línea de cada grupo
const WORD_STAGGER_MS = 220; // entre una línea y la siguiente del mismo grupo
const WORD_DECODE_MS = 550; // debe coincidir con el duration por defecto de ScrambleText
const WORDS_END_MS =
  WORD_START_MS + (Math.max(WORDS_LEFT.length, WORDS_RIGHT.length) - 1) * WORD_STAGGER_MS + WORD_DECODE_MS;

const LINKTIC_START_MS = WORDS_END_MS - 150; // arranca un poco antes de que las palabras terminen
const LETTER_STAGGER_MS = 50;
const LETTER_DURATION_MS = 380; // debe coincidir con .intro-letter en globals.css
const LINKTIC_END_MS = LINKTIC_START_MS + ("LinkTIC".length - 1) * LETTER_STAGGER_MS + LETTER_DURATION_MS;

const INTRO_HOLD_MS = LINKTIC_END_MS + 300; // hasta que empieza a salir
const INTRO_EXIT_MS = 750; // duración de la salida

type IntroPhase = "intro" | "exiting" | "hidden";

export default function LoginPage() {
  // useActionState requiere que el tipo de initialState coincida con el retorno de la acción
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [introPhase, setIntroPhase] = useState<IntroPhase>("intro");

  // La intro se reproduce SIEMPRE que carga la página (incluyendo recargas):
  // el servidor no tiene forma de saber si ya se mostró antes (no hay acceso
  // a sessionStorage durante el render en el servidor), así que si el cliente
  // la saltara condicionalmente se vería un parpadeo (el HTML del servidor
  // pinta la intro completa un instante antes de que React la esconda). Solo
  // se salta por accesibilidad (prefers-reduced-motion), decidido ANTES del
  // primer paint con useLayoutEffect para no mostrar ese parpadeo.
  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setIntroPhase("hidden");
      return;
    }
    const exitTimer = setTimeout(() => setIntroPhase("exiting"), INTRO_HOLD_MS);
    const hideTimer = setTimeout(() => setIntroPhase("hidden"), INTRO_HOLD_MS + INTRO_EXIT_MS);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-background page-bg flex items-center justify-center font-sans antialiased relative overflow-x-hidden py-10 px-4">
      <BackdropOrbs grid />
      {introPhase !== "hidden" && (
        <div
          className={`fixed inset-0 z-[60] flex items-center justify-center overflow-hidden well transition-opacity duration-700 ease-in ${introPhase === "exiting" ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
        >
          {/* Palabras a la izquierda: al salir, se deslizan más hacia la izquierda mientras se desvanecen. */}
          <div
            className={`absolute left-[6%] top-[20%] flex flex-col items-start gap-1.5 text-left transition-all duration-500 ease-in sm:left-[10%] ${introPhase === "exiting" ? "opacity-0 -translate-x-10" : "opacity-100 translate-x-0"
              }`}
          >
            {WORDS_LEFT.map((word, i) => (
              <ScrambleText
                key={word}
                text={word}
                startDelay={WORD_START_MS + i * WORD_STAGGER_MS}
                duration={WORD_DECODE_MS}
                className="whitespace-nowrap text-lg font-semibold text-[#aab3cf] sm:text-2xl"
              />
            ))}
          </div>

          {/* Palabras a la derecha: al salir, se deslizan más hacia la derecha mientras se desvanecen. */}
          <div
            className={`absolute right-[6%] bottom-[20%] flex flex-col items-end gap-1.5 text-right transition-all duration-500 ease-in sm:right-[10%] ${introPhase === "exiting" ? "opacity-0 translate-x-10" : "opacity-100 translate-x-0"
              }`}
          >
            {WORDS_RIGHT.map((word, i) => (
              <ScrambleText
                key={word}
                text={word}
                startDelay={WORD_START_MS + i * WORD_STAGGER_MS}
                duration={WORD_DECODE_MS}
                className="whitespace-nowrap text-lg font-semibold text-[#aab3cf] sm:text-2xl"
              />
            ))}
          </div>

          <div
            className={`flex flex-col items-center gap-4 transition-all duration-700 ease-in ${introPhase === "exiting"
              ? "opacity-0 scale-75 -translate-x-28 translate-y-20"
              : "opacity-100 scale-100 translate-x-0 translate-y-0"
              }`}
          >
            <LinkyIcon className="intro-bird-enter h-24 w-auto drop-shadow-[0_0_40px_rgba(0,148,255,0.6)]" />
            <div className="flex flex-col items-center gap-1">
              <span className="intro-fade text-[11px] uppercase tracking-[0.35em] text-[#aab3cf] font-bold">
                Centro de Mando Digital
              </span>
              <h2 className="font-heading flex text-4xl font-semibold gradient-text text-glow-blue">
                {"LinkTIC".split("").map((ch, i) => (
                  <span
                    key={i}
                    className="intro-letter"
                    style={{ animationDelay: `${LINKTIC_START_MS + i * LETTER_STAGGER_MS}ms` }}
                  >
                    {ch}
                  </span>
                ))}
              </h2>
            </div>
          </div>
        </div>
      )}

      {isPending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 well">
          <div className="loading-ring w-40 h-40 flex items-center justify-center">
            <LinkyIcon className="h-20 w-auto drop-shadow-[0_0_30px_rgba(0,148,255,0.5)]" />
          </div>
          <p className="text-[#aab3cf] text-[10px] uppercase tracking-[0.2em] font-bold animate-pulse">
            Validando acceso...
          </p>
        </div>
      )}

      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <LinkyIcon
          fly
          className="absolute left-[-1.5rem] bottom-[-1rem] w-[65vw] h-auto opacity-25 drop-shadow-[0_0_60px_rgba(0,148,255,0.4)] sm:left-[-4rem] sm:bottom-[-3rem] sm:h-[85vh] sm:w-auto"
        />
      </div>

      <div className="neon-frame glass-strong rounded-3xl p-6 sm:p-10 w-full max-w-md flex flex-col items-center z-10">
        <h1 className="font-heading text-xl sm:text-2xl font-semibold mb-1 tracking-tight gradient-text text-glow-blue text-center break-words">Centro de Mando Digital LinkTIC</h1>
        <p className="text-[#aab3cf] mb-8 text-center text-sm">Ingresa tus credenciales para acceder</p>

        <form action={formAction} className="w-full space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest font-bold px-1">Usuario</label>
            <div className="relative">
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 text-white w-4 h-4" />
              <Input
                name="email"
                type="text"
                placeholder="Ej: admin_linktic"
                required
                autoComplete="username"
                className="input-glass pl-10 h-12 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest font-bold px-1">Contraseña</label>
            <div className="relative">
              <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-white w-4 h-4" />
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="input-glass pl-10 h-12 text-white font-mono"
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
            variant="neon"
            disabled={isPending}
            className="w-full h-12 mt-4"
          >
            {isPending ? "Validando..." : "Ingresar al Tablero"}
          </Button>
        </form>
      </div>
    </div>
  );
}
