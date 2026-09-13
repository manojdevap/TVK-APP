import Link from "next/link";
import { AppHeader } from "@/components/shell/AppHeader";
import { Empty } from "@/components/ui/Empty";
import { PetitionFilters } from "@/components/petitions/PetitionFilters";
import { StatusChip } from "@/components/petitions/StatusChip";
import { EventDate } from "@/components/events/EventDate";
import { getSession } from "@/lib/auth/guard";
import { listWards } from "@/server/queries";
import { searchPetitions } from "@/server/petition-queries";
import { departmentLabel, scopeLabel } from "@/lib/petition-labels";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type Search = { q?: string; ward?: string; status?: string; page?: string };

export default async function PetitionsPage({
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

  const page = await searchPetitions({
    query: search.q,
    wardId: search.ward,
    status: search.status,
    page: Number(search.page) || 1,
  });

  const isAdmin = session?.isAdmin ?? false;
  const filtering = Boolean(search.q || search.ward || search.status);

  function pageHref(next: number) {
    const qs = new URLSearchParams();
    if (search.q) qs.set("q", search.q);
    if (search.ward) qs.set("ward", search.ward);
    if (search.status) qs.set("status", search.status);
    if (next > 1) qs.set("page", String(next));
    const query = qs.toString();
    return `/${locale}/petitions${query ? `?${query}` : ""}`;
  }

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        title={dict.petitions.title}
        action={
          isAdmin ? (
            <Link
              href={`/${locale}/petitions/new`}
              className="flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold text-yellow active:bg-white/10"
            >
              + {dict.common.add}
            </Link>
          ) : undefined
        }
      />

      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <PetitionFilters
          locale={locale}
          dict={dict}
          wards={wards.map((w) => ({
            id: w.id,
            label: `${dict.wards.ward} ${w.number}${
              (locale === "ta" ? w.nameTa : w.nameEn)
                ? ` — ${locale === "ta" ? w.nameTa : w.nameEn}`
                : ""
            }`,
          }))}
        />

        {page.total === 0 ? (
          <Empty
            title={filtering ? dict.petitions.noMatches : dict.petitions.empty}
            action={
              !filtering && isAdmin
                ? { href: `/${locale}/petitions/new`, label: dict.petitions.addFirst }
                : undefined
            }
          />
        ) : (
          <>
            <p className="text-xs text-muted">
              {page.total} {dict.petitions.resultCount}
            </p>

            <ul className="space-y-2">
              {page.rows.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/${locale}/petitions/${item.id}`}
                    className="card block active:bg-surface-sunk"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 font-medium text-foreground">{item.title}</p>
                      <StatusChip status={item.status} dict={dict} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {scopeLabel(item.wardNumber, dict)} ·{" "}
                      {departmentLabel(item.department, item.departmentOther, dict)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {item.petitionerName} ·{" "}
                      <EventDate
                        value={item.submittedOn}
                        locale={locale}
                        dict={dict}
                        withRelative={false}
                      />
                    </p>
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
