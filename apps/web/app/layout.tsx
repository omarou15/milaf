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
      <html lang="fr" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: `
            try {
              var t = localStorage.getItem('milaf_theme');
              if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            } catch {}
          ` }} />
        </head>
        <body className="min-h-[100dvh] bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
