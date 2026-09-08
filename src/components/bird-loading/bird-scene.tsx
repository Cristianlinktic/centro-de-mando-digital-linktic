"use client";

import { RiggedBird } from "./rigged-bird";
import { LoadingRing } from "./loading-ring";

type BirdSceneProps = {
  /** Ancho del ave en px; el anillo se escala proporcionalmente. */
  size?: number;
};

export function BirdScene({ size = 150 }: BirdSceneProps) {
  const ringSize = size * 1.55;

  return (
    <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
      <LoadingRing size={ringSize} />
      <RiggedBird size={size} />
    </div>
  );
}
