"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// Silueta del ave vectorizada desde public/birds/bird-loading.png (trazado
// con potrace, limpio del contorno/artefactos del marco que trae el trazado
// automático — solo queda el contorno real del ave, un único subpath).
const BIRD_PATH_D =
  "M 244.196 214.575 C 238.338 218.679, 231.051 240.505, 228.939 260.278 C 224.169 304.918, 248.229 353.833, 290.255 384.939 C 295.040 388.481, 298.815 391.519, 298.643 391.690 C 298.114 392.220, 275.544 385.339, 265.635 381.627 C 244.884 373.853, 228.087 365.419, 208.227 352.799 C 201.477 348.509, 195.739 345, 195.477 345 C 194.380 345, 195.114 367.390, 196.464 375.132 C 204.480 421.098, 230.272 454.862, 273.102 475.457 C 284.318 480.850, 310.053 490, 314.006 490 C 315.103 490, 316 490.403, 316 490.895 C 316 491.387, 309.137 492.104, 300.750 492.488 C 282.837 493.308, 263.841 491.985, 243.673 488.513 C 235.922 487.178, 229.433 486.233, 229.254 486.413 C 227.342 488.325, 239.002 508.291, 248.958 520.154 C 275.597 551.891, 311.981 567.916, 361.500 569.720 L 378.500 570.339 373 572.781 C 363.251 577.110, 344.507 582.856, 331.050 585.640 L 317.939 588.353 321.720 592.266 C 328.110 598.880, 342.002 608.783, 352.421 614.152 C 383.036 629.926, 415.369 633.543, 448.776 624.929 C 455.024 623.318, 460.387 622, 460.695 622 C 463.124 622, 437.453 640.043, 427.250 645.506 C 424.363 647.053, 422 648.647, 422 649.049 C 422 649.452, 425.488 650.717, 429.750 651.860 C 466.954 661.841, 506.502 657.171, 543.758 638.396 L 556.017 632.219 556.552 634.860 C 559.391 648.856, 567.565 667.078, 581.186 689.775 C 592.983 709.431, 596.344 717.162, 596.286 724.500 C 596.167 739.326, 584.719 762.405, 559.580 798.500 C 536.111 832.199, 527.691 848.059, 520.830 871.500 C 511.900 902.004, 513.390 930.466, 525.095 953 C 528.958 960.438, 533.507 966.961, 534.160 966 C 534.347 965.725, 535.960 962.575, 537.744 959 C 539.528 955.425, 546.609 943.081, 553.479 931.569 C 573.222 898.489, 584.115 876.225, 595.103 846.500 C 597.745 839.350, 599.929 833.887, 599.954 834.361 C 599.979 834.835, 597.776 845.635, 595.059 858.361 C 583.661 911.732, 581.985 933.862, 586.610 969.931 C 591.240 1006.035, 604.078 1037.846, 621.623 1056.687 C 626.806 1062.252, 626.742 1062.284, 636.135 1049.690 C 657.519 1021.022, 667.335 985.691, 667.443 937 C 667.507 908.180, 666.623 900.778, 658.304 860.500 C 655.805 848.400, 653.580 837.375, 653.360 836 C 652.946 833.412, 653.853 835.595, 662.300 857.500 C 671.999 882.652, 681.932 901.884, 704.653 939.500 C 710.633 949.400, 716.376 959.413, 717.415 961.750 C 719.781 967.073, 719.834 967.066, 723.859 960.919 C 732.632 947.517, 736.930 932.925, 737.711 913.886 C 738.726 889.152, 734.258 869.850, 721.374 843.322 C 715.390 831, 710.109 822.685, 684.974 786 C 669.242 763.039, 656.989 736.568, 656.808 725.148 C 656.699 718.268, 659.773 710.874, 670.041 693.322 C 686.703 664.838, 693.996 648.940, 696.374 635.917 L 697.028 632.334 707.764 637.852 C 745.806 657.402, 784.967 662.158, 822.750 651.816 C 827.287 650.574, 830.991 649.320, 830.980 649.029 C 830.968 648.738, 826.560 645.961, 821.184 642.857 C 812.066 637.593, 791.601 623.066, 792.308 622.359 C 792.482 622.185, 797.801 623.350, 804.129 624.948 C 842.821 634.720, 880.242 628.400, 912.939 606.572 C 921.555 600.820, 935.547 589.213, 934.784 588.451 C 934.617 588.284, 928.860 587.006, 921.991 585.610 C 908.173 582.802, 890.763 577.544, 880.311 573.020 L 873.500 570.072 884.144 570.036 C 939.199 569.850, 981.174 550.614, 1009.720 512.486 C 1014.819 505.676, 1024.732 487.399, 1023.821 486.488 C 1023.569 486.236, 1019.569 486.697, 1014.931 487.513 C 1002.959 489.620, 985.222 491.743, 973.167 492.513 C 962.029 493.223, 937 492.198, 937 491.031 C 937 490.639, 939.587 489.741, 942.750 489.035 C 958.630 485.493, 985.943 473.608, 1000.350 463.972 C 1033.890 441.539, 1055.802 402.204, 1058.547 359.500 C 1058.901 354, 1058.801 348.490, 1058.325 347.255 L 1057.459 345.009 1052.308 348.479 C 1024.832 366.982, 984.995 385.064, 957.750 391.399 C 953.822 392.312, 954.166 391.892, 962.250 385.908 C 1012.516 348.700, 1035.249 290.987, 1020.371 238.351 C 1014.881 218.932, 1007.636 209.008, 1004.829 217.062 C 993.351 249.987, 956.384 292.215, 911.214 324 C 889.569 339.231, 871.421 350.079, 822.500 377.028 C 775.668 402.827, 759.670 418.353, 722.305 474.267 C 703.200 502.855, 698.069 509.331, 690.260 514.709 C 684.017 519.010, 684.808 519.453, 676.513 507 C 669.716 496.796, 664.699 486.642, 662.432 478.500 C 659.953 469.594, 659.404 449.228, 661.413 440.651 C 662.941 434.128, 662.927 433.629, 661.111 430.151 C 660.062 428.143, 658.014 423.939, 656.558 420.810 C 653.319 413.846, 644.962 405.895, 638.267 403.407 C 635.645 402.433, 632.612 401.043, 631.527 400.318 C 628.498 398.294, 625.907 398.700, 617.551 402.508 C 607.585 407.050, 600.172 414.251, 597.152 422.325 C 595.966 425.494, 594.096 429.305, 592.997 430.794 C 591.077 433.392, 591.058 433.812, 592.499 441.338 C 595.490 456.956, 593.832 473.272, 587.770 487.875 C 585.269 493.902, 573.169 513.951, 569.966 517.377 C 568.735 518.694, 563.068 514.789, 556.765 508.281 C 548.544 499.793, 547.783 498.757, 529.737 471.500 C 492.611 415.426, 478.216 402.411, 414.461 367.269 C 324.149 317.490, 272.162 271.397, 251.217 222.536 C 247.006 212.713, 246.949 212.647, 244.196 214.575";

const VIEW = 1254;
// Pivotes de aleteo (hombro de cada ala) y radio del círculo de corte —
// mismos valores probados con el rig anterior. El corte contra el núcleo es
// un círculo centrado justo en el pivote de esa ala: al estar centrado en
// su propio eje de rotación, nunca cambia de forma al girar, así que no se
// abre un hueco ni se ve una costura sin importar el ángulo.
const LEFT_PIVOT = { x: 577, y: 502 };
const RIGHT_PIVOT = { x: 677, y: 502 };
const PIVOT_R = 190;
// El círculo del núcleo va un poco más grande que el del ala (que se resta
// de esta) para que el núcleo se monte encima del borde y tape la línea de
// antialiasing que queda justo donde los dos radios coinciden exacto.
const CORE_PIVOT_R = PIVOT_R + 14;
// Cada ala solo llega hasta esta altura (nunca el cuerpo/cola de abajo, que
// vive únicamente en el núcleo).
const WING_Y_MAX = VIEW * 0.58;
// Franja central que ocupa el núcleo (cuerpo + cola), de ancho completo.
const CORE_X0 = VIEW * 0.4;
const CORE_W = VIEW * 0.2;

const FILL_DURATION = 1.1;

export function BirdSvg({ size }: { size: number }) {
  const wingLeftRef = useRef<SVGGElement>(null);
  const wingRightRef = useRef<SVGGElement>(null);
  const floatRef = useRef<SVGGElement>(null);
  const revealRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    const reveal = revealRef.current;
    const float = floatRef.current;
    const wingLeft = wingLeftRef.current;
    const wingRight = wingRightRef.current;
    if (!reveal || !float || !wingLeft || !wingRight) return;

    // Entrada tipo "reloj de arena": se revela de abajo hacia arriba, una
    // sola vez (no es un adorno que se repite).
    gsap.set(reveal, { attr: { y: VIEW, height: 0 } });
    const fill = gsap.to(reveal, { attr: { y: 0, height: VIEW }, duration: FILL_DURATION, ease: "power1.inOut" });

    // Flotado de todo el conjunto.
    const floatTl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut", duration: 1.3 } });
    floatTl.to(float, { y: 14 }, 0);

    // Aleteo real de cada ala en su propio pivote — arranca justo cuando
    // termina la revelación (antes se vería un pedacito recién aparecido
    // moviéndose junto al hombro, no un aleteo real). Izquierda y derecha
    // usan signo contrario porque son espejo una de otra: así suben y
    // bajan sincronizadas en vez de en sube-baja. Bajada más marcada que
    // la subida, como el golpe de vuelo real de un ave.
    //
    // Nada de CSS `transform`/`transform-origin`: en SVG con `mask` se
    // desalinea (el ala termina girando alrededor del punto equivocado, no
    // del pivote). Se anima el ATRIBUTO `transform="rotate(a cx cy)"`
    // directo — ese sí gira exactamente donde se le indica — tweeneando un
    // número simple y escribiéndolo en cada frame.
    const leftState = { angle: -6 };
    const rightState = { angle: 6 };
    const applyLeft = () => wingLeft.setAttribute("transform", `rotate(${leftState.angle} ${LEFT_PIVOT.x} ${LEFT_PIVOT.y})`);
    const applyRight = () => wingRight.setAttribute("transform", `rotate(${rightState.angle} ${RIGHT_PIVOT.x} ${RIGHT_PIVOT.y})`);
    applyLeft();
    applyRight();
    const flapLeft = gsap.to(leftState, {
      angle: 16,
      duration: 0.95,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: FILL_DURATION,
      onUpdate: applyLeft,
    });
    const flapRight = gsap.to(rightState, {
      angle: -16,
      duration: 0.95,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: FILL_DURATION,
      onUpdate: applyRight,
    });

    return () => {
      fill.kill();
      floatTl.kill();
      flapLeft.kill();
      flapRight.kill();
    };
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id="bird-reveal-mask">
          <rect ref={revealRef} x={0} width={VIEW} fill="white" />
        </mask>
        <mask id="bird-core-mask">
          <rect width={VIEW} height={VIEW} fill="black" />
          <rect x={CORE_X0} width={CORE_W} height={VIEW} fill="white" />
          <circle cx={LEFT_PIVOT.x} cy={LEFT_PIVOT.y} r={CORE_PIVOT_R} fill="white" />
          <circle cx={RIGHT_PIVOT.x} cy={RIGHT_PIVOT.y} r={CORE_PIVOT_R} fill="white" />
        </mask>
        <mask id="bird-wing-left-mask">
          <rect width={VIEW / 2} height={WING_Y_MAX} fill="white" />
          <circle cx={LEFT_PIVOT.x} cy={LEFT_PIVOT.y} r={PIVOT_R} fill="black" />
        </mask>
        <mask id="bird-wing-right-mask">
          <rect x={VIEW / 2} width={VIEW / 2} height={WING_Y_MAX} fill="white" />
          <circle cx={RIGHT_PIVOT.x} cy={RIGHT_PIVOT.y} r={PIVOT_R} fill="black" />
        </mask>
      </defs>
      <g ref={floatRef}>
        <g mask="url(#bird-reveal-mask)">
          <g ref={wingLeftRef} mask="url(#bird-wing-left-mask)">
            <path d={BIRD_PATH_D} fill="white" />
          </g>
          <g ref={wingRightRef} mask="url(#bird-wing-right-mask)">
            <path d={BIRD_PATH_D} fill="white" />
          </g>
          <g mask="url(#bird-core-mask)">
            <path d={BIRD_PATH_D} fill="white" />
          </g>
        </g>
      </g>
    </svg>
  );
}
