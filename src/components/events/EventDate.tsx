import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * Dates are stored as plain calendar days. Parsing them with `new Date("2026-09-13")`
 * would treat them as UTC midnight and shift them a day backwards for anyone west of
 * Greenwich, so the parts are handed to the formatter directly.
 */
export function EventDate({
  value,
  locale,
  dict,
  withRelative = true,
}: {
  value: string;
  locale: Locale;
  dict: Dictionary;
  withRelative?: boolean;
}) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return <span>{value}</span>;

  const formatted = new Intl.DateTimeFormat(locale === "ta" ? "ta-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));

  if (!withRelative) return <time dateTime={value}>{formatted}</time>;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const eventDay = new Date(year, month - 1, day);

  const label =
    eventDay.getTime() === startOfToday.getTime()
      ? dict.events.today
      : eventDay > startOfToday
        ? dict.events.upcoming
        : null;

  return (
    <>
      <time dateTime={value}>{formatted}</time>
      {label && <span className="ml-1.5 font-medium text-maroon">{label}</span>}
    </>
  );
}
