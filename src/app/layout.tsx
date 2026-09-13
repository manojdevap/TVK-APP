import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Tamil } from "next/font/google";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import { party } from "@/config/party";
import "./globals.css";

const sans = Noto_Sans({
  variable: "--font-app-sans-latin",
  subsets: ["latin"],
  display: "swap",
});

const tamil = Noto_Sans_Tamil({
  variable: "--font-app-sans-tamil",
  subsets: ["tamil"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${party.shortEn} Nandhivaram Guduvancheri Municipality`,
  description:
    "Members, events and petitions for Nandhivaram Guduvancheri Municipality.",
  applicationName: `${party.shortEn} Nandhivaram Guduvancheri Municipality`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    // Shown under the icon once installed, where only a few characters fit
    title: party.shortEn,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: party.colors.maroon,
  width: "device-width",
  initialScale: 1,
  // Let people pinch-zoom; locking it out fails WCAG and helps nobody.
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${sans.variable} ${tamil.variable}`}>
      <body className="font-sans">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
