import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout-wrapper";

// Nexa — la tipografía de texto del LinkTIC Future Forum. Se auto-hospeda
// desde los mismos archivos que sirve linktic.com. Solo existen dos pesos
// (400 y 700): `font-medium` cae a 400 y `font-semibold` sube a 700.
const nexa = localFont({
  src: [
    { path: "../fonts/nexa-regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/nexa-regular.woff", weight: "400", style: "normal" },
    { path: "../fonts/Nexa-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/Nexa-Bold.woff", weight: "700", style: "normal" },
  ],
  variable: "--font-nexa",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

// Clash Display — reservada para los títulos grandes y las cifras destacadas.
// Variable, así que cubre todo el rango 400–700 de forma nativa.
const clashDisplay = localFont({
  src: [
    { path: "../fonts/ClashDisplay-Variable.woff2", style: "normal" },
    { path: "../fonts/ClashDisplay-Variable.woff", style: "normal" },
  ],
  weight: "400 700",
  variable: "--font-clash",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Centro de Mando Digital LinkTIC",
  description:
    "Tablero de gestión de contenidos y narrativa del Centro de Mando Digital LinkTIC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${nexa.variable} ${clashDisplay.variable} h-full antialiased`}
    >
      <body className="h-full bg-background text-foreground">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
