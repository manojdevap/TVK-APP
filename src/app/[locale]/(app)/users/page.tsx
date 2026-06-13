import { Badge } from "@/components/ui/Badge";
import { GenderBreakdown } from "@/components/ui/GenderBreakdown";
import { DataSourceBanner } from "@/components/ui/DataSourceBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { UsersTable } from "@/components/users/UsersTable";
import { CsvImportPanel } from "@/components/users/CsvImportPanel";
import { fetchUsers, fetchWards } from "@/lib/data/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { genderBreakdown } from "@/lib/stats";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const { data: wards, source } = await fetchWards(locale);
  const { data: users } = await fetchUsers();

  const byRole = {
    ward_head: users.filter((u) => u.role === "ward_head"),
    ward_organiser: users.filter((u) => u.role === "ward_organiser"),
    ward_member: users.filter((u) => u.role === "ward_member"),
  };

  return (
    <>
      <DataSourceBanner source={source} dict={dict} />
      <PageHeader title={dict.users.title} description={dict.users.description} />

      <CsvImportPanel dict={dict.csvImport} wardNumbers={wards.map((w) => w.number)} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GenderBreakdown title={dict.users.allUsers} stats={genderBreakdown(users)} maleLabel={dict.common.male} femaleLabel={dict.common.female} />
        <GenderBreakdown title={dict.users.wardHeads} stats={genderBreakdown(byRole.ward_head)} maleLabel={dict.common.male} femaleLabel={dict.common.female} />
        <GenderBreakdown title={dict.users.wardOrganisers} stats={genderBreakdown(byRole.ward_organiser)} maleLabel={dict.common.male} femaleLabel={dict.common.female} />
        <GenderBreakdown title={dict.users.wardMembers} stats={genderBreakdown(byRole.ward_member)} maleLabel={dict.common.male} femaleLabel={dict.common.female} />
      </div>

      {users.length === 0 ? (
        <EmptyState message={dict.dataSource.emptyUsers} />
      ) : (
        <UsersTable users={users} wards={wards} dict={dict} />
      )}
    </>
  );
}
