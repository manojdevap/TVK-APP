import Link from "next/link";
import { GenderBreakdown } from "@/components/ui/GenderBreakdown";
import { DataSourceBanner } from "@/components/ui/DataSourceBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import {
  fetchEvents,
  fetchPetitions,
  fetchUsers,
  fetchWards,
} from "@/lib/data/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { genderBreakdown } from "@/lib/stats";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const { data: wards, source } = await fetchWards(locale);
  const { data: users } = await fetchUsers();
  const { data: events } = await fetchEvents(locale);
  const { data: petitions } = await fetchPetitions(locale);

  const totalVoters = wards.reduce((sum, w) => sum + w.totalVoters, 0);
  const totalOurVotes = wards.reduce((sum, w) => sum + w.ourVotes, 0);
  const ourVoteUsers = users.filter((u) => u.isOurVote);

  return (
    <>
      <DataSourceBanner source={source} dict={dict} />
      <PageHeader
        title={dict.dashboard.title}
        description={dict.dashboard.description}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={dict.dashboard.wards} value={wards.length} />
        <StatCard label={dict.dashboard.totalVoters} value={totalVoters.toLocaleString()} />
        <StatCard
          label={dict.dashboard.ourVotes}
          value={totalOurVotes.toLocaleString()}
          subtext={`${totalVoters ? Math.round((totalOurVotes / totalVoters) * 100) : 0}% ${dict.common.ofTotal}`}
        />
        <StatCard
          label={dict.dashboard.activeEvents}
          value={events.filter((e) => e.status === "planned").length}
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <GenderBreakdown
          title={dict.dashboard.allUsersMF}
          stats={genderBreakdown(users)}
          maleLabel={dict.common.male}
          femaleLabel={dict.common.female}
        />
        <GenderBreakdown
          title={dict.dashboard.ourVoteContactsMF}
          stats={genderBreakdown(ourVoteUsers)}
          maleLabel={dict.common.male}
          femaleLabel={dict.common.female}
        />
        <GenderBreakdown
          title={dict.dashboard.petitionersMF}
          stats={genderBreakdown(
            petitions
              .map((p) => users.find((u) => u.id === p.petitionerId)!)
              .filter(Boolean)
          )}
          maleLabel={dict.common.male}
          femaleLabel={dict.common.female}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-foreground">{dict.dashboard.recentEvents}</h2>
          {events.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{dict.dataSource.emptyEvents}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {events.slice(0, 3).map((event) => (
                <li key={event.id} className="py-3">
                  <Link
                    href={`/${locale}/events/${event.id}`}
                    className="font-medium text-foreground hover:text-tvk-maroon"
                  >
                    {event.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {event.date} · {event.participantIds.length} {dict.common.participants}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-foreground">{dict.dashboard.openPetitions}</h2>
          {petitions.filter((p) => p.status !== "resolved").length === 0 ? (
            <p className="mt-4 text-sm text-muted">{dict.dataSource.emptyPetitions}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {petitions
                .filter((p) => p.status !== "resolved")
                .slice(0, 3)
                .map((petition) => (
                  <li key={petition.id} className="py-3">
                    <p className="font-medium text-foreground">{petition.title}</p>
                    <p className="text-xs text-muted">
                      {dict.petitionStatus[petition.status]}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
