import Image from "next/image";
import type { Locale } from "@/i18n/config";
import { party, partyName, partyShort } from "@/config/party";

export function TvkLogo({ size = 40 }: { size?: number }) {
  return (
    <Image
      src={party.emblem}
      alt={party.fullLabelEn}
      width={size}
      height={size}
      className="shrink-0 rounded-full"
      priority
    />
  );
}

export function TvkFlagStripe() {
  return (
    <div
      className="h-1.5 w-full shrink-0 bg-repeat-x"
      style={{
        backgroundImage: "url(/tvk-flag-stripe.svg)",
        backgroundSize: "auto 100%",
      }}
    />
  );
}

export function TvkHeader({
  locale,
  compact = false,
}: {
  locale: Locale;
  compact?: boolean;
}) {
  const short = partyShort(locale);
  const name = partyName(locale, compact);
  const tagline = locale === "ta" ? party.taglineTa : party.taglineEn;

  return (
    <div className="flex items-center gap-3">
      <TvkLogo size={compact ? 36 : 48} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-tvk-yellow">
          {short}
        </p>
        <p
          className={`font-semibold leading-snug text-white ${compact ? "text-xs line-clamp-2" : "text-sm line-clamp-3"}`}
          title={locale === "ta" ? party.nameTa : party.nameEn}
        >
          {name}
        </p>
        {!compact && (
          <p className="truncate text-[10px] text-tvk-yellow/80">{tagline}</p>
        )}
      </div>
    </div>
  );
}
