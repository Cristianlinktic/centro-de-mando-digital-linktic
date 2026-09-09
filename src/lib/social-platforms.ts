import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faInstagram, faFacebook, faTiktok } from "@fortawesome/free-brands-svg-icons";

/**
 * Redes sociales de "Conversación en Redes", todas alimentadas por la misma
 * cuenta de Windsor.ai (WINDSOR_API_KEY) a través de un conector distinto
 * por red (`connectors.windsor.ai/<platform>`). Instagram ya tiene datos
 * reales; Facebook y TikTok quedan con la misma estructura lista para el
 * día que se conecten esas cuentas en Windsor.
 */
export type SocialPlatform = "instagram" | "facebook" | "tiktok";

export const SOCIAL_PLATFORM_ORDER: SocialPlatform[] = ["instagram", "facebook", "tiktok"];

export interface PlatformConfig {
  key: SocialPlatform;
  label: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  icon: IconDefinition;
  /** A quién le pertenece la política de privacidad de la red (para el disclaimer del pie). */
  disclaimerOwner: string;
}

export const SOCIAL_PLATFORMS: Record<SocialPlatform, PlatformConfig> = {
  instagram: {
    key: "instagram",
    label: "Instagram",
    accent: "#E1306C",
    accentBg: "#2a1020",
    accentBorder: "rgba(225,48,108,0.2)",
    icon: faInstagram,
    disclaimerOwner: "Meta",
  },
  facebook: {
    key: "facebook",
    label: "Facebook",
    accent: "#1877F2",
    accentBg: "#0f1f33",
    accentBorder: "rgba(24,119,242,0.25)",
    icon: faFacebook,
    disclaimerOwner: "Meta",
  },
  tiktok: {
    key: "tiktok",
    label: "TikTok",
    accent: "#FE2C55",
    accentBg: "#2a0f18",
    accentBorder: "rgba(254,44,85,0.25)",
    icon: faTiktok,
    disclaimerOwner: "TikTok",
  },
};
