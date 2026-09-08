"use client";

import styles from "./loading-ring.module.css";

type LoadingRingProps = {
  size: number;
};

export function LoadingRing({ size }: LoadingRingProps) {
  return (
    <div aria-hidden className={styles.wrap} style={{ width: size, height: size }}>
      <div className={`${styles.layer} ${styles.glow}`} />
      <div className={`${styles.layer} ${styles.trail}`} />
      <div className={`${styles.layer} ${styles.track}`} />
      <div className={`${styles.layer} ${styles.orbitWrap}`}>
        <div className={styles.orbitDot} />
      </div>
    </div>
  );
}
