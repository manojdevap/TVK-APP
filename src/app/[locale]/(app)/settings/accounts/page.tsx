import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { AppHeader } from "@/components/shell/AppHeader";
import { AccountsManager, type AccountRow } from "@/components/accounts/AccountsManager";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { getSession, isSuperAdmin } from "@/lib/auth/guard";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function AccountsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  const [session, superAdmin] = await Promise.all([getSession(), isSuperAdmin()]);
  if (!session || !superAdmin) redirect(`/${locale}/settings`);

  const dict = await getDictionary(locale);
  const db = getDb();

  // Password hashes are never selected — nothing on this screen needs them.
  const rows: AccountRow[] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      isAdmin: users.isAdmin,
      isSuperAdmin: users.isSuperAdmin,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .orderBy(asc(users.createdAt));

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        backHref={`/${locale}/settings`}
        title={dict.accounts.title}
      />

      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <p className="text-sm text-muted">{dict.accounts.subtitle}</p>
        <AccountsManager dict={dict} accounts={rows} currentUserId={session.userId} />
      </main>
    </>
  );
}
