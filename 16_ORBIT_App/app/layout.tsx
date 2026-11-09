import type { Metadata, Viewport } from "next";
import NavBar from "@/components/NavBar";
import CommandPalette from "@/components/CommandPalette";
import ConversationUpdateBootstrap from "@/components/ConversationUpdateBootstrap";
import { StudioBrainProvider } from "@/contexts/StudioBrainContext";
import { WorkModeProvider } from "@/contexts/WorkModeContext";
import "./globals.css";
import "./responsive-v2.css";

export const metadata: Metadata = {
  title: "Centre de commande 24March",
  description: "Le cockpit créatif de 24March Studio, propulsé par ORBIT.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e5e4e1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="orbit-shell">
        <div className="app-backdrop" aria-hidden="true" />
        <WorkModeProvider>
          <StudioBrainProvider>
            <ConversationUpdateBootstrap />
            <NavBar />
            <main className="orbit-main min-h-screen px-4 pb-16 pt-6 sm:px-6 md:ml-64 md:px-8 md:py-10 lg:px-10">
              <div className="mx-auto w-full max-w-[1440px]">{children}</div>
            </main>
            <CommandPalette />
          </StudioBrainProvider>
        </WorkModeProvider>
        </div>
      </body>
    </html>
  );
}
