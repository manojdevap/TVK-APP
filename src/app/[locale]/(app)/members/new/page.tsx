import { redirect } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { MemberForm } from "@/components/members/MemberForm";
import { getSession } from "@/lib/auth/guard";
import { listRoles, listWards } from "@/server/queries";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function NewMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ward?: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { ward } = await searchParams;

  const session = await getSession();
  if (!session?.isAdmin) redirect(`/${locale}/members`);

  const [dict, wards, roles] = await Promise.all([
    getDictionary(locale),
    listWards(),
    listRoles(),
  ]);

  // Arriving from a ward page pre-selects that ward, so the common path is one tap shorter.
  const preselectedWard = wards.find((w) => w.id === ward)?.id ?? "";
  const defaultRole = roles[roles.length - 1]?.id ?? "";

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        backHref={`/${locale}/members`}
        title={dict.members.newTitle}
      />

      <main className="mx-auto max-w-lg px-4 py-4">
        <MemberForm
          locale={locale}
          dict={dict}
          wards={wards}
          roles={roles}
          cancelHref={preselectedWard ? `/${locale}/wards` : `/${locale}/members`}
          member={{
            fullName: "",
            wardId: preselectedWard,
            roleId: defaultRole,
            gender: "male",
            phone: "",
            address: "",
            voterId: "",
            joinedOn: "",
            notes: "",
          }}
        />
      </main>
    </>
  );
}
