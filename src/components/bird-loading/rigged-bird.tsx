"use client";

import styles from "./rigged-bird.module.css";

// Source canvas the layers were cut from (bird-new.png, 1024x709) — pivots
// are expressed as % of this box so they scale with size.
const CANVAS_W = 1024;
const CANVAS_H = 709;
const LEFT_PIVOT = { x: (361 / CANVAS_W) * 100, y: (165 / CANVAS_H) * 100 };
const RIGHT_PIVOT = { x: (664 / CANVAS_W) * 100, y: (165 / CANVAS_H) * 100 };
const TAIL_PIVOT = { x: (513 / CANVAS_W) * 100, y: (560 / CANVAS_H) * 100 };

type RiggedBirdProps = {
  size: number;
};

export function RiggedBird({ size }: RiggedBirdProps) {
  const height = size * (CANVAS_H / CANVAS_W);

  return (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{
        width: size,
        height,
        filter: "drop-shadow(0 6px 10px rgba(15, 40, 30, 0.25))",
      }}
    >
      <div className={styles.rig}>
        <img src="/birds/bird-rig-core.png" alt="" draggable={false} className={styles.layer} />
        <img
          src="/birds/bird-rig-tail.png"
          alt=""
          draggable={false}
          className={`${styles.layer} ${styles.tail}`}
          style={{ transformOrigin: `${TAIL_PIVOT.x}% ${TAIL_PIVOT.y}%` }}
        />
        <img
          src="/birds/bird-rig-wing-left.png"
          alt=""
          draggable={false}
          className={`${styles.layer} ${styles.wingLeft}`}
          style={{ transformOrigin: `${LEFT_PIVOT.x}% ${LEFT_PIVOT.y}%` }}
        />
        <img
          src="/birds/bird-rig-wing-right.png"
          alt=""
          draggable={false}
          className={`${styles.layer} ${styles.wingRight}`}
          style={{ transformOrigin: `${RIGHT_PIVOT.x}% ${RIGHT_PIVOT.y}%` }}
        />
      </div>
    </div>
  );
}
