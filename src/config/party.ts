import type { Locale } from "@/i18n/config";

/** Tamilaga Vettri Kazhagam (TVK) */
export const party = {
  nameEn: "Tamilaga Vettri Kazhagam",
  nameTa: "தமிழக வெற்றிக் கழகம்",
  shortEn: "TVK",
  shortTa: "தவெக",
  fullLabelEn: "Tamilaga Vettri Kazhagam (TVK)",
  fullLabelTa: "தமிழக வெற்றிக் கழகம் (தவெக)",
  emblem: "/tvk-emblem.png",
  taglineEn: "Victory for Tamil Nadu",
  taglineTa: "தமிழக வெற்றிக்காக",
  colors: {
    maroon: "#7A1F2B",
    maroonDark: "#5C1520",
    yellow: "#F4C430",
    yellowLight: "#FFE566",
    green: "#1B7A4E",
    blue: "#1E5AA8",
  },
} as const;

export function partyShort(locale: Locale): string {
  return locale === "ta" ? party.shortTa : party.shortEn;
}

export function partyName(locale: Locale, compact = false): string {
  if (compact) return partyShort(locale);
  return locale === "ta" ? party.nameTa : party.nameEn;
}

export function partyFullLabel(locale: Locale): string {
  return locale === "ta" ? party.fullLabelTa : party.fullLabelEn;
}
