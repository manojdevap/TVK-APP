import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DataSourceBanner } from "@/components/ui/DataSourceBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchUsers, fetchWards } from "@/lib/data/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function WardsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const { data: wards, source } = await fetchWards(locale);
  const { data: users } = await fetchUsers();

  return (
    <>
      <DataSourceBanner source={source} dict={dict} />
      <PageHeader title={dict.wards.title} description={dict.wards.description} />

      {wards.length === 0 ? (
        <EmptyState message={dict.dataSource.emptyWards} />
      ) : (
        <div className="grid gap-4">
          {wards.map((ward) => {
            const head = users.find((u) => u.id === ward.headId);
            const organiser = users.find((u) => u.id === ward.organiserId);

            return (
              <Link key={ward.id} href={`/${locale}/wards/${ward.id}`} className="card-hover block">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-foreground">{ward.name}</h2>
                    <p className="mt-1 text-sm text-muted">{ward.area}</p>
                  </div>
                  <Badge variant="info">
                    {dict.common.ward} {ward.number}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-muted">{dict.wards.totalVoters}</p>
                    <p className="font-semibold text-foreground">{ward.totalVoters.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted">{dict.wards.ourVotes}</p>
                    <p className="font-semibold text-foreground">{ward.ourVotes.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted">{dict.wards.wardHead}</p>
                    <p className="font-semibold text-foreground">{head?.username ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted">{dict.wards.organiser}</p>
                    <p className="font-semibold text-foreground">{organiser?.username ?? "—"}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <span>{dict.wards.maleVoters}: {ward.maleVoters.toLocaleString()}</span>
                  <span>{dict.wards.femaleVoters}: {ward.femaleVoters.toLocaleString()}</span>
                  <span>{ward.memberIds.length} {dict.wards.wardMembers}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
