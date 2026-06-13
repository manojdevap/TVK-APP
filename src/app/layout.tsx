import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { party } from "@/config/party";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${party.shortEn} Ward Tracker — Nandhivaram Guduvancheri`,
  description: `${party.fullLabelEn} ward management for Nandhivaram Guduvancheri Municipality — events, voters, petitions.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
