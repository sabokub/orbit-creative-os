import type { Metadata, Viewport } from "next";
import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "24March Command Center",
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
        <main className="min-h-screen px-4 pb-28 pt-20 sm:px-6 lg:ml-[248px] lg:px-8 lg:pb-12 lg:pt-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </body>
    </html>
  );
}
