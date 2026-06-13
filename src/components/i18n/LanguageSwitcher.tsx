"use client";

import { usePathname, useRouter } from "next/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(next: Locale) {
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
  }

  return (
    <div className="flex gap-1 rounded-lg bg-tvk-maroon p-1">
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
            locale === loc
              ? "bg-tvk-yellow text-tvk-maroon-dark"
              : "text-white/70 hover:text-tvk-yellow"
          }`}
        >
          {localeLabels[loc]}
        </button>
      ))}
    </div>
  );
}
