import Link from "next/link";
import { AppHeader } from "@/components/shell/AppHeader";
import { Empty } from "@/components/ui/Empty";
import { EventFilters } from "@/components/events/EventFilters";
import { EventDate } from "@/components/events/EventDate";
import { getSession } from "@/lib/auth/guard";
import { listWards, searchEvents } from "@/server/queries";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type Search = { q?: string; ward?: string; page?: string };

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const search = await searchParams;

  const [dict, session, wards] = await Promise.all([
    getDictionary(locale),
    getSession(),
    listWards(),
  ]);

  const page = await searchEvents({
    query: search.q,
    wardId: search.ward,
    page: Number(search.page) || 1,
  });

  const isAdmin = session?.isAdmin ?? false;
  const filtering = Boolean(search.q || search.ward);

  function pageHref(next: number) {
    const qs = new URLSearchParams();
    if (search.q) qs.set("q", search.q);
    if (search.ward) qs.set("ward", search.ward);
    if (next > 1) qs.set("page", String(next));
    const query = qs.toString();
    return `/${locale}/events${query ? `?${query}` : ""}`;
  }

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        title={dict.events.title}
        action={
          isAdmin ? (
            <Link
              href={`/${locale}/events/new`}
              className="flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold text-yellow active:bg-white/10"
            >
              + {dict.common.add}
            </Link>
          ) : undefined
        }
      />

      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <EventFilters
          locale={locale}
          dict={dict}
          wards={wards.map((w) => ({
            id: w.id,
            label: `${dict.wards.ward} ${w.number}${
              (locale === "ta" ? w.nameTa : w.nameEn) ? ` — ${locale === "ta" ? w.nameTa : w.nameEn}` : ""
            }`,
          }))}
        />

        {page.total === 0 ? (
          <Empty
            title={filtering ? dict.events.noMatches : dict.events.empty}
            action={
              !filtering && isAdmin
                ? { href: `/${locale}/events/new`, label: dict.events.addFirst }
                : undefined
            }
          />
        ) : (
          <>
            <p className="text-xs text-muted">
              {page.total} {dict.events.resultCount}
            </p>

            <ul className="space-y-2">
              {page.rows.map((item) => (
                <li key={item.id}>
                  <Link href={`/${locale}/events/${item.id}`} className="card block active:bg-surface-sunk">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          <EventDate value={item.eventDate} locale={locale} dict={dict} />
                          {" · "}
                          {item.wardNumber
                            ? `${dict.wards.ward} ${item.wardNumber}`
                            : dict.events.partyWide}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {item.organiserName ?? dict.events.unassignedOrganiser}
                        </p>
                      </div>
                      {item.bannerUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.bannerUrl}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
                        />
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {page.pageCount > 1 && (
              <nav className="flex items-center justify-between gap-3 pt-1" aria-label="Pagination">
                {page.page > 1 ? (
                  <Link href={pageHref(page.page - 1)} className="btn-secondary">
                    {dict.common.previous}
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-xs tabular-nums text-muted">
                  {page.page} {dict.common.of} {page.pageCount}
                </span>
                {page.page < page.pageCount ? (
                  <Link href={pageHref(page.page + 1)} className="btn-secondary">
                    {dict.common.next}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </main>
    </>
  );
}
