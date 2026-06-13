import { GenderBreakdown } from "@/components/ui/GenderBreakdown";
import { DataSourceBanner } from "@/components/ui/DataSourceBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PetitionsList } from "@/components/petitions/PetitionsList";
import { fetchPetitions, fetchUsers, fetchWards } from "@/lib/data/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { genderBreakdown } from "@/lib/stats";

export default async function PetitionsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const { data: petitions, source } = await fetchPetitions(locale);
  const { data: users } = await fetchUsers();
  const { data: wards } = await fetchWards(locale);

  const petitioners = petitions
    .map((p) => users.find((u) => u.id === p.petitionerId)!)
    .filter(Boolean);

  return (
    <>
      <DataSourceBanner source={source} dict={dict} />
      <PageHeader title={dict.petitions.title} description={dict.petitions.description} />

      <div className="mb-8 max-w-sm">
        <GenderBreakdown
          title={dict.petitions.petitionersMF}
          stats={genderBreakdown(petitioners)}
          maleLabel={dict.common.male}
          femaleLabel={dict.common.female}
        />
      </div>

      {petitions.length === 0 ? (
        <EmptyState message={dict.dataSource.emptyPetitions} />
      ) : (
        <PetitionsList petitions={petitions} wards={wards} users={users} dict={dict} />
      )}
    </>
  );
}
