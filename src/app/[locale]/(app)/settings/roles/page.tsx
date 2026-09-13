import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { AppHeader } from "@/components/shell/AppHeader";
import { RolesManager, type RoleRow } from "@/components/roles/RolesManager";
import { getDb } from "@/db/client";
import { members, roles } from "@/db/schema";
import { getSession } from "@/lib/auth/guard";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function RolesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  const session = await getSession();
  if (!session?.isAdmin) redirect(`/${locale}/settings`);

  const dict = await getDictionary(locale);
  const db = getDb();

  const rows: RoleRow[] = await db
    .select({
      id: roles.id,
      nameEn: roles.nameEn,
      nameTa: roles.nameTa,
      maxPerWard: roles.maxPerWard,
      sortOrder: roles.sortOrder,
      isSystem: roles.isSystem,
      memberCount: sql<number>`count(${members.id})::int`,
    })
    .from(roles)
    .leftJoin(members, eq(members.roleId, roles.id))
    .groupBy(roles.id)
    .orderBy(roles.sortOrder, roles.nameEn);

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        backHref={`/${locale}/settings`}
        title={dict.roles.title}
      />

      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <p className="text-sm text-muted">{dict.roles.subtitle}</p>
        <RolesManager locale={locale} dict={dict} roles={rows} />
      </main>
    </>
  );
}
