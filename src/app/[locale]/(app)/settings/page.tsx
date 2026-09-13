import Link from "next/link";
import { AppHeader } from "@/components/shell/AppHeader";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getSession } from "@/lib/auth/guard";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const [dict, session] = await Promise.all([getDictionary(locale), getSession()]);

  return (
    <>
      <AppHeader locale={locale} dict={dict} title={dict.settings.title} />

      <main className="mx-auto max-w-lg space-y-5 px-4 py-4">
        <section className="space-y-2">
          <h2 className="section-title">{dict.settings.account}</h2>
          <div className="card space-y-3">
            <div>
              <p className="text-sm text-muted">{dict.settings.signedInAs}</p>
              <p className="font-medium text-foreground">{session?.username}</p>
            </div>
            <Link href={`/${locale}/change-password`} className="btn-secondary w-full">
              {dict.auth.changePassword}
            </Link>
            <SignOutButton locale={locale} dict={dict} />
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="section-title">{dict.settings.language}</h2>
          <LanguageSwitcher locale={locale} />
        </section>

        {session?.isAdmin && (
          <section className="space-y-2">
            <h2 className="section-title">{dict.roles.title}</h2>
            <Link href={`/${locale}/settings/roles`} className="card tap-row justify-between">
              <span>
                <span className="block font-medium text-foreground">
                  {dict.settings.manageRoles}
                </span>
                <span className="block text-xs text-muted">{dict.settings.manageRolesHint}</span>
              </span>
              <span aria-hidden="true" className="text-muted">
                ›
              </span>
            </Link>
          </section>
        )}

        <p className="pt-2 text-center text-xs text-muted">
          {dict.app.name} · {dict.app.subtitle}
        </p>
      </main>
    </>
  );
}
