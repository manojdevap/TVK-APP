/** Current deployment scope — municipality first, constituency expansion later */
export const municipality = {
  slug: "nandhivaram_guduvancheri",
  nameEn: "Nandhivaram Guduvancheri Municipality",
  nameTa: "நந்திவரம் குடுவாஞ்சேரி மாநகராட்சி",
  districtEn: "Chengalpattu",
  districtTa: "செங்கல்பட்டு",
  stateEn: "Tamil Nadu",
  stateTa: "தமிழ்நாடு",
  scope: "municipality" as const,
  futureScopes: ["constituency"] as const,
  /** Fixed ward count for Nandhivaram Guduvancheri Municipality */
  wardCount: 30,
} as const;
