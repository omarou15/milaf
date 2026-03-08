import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 1,
  userScalable: false, themeColor: "#1A1B2E",
};

export const metadata: Metadata = {
  title: "Mi-Laf — ملف | Génération documentaire automatisée",
  description: "Le moteur universel de génération et d'automatisation documentaire",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Mi-Laf" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="fr" className="dark">
        <body className="min-h-[100dvh] bg-[#06070c] text-[#eceef5] overflow-hidden antialiased" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
