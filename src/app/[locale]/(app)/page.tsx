import Link from "next/link";
import { AppHeader } from "@/components/shell/AppHeader";
import { Stat } from "@/components/ui/Empty";
import { getTotals, listWards } from "@/server/queries";
import { getPetitionTotals } from "@/server/petition-queries";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const dict = await getDictionary(locale);

  const [totals, wards, petitionTotals] = await Promise.all([
    getTotals(),
    listWards(),
    getPetitionTotals(),
  ]);
  const withoutOrganiser = totals.wards - totals.wardsWithOrganiser;
  const busiest = [...wards].sort((a, b) => b.memberCount - a.memberCount).slice(0, 5);

  return (
    <>
      <AppHeader locale={locale} dict={dict} />

      <main className="mx-auto max-w-lg space-y-5 px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat label={dict.home.totalMembers} value={totals.members.toLocaleString()} />
          <Stat
            label={dict.home.wardsWithOrganiser}
            value={`${totals.wardsWithOrganiser}/${totals.wards}`}
            hint={
              withoutOrganiser > 0
                ? `${withoutOrganiser} ${dict.home.wardsNeedingOrganiser}`
                : dict.home.allWardsCovered
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label={dict.petitions.openCount} value={petitionTotals.open} />
          <Stat label={dict.petitionStatus.resolved} value={petitionTotals.resolved} />
        </div>

        <div className="flex gap-2">
          <Link href={`/${locale}/members/new`} className="btn-primary flex-1">
            {dict.home.addMember}
          </Link>
          <Link href={`/${locale}/wards`} className="btn-secondary flex-1">
            {dict.home.browseWards}
          </Link>
        </div>

        {busiest.some((ward) => ward.memberCount > 0) && (
          <section className="space-y-2">
            <h2 className="section-title">{dict.wards.title}</h2>
            <ul className="card divide-y divide-border p-0">
              {busiest.map((ward) => (
                <li key={ward.id}>
                  <Link href={`/${locale}/wards/${ward.number}`} className="tap-row justify-between">
                    <span className="min-w-0 truncate">
                      <span className="font-medium text-foreground">
                        {dict.wards.ward} {ward.number}
                      </span>
                      {(locale === "ta" ? ward.nameTa : ward.nameEn) && (
                        <span className="text-muted">
                          {" "}
                          — {locale === "ta" ? ward.nameTa : ward.nameEn}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-muted">
                      {ward.memberCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
