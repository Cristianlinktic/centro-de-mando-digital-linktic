"use client";

import { BirdSvg } from "./bird-svg";

type LoadingBirdProps = {
  size: number;
};

export function LoadingBird({ size }: LoadingBirdProps) {
  return (
    <div aria-hidden style={{ width: size, height: size, filter: "drop-shadow(0 0 26px rgba(0, 148, 255, 0.55))" }}>
      <BirdSvg size={size} />
    </div>
  );
}
