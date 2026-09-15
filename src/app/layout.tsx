import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import EmergencyFab from "@/components/EmergencyFab";
import MobileQuickBar from "@/components/MobileQuickBar";
import A11yBar from "@/components/A11yBar";
import DemoBar from "@/components/DemoBar";
import OfflineBanner from "@/components/OfflineBanner";
import SwRegister from "@/components/SwRegister";
import BootSequence from "@/components/cinematic/BootSequence";

const SITE_URL = "https://drishti-ai-command-center.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "DRISHTI-X | AI Disaster Intelligence Command Center",
    template: "%s | DRISHTI-X",
  },
  description:
    "DRISHTI-X — Sovereign AI-powered disaster intelligence platform with real-time satellite Earth observation, autonomous drone mesh networking, 3D digital elevation twin, and citizen safety tools built for mission-critical operations.",
  keywords: [
    "AI disaster management",
    "satellite earth observation",
    "drone SAR search rescue",
    "digital twin",
    "geospatial intelligence",
    "flood prediction",
    "emergency response",
    "Next.js WebGL Three.js",
    "DRISHTI-X command center",
    "India disaster resilience",
  ],
  authors: [{ name: "Muchakarla Hemanth Kumar", url: SITE_URL }],
  creator: "Muchakarla Hemanth Kumar",
  publisher: "DRISHTI-X",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "DRISHTI-X | AI Disaster Intelligence Command Center",
    description:
      "Next-generation AI command platform with satellite EO, autonomous drone mesh, 3D digital twin, and life-saving citizen evacuation intelligence.",
    siteName: "DRISHTI-X",
    images: [
      {
        url: `${SITE_URL}/poster.jpg`,
        width: 1200,
        height: 630,
        alt: "DRISHTI-X AI Command Center — For a Safer, Stronger, Resilient India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DRISHTI-X | AI Disaster Intelligence Command Center",
    description:
      "Sovereign AI disaster intelligence: satellite EO, drone SAR, 3D digital twin, real-time evacuation intelligence.",
    images: [`${SITE_URL}/poster.jpg`],
    creator: "@drishti_x",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/icon.svg",
  },
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
        <BootSequence />
        <div id="main" className="pb-14 md:pb-0">
          {children}
        </div>
        <EmergencyFab />
        <MobileQuickBar />
        <A11yBar />
        <DemoBar />
        <SwRegister />
      </body>
    </html>
  );
}
