import type { Metadata, Viewport } from "next";
import NavBar from "@/components/NavBar";
import CommandPalette from "@/components/CommandPalette";
import "./globals.css";
import "./responsive-v2.css";

export const metadata: Metadata = {
  title: "Centre de commande 24March",
  description: "Le cockpit créatif de 24March Studio, propulsé par ORBIT.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f1e9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <NavBar />
        <main className="min-h-screen px-4 pb-28 pt-20 sm:px-5 lg:ml-[224px] lg:px-6 lg:pb-10 lg:pt-6">
          <div className="mx-auto w-full max-w-[1320px]">{children}</div>
        </main>
        <CommandPalette />
      </body>
    </html>
  );
}
