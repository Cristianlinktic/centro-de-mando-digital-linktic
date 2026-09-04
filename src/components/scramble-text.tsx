"use client";

import { useLayoutEffect, useState } from "react";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÑ0123456789";

const randomScramble = (text: string) =>
  text
    .split("")
    .map((ch) => (ch === " " ? " " : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]))
    .join("");

/**
 * Texto que "decodifica" de caracteres aleatorios al texto real, de
 * izquierda a derecha, tras un delay. Usado en la intro del login.
 */
export function ScrambleText({
  text,
  startDelay = 0,
  duration = 550,
  className,
}: {
  text: string;
  startDelay?: number;
  duration?: number;
  className?: string;
}) {
  // Estado inicial DETERMINISTA (el texto real, sin Math.random) para que
  // coincida entre servidor y cliente — evita un error de hidratación. El
  // scramble aleatorio arranca recién en el efecto (solo cliente).
  const [display, setDisplay] = useState(text);

  useLayoutEffect(() => {
    setDisplay(randomScramble(text));

    let raf = 0;
    let start: number | null = null;

    const timeoutId = setTimeout(() => {
      const tick = (now: number) => {
        if (start === null) start = now;
        const progress = Math.min(1, (now - start) / duration);
        const locked = Math.floor(progress * text.length);
        setDisplay(
          text
            .split("")
            .map((ch, i) => {
              if (ch === " ") return " ";
              if (i < locked) return ch;
              return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            })
            .join(""),
        );
        if (progress < 1) raf = requestAnimationFrame(tick);
        else setDisplay(text);
      };
      raf = requestAnimationFrame(tick);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <span className={className}>{display}</span>;
}
