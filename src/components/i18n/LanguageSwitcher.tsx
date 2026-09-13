"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === locale) return;
    const segments = pathname.split("/");
    segments[1] = next;
    const query = params.toString();
    router.replace(`${segments.join("/")}${query ? `?${query}` : ""}`);
  }

  return (
    <div className="flex gap-2" role="group">
      {locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            aria-pressed={active}
            className={`min-h-11 flex-1 rounded-xl border text-sm font-medium transition ${
              active
                ? "border-maroon bg-yellow-soft text-maroon-dark"
                : "border-border bg-surface text-muted"
            }`}
          >
            {localeLabels[code]}
          </button>
        );
      })}
    </div>
  );
}
