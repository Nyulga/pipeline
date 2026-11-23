import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeToggle, themeInitScript } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Pipeline",
  description: "CRM de prospection",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${jakarta.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="fixed top-3 right-3 z-50">
          <ThemeToggle />
        </div>
        {children}
        {/* Sur téléphone, le message « Annuler » passe au-dessus de la barre d'onglets et de « + Ajouter » (lot 11). */}
        <Toaster position="bottom-center" mobileOffset={{ bottom: "calc(8.75rem + env(safe-area-inset-bottom))" }} />
      </body>
    </html>
  );
}
