import type { MetadataRoute } from "next";
import { party } from "@/config/party";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${party.shortEn} Nandhivaram Guduvancheri Municipality`,
    // Truncated hard under a home screen icon, so this stays to the recognisable part
    short_name: party.shortEn,
    description:
      "Members, events and petitions for Nandhivaram Guduvancheri Municipality.",
    id: "/",
    start_url: "/en",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f2ef",
    theme_color: party.colors.maroon,
    lang: "en",
    dir: "ltr",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
