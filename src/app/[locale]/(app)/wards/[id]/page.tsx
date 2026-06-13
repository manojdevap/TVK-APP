import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { GenderBreakdown } from "@/components/ui/GenderBreakdown";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { UserAvatar, PhotoGrid } from "@/components/ui/MediaDisplay";
import { fetchEvents, fetchPetitions, fetchUsers, fetchWards } from "@/lib/data/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { genderBreakdown } from "@/lib/stats";

export default async function WardDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale);

  const { data: wards } = await fetchWards(locale);
  const ward = wards.find((w) => w.id === id);
  if (!ward) notFound();

  const { data: users } = await fetchUsers();
  const { data: events } = await fetchEvents(locale);
  const { data: petitions } = await fetchPetitions(locale);

  const wardEvents = events.filter((e) => e.wardId === ward.id);
  const wardPetitions = petitions.filter((p) => p.wardId === ward.id);
  const head = users.find((u) => u.id === ward.headId);
  const organiser = users.find((u) => u.id === ward.organiserId);
  const members = ward.memberIds.map((mid) => users.find((u) => u.id === mid)!).filter(Boolean);
  const petitioners = wardPetitions.map((p) => users.find((u) => u.id === p.petitionerId)!).filter(Boolean);
  const reps = [head, organiser, ...members].filter(Boolean);

  return (
    <>
      <BackLink href={`/${locale}/wards`}>{dict.common.backToWards}</BackLink>

      <PageHeader title={ward.name} description={ward.area} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={dict.wards.totalVoters} value={ward.totalVoters.toLocaleString()} />
        <StatCard label={dict.wards.ourVotes} value={ward.ourVotes.toLocaleString()} />
        <StatCard label={dict.wards.events} value={wardEvents.length} />
        <StatCard label={dict.wards.petitions} value={wardPetitions.length} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GenderBreakdown title={dict.wards.wardVotersMF} stats={{ male: ward.maleVoters, female: ward.femaleVoters, total: ward.totalVoters }} maleLabel={dict.common.male} femaleLabel={dict.common.female} />
        <GenderBreakdown title={dict.wards.wardMembersMF} stats={genderBreakdown(members)} maleLabel={dict.common.male} femaleLabel={dict.common.female} />
        <GenderBreakdown title={dict.wards.leadershipMF} stats={genderBreakdown([head, organiser].filter(Boolean) as { gender: "male" | "female" }[])} maleLabel={dict.common.male} femaleLabel={dict.common.female} />
        <GenderBreakdown title={dict.wards.petitionersMF} stats={genderBreakdown(petitioners)} maleLabel={dict.common.male} femaleLabel={dict.common.female} />
      </div>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">{dict.wards.representatives}</h2>
        {reps.length === 0 ? (
          <p className="mt-4 text-sm text-muted">—</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reps.map((user) => (
              <div key={user!.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
                <UserAvatar name={user!.username} avatarUrl={user!.avatarUrl} size={44} />
                <div>
                  <p className="font-medium text-foreground">{user!.username}</p>
                  <p className="text-sm text-muted">{dict.roles[user!.role]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">{dict.wards.petitions}</h2>
        {wardPetitions.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{dict.dataSource.emptyPetitions}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {wardPetitions.map((petition) => {
              const petitioner = users.find((u) => u.id === petition.petitionerId);
              return (
                <li key={petition.id} className="py-4 first:pt-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{petition.title}</p>
                      <p className="mt-1 text-sm text-muted">{petition.description}</p>
                      <p className="mt-2 text-xs text-muted">
                        {dict.wards.petitioner}: {petitioner?.username ?? "—"} · {dict.departments[petition.department]}
                      </p>
                      <PhotoGrid photos={petition.photos} alt={petition.title} />
                    </div>
                    <Badge variant={petition.status === "resolved" ? "success" : "warning"}>
                      {dict.petitionStatus[petition.status]}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
