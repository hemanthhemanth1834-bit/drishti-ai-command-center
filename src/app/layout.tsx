import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import EmergencyFab from "@/components/EmergencyFab";
import MobileQuickBar from "@/components/MobileQuickBar";
import A11yBar from "@/components/A11yBar";
import OfflineBanner from "@/components/OfflineBanner";
import SwRegister from "@/components/SwRegister";

export const metadata: Metadata = {
  title: "DRISHTI-X Command Center",
  description: "Offline sovereign drone mesh HUD — Next.js + FastAPI + WebSockets",
  manifest: "/manifest.json",
  themeColor: "#020b14",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-[#00d2ff] focus:text-black focus:px-3 focus:py-1 text-xs font-bold"
        >
          Skip to content
        </a>
        <OfflineBanner />
        <div id="main" className="pb-14 md:pb-0">
          {children}
        </div>
        <EmergencyFab />
        <MobileQuickBar />
        <A11yBar />
        <SwRegister />
      </body>
    </html>
  );
}
