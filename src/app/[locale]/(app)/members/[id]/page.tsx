import { notFound } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { MemberForm } from "@/components/members/MemberForm";
import { DeleteMemberButton } from "@/components/members/DeleteMemberButton";
import { Avatar } from "@/components/ui/Avatar";
import { getSession } from "@/lib/auth/guard";
import { getMember, listRoles, listWards } from "@/server/queries";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  const locale = resolveLocale(localeParam);

  const [dict, session, member] = await Promise.all([
    getDictionary(locale),
    getSession(),
    getMember(id),
  ]);

  if (!member) notFound();

  const roleName = locale === "ta" && member.roleNameTa ? member.roleNameTa : member.roleNameEn;

  // Someone without admin rights sees the record, but cannot change it.
  if (!session?.isAdmin) {
    return (
      <>
        <AppHeader
          locale={locale}
          dict={dict}
          backHref={`/${locale}/members`}
          title={member.fullName}
        />
        <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
          <div className="flex justify-center py-2">
            <Avatar name={member.fullName} photoUrl={member.photoUrl} size={96} />
          </div>
          <dl className="card space-y-3">
            <Row label={dict.members.role} value={roleName} />
            <Row label={dict.members.ward} value={`${dict.wards.ward} ${member.wardNumber}`} />
            <Row label={dict.gender.label} value={dict.gender[member.gender]} />
            <Row label={dict.members.phone} value={member.phone ?? dict.common.none} />
            <Row label={dict.members.voterId} value={member.voterId ?? dict.common.none} />
            <Row label={dict.members.address} value={member.address || dict.common.none} />
          </dl>
        </main>
      </>
    );
  }

  const [wards, roles] = await Promise.all([listWards(), listRoles()]);

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        backHref={`/${locale}/members`}
        title={dict.members.editTitle}
      />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <MemberForm
          locale={locale}
          dict={dict}
          wards={wards}
          roles={roles}
          memberId={member.id}
          cancelHref={`/${locale}/members`}
          member={{
            fullName: member.fullName,
            wardId: member.wardId,
            roleId: member.roleId,
            gender: member.gender,
            phone: member.phone ?? "",
            address: member.address,
            voterId: member.voterId ?? "",
            photoUrl: member.photoUrl ?? "",
            joinedOn: member.joinedOn ?? "",
            notes: member.notes ?? "",
          }}
        />

        <DeleteMemberButton
          memberId={member.id}
          dict={dict}
          redirectTo={`/${locale}/members`}
        />
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
