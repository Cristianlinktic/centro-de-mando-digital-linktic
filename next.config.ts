import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empaqueta solo el runtime y las dependencias realmente usadas: la imagen
  // del contenedor baja de ~2 GB a un par de cientos de MB.
  output: "standalone",
};

export default nextConfig;
