import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { Empty } from "@/components/ui/Empty";
import { Avatar } from "@/components/ui/Avatar";
import { WardDetailsForm } from "@/components/wards/WardDetailsForm";
import { getSession } from "@/lib/auth/guard";
import { getWardByNumber, listWardEvents, listWardMembers } from "@/server/queries";
import { listWardPetitions } from "@/server/petition-queries";
import { StatusChip } from "@/components/petitions/StatusChip";
import { EventDate } from "@/components/events/EventDate";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function WardDetailPage({
  params,
}: {
  params: Promise<{ locale: string; number: string }>;
}) {
  const { locale: localeParam, number } = await params;
  const locale = resolveLocale(localeParam);
  const wardNumber = Number(number);
  if (!Number.isInteger(wardNumber) || wardNumber < 1) notFound();

  const ward = await getWardByNumber(wardNumber);
  if (!ward) notFound();

  const [dict, session, members, wardEvents, wardPetitions] = await Promise.all([
    getDictionary(locale),
    getSession(),
    listWardMembers(ward.id),
    listWardEvents(ward.id, 10),
    listWardPetitions(ward.id, 10),
  ]);

  const isAdmin = session?.isAdmin ?? false;
  const name = locale === "ta" ? ward.nameTa : ward.nameEn;
  const area = locale === "ta" ? ward.areaTa : ward.areaEn;
  const roleName = (m: { roleNameEn: string; roleNameTa: string }) =>
    locale === "ta" && m.roleNameTa ? m.roleNameTa : m.roleNameEn;

  const hasOrganiser = members.some((m) => m.roleSlug === "organiser");

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        backHref={`/${locale}/wards`}
        title={`${dict.wards.ward} ${ward.number}`}
      />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <div className="card">
          <p className="text-lg font-semibold text-foreground">
            {name || `${dict.wards.ward} ${ward.number}`}
          </p>
          {area && <p className="mt-0.5 text-sm text-muted">{area}</p>}
          <p className="mt-2 text-sm text-muted">
            {members.length} {dict.wards.memberCount}
          </p>
          {!hasOrganiser && (
            <p className="mt-2 inline-flex rounded-lg bg-yellow-soft px-2 py-1 text-xs font-medium text-maroon-dark">
              {dict.wards.noOrganiser}
            </p>
          )}
        </div>

        {isAdmin && (
          <>
            <Link href={`/${locale}/members/new?ward=${ward.id}`} className="btn-primary w-full">
              {dict.wards.addToWard}
            </Link>
            <WardDetailsForm
              wardId={ward.id}
              dict={dict}
              ward={{
                nameEn: ward.nameEn,
                nameTa: ward.nameTa,
                areaEn: ward.areaEn,
                areaTa: ward.areaTa,
              }}
            />
          </>
        )}

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title">{dict.petitions.wardHeading}</h2>
            {isAdmin && (
              <Link
                href={`/${locale}/petitions/new?ward=${ward.id}`}
                className="text-sm font-medium text-maroon"
              >
                + {dict.common.add}
              </Link>
            )}
          </div>

          {wardPetitions.length === 0 ? (
            <p className="card text-sm text-muted">{dict.petitions.noWardPetitions}</p>
          ) : (
            <ul className="card divide-y divide-border p-0">
              {wardPetitions.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/${locale}/petitions/${item.id}`}
                    className="tap-row justify-between"
                  >
                    <span className="min-w-0 truncate font-medium text-foreground">
                      {item.title}
                    </span>
                    <StatusChip status={item.status} dict={dict} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title">{dict.events.wardHeading}</h2>
            {isAdmin && (
              <Link
                href={`/${locale}/events/new?ward=${ward.id}`}
                className="text-sm font-medium text-maroon"
              >
                + {dict.common.add}
              </Link>
            )}
          </div>

          {wardEvents.length === 0 ? (
            <p className="card text-sm text-muted">{dict.events.noWardEvents}</p>
          ) : (
            <ul className="card divide-y divide-border p-0">
              {wardEvents.map((item) => (
                <li key={item.id}>
                  <Link href={`/${locale}/events/${item.id}`} className="tap-row justify-between">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{item.title}</span>
                      <span className="block text-xs text-muted">
                        <EventDate value={item.eventDate} locale={locale} dict={dict} />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="section-title">{dict.wards.membersHeading}</h2>

          {members.length === 0 ? (
            <Empty
              title={dict.wards.noMembers}
              action={
                isAdmin
                  ? { href: `/${locale}/members/new?ward=${ward.id}`, label: dict.members.addFirst }
                  : undefined
              }
            />
          ) : (
            <ul className="card divide-y divide-border p-0">
              {members.map((member) => (
                <li key={member.id}>
                  <Link href={`/${locale}/members/${member.id}`} className="tap-row justify-between">
                    <Avatar name={member.fullName} photoUrl={member.photoUrl} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">
                        {member.fullName}
                      </span>
                      {member.phone && (
                        <span className="block text-xs tabular-nums text-muted">{member.phone}</span>
                      )}
                    </span>
                    <span className="chip-role shrink-0">{roleName(member)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
