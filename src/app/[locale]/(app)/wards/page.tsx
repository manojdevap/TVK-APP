import Link from "next/link";
import { AppHeader } from "@/components/shell/AppHeader";
import { Empty } from "@/components/ui/Empty";
import { listWards } from "@/server/queries";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function WardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const dict = await getDictionary(locale);
  const wards = await listWards();

  return (
    <>
      <AppHeader locale={locale} dict={dict} title={dict.wards.title} />

      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <p className="text-sm text-muted">{dict.wards.subtitle}</p>

        {wards.length === 0 ? (
          <Empty title={dict.wards.empty} />
        ) : (
          <ul className="card divide-y divide-border p-0">
            {wards.map((ward) => {
              const name = locale === "ta" ? ward.nameTa : ward.nameEn;
              const area = locale === "ta" ? ward.areaTa : ward.areaEn;
              return (
                <li key={ward.id}>
                  <Link href={`/${locale}/wards/${ward.number}`} className="tap-row justify-between">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-soft text-sm font-bold tabular-nums text-maroon-dark">
                        {ward.number}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">
                          {name || `${dict.wards.ward} ${ward.number}`}
                        </span>
                        {area && <span className="block truncate text-xs text-muted">{area}</span>}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-muted">
                      {ward.memberCount > 0
                        ? `${ward.memberCount} ${dict.wards.memberCount}`
                        : dict.wards.noMembers}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
