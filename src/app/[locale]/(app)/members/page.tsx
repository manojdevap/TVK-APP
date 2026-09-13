import Link from "next/link";
import { AppHeader } from "@/components/shell/AppHeader";
import { Empty } from "@/components/ui/Empty";
import { Avatar } from "@/components/ui/Avatar";
import { MemberFilters } from "@/components/members/MemberFilters";
import { getSession } from "@/lib/auth/guard";
import { listRoles, listWards, searchMembers } from "@/server/queries";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type Search = { q?: string; ward?: string; role?: string; page?: string };

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const search = await searchParams;

  const [dict, session, wards, roles] = await Promise.all([
    getDictionary(locale),
    getSession(),
    listWards(),
    listRoles(),
  ]);

  const page = await searchMembers({
    query: search.q,
    wardId: search.ward,
    roleId: search.role,
    page: Number(search.page) || 1,
  });

  const isAdmin = session?.isAdmin ?? false;
  const filtering = Boolean(search.q || search.ward || search.role);
  const localised = <T extends { nameEn: string; nameTa: string }>(item: T) =>
    locale === "ta" && item.nameTa ? item.nameTa : item.nameEn;

  function pageHref(next: number) {
    const qs = new URLSearchParams();
    if (search.q) qs.set("q", search.q);
    if (search.ward) qs.set("ward", search.ward);
    if (search.role) qs.set("role", search.role);
    if (next > 1) qs.set("page", String(next));
    const query = qs.toString();
    return `/${locale}/members${query ? `?${query}` : ""}`;
  }

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        title={dict.members.title}
        action={
          isAdmin ? (
            <Link
              href={`/${locale}/members/new`}
              className="flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold text-yellow active:bg-white/10"
            >
              + {dict.common.add}
            </Link>
          ) : undefined
        }
      />

      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <MemberFilters
          locale={locale}
          dict={dict}
          wards={wards.map((w) => ({
            id: w.id,
            label: `${dict.wards.ward} ${w.number}${localised(w) ? ` — ${localised(w)}` : ""}`,
          }))}
          roles={roles.map((r) => ({ id: r.id, label: localised(r) }))}
        />

        {page.total === 0 ? (
          <Empty
            title={filtering ? dict.members.noMatches : dict.members.empty}
            action={
              !filtering && isAdmin
                ? { href: `/${locale}/members/new`, label: dict.members.addFirst }
                : undefined
            }
          />
        ) : (
          <>
            <p className="text-xs text-muted">
              {page.total} {dict.members.resultCount}
            </p>

            <ul className="card divide-y divide-border p-0">
              {page.rows.map((member) => (
                <li key={member.id}>
                  <Link href={`/${locale}/members/${member.id}`} className="tap-row justify-between">
                    <Avatar name={member.fullName} photoUrl={member.photoUrl} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">
                        {member.fullName}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {dict.wards.ward} {member.wardNumber}
                        {member.phone ? ` · ${member.phone}` : ""}
                      </span>
                    </span>
                    <span className="chip-role shrink-0">
                      {locale === "ta" && member.roleNameTa ? member.roleNameTa : member.roleNameEn}
                    </span>
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
