"use client";

import { LoadingBird } from "./loading-bird";

type BirdSceneProps = {
  /** Ancho del ave en px. */
  size?: number;
};

export function BirdScene({ size = 150 }: BirdSceneProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <LoadingBird size={size} />
    </div>
  );
}
