import Link from "next/link";
import Image from "next/image";
import { party } from "@/config/party";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * Compact header. The app is used one-handed on a phone, so the title bar stays
 * short and navigation lives at the bottom where a thumb reaches.
 */
export function AppHeader({
  locale,
  dict,
  title,
  backHref,
  action,
}: {
  locale: Locale;
  dict: Dictionary;
  title?: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-border bg-maroon text-white"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex min-h-14 max-w-lg items-center gap-2 px-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={dict.common.back}
            className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/90 active:bg-white/10"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        ) : (
          <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2">
            <Image
              src={party.emblem}
              alt=""
              width={32}
              height={32}
              className="rounded-full bg-white"
              priority
            />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          {title ? (
            <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
          ) : (
            <>
              {/* The municipality name is long, so it wraps rather than being cut off */}
              <h1 className="line-clamp-2 text-sm font-semibold leading-tight">
                {dict.app.name}
              </h1>
              <p className="truncate text-[11px] leading-tight text-white/70">
                {dict.app.subtitle}
              </p>
            </>
          )}
        </div>

        {action}
      </div>
    </header>
  );
}
