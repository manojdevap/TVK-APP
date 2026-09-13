import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { getSession } from "@/lib/auth/guard";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function ChangePasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const dict = await getDictionary(locale);

  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10"
      style={{ paddingTop: "max(2.5rem, env(safe-area-inset-top, 0px))" }}
    >
      <div className="text-center">
        <h1 className="text-xl font-bold text-maroon-dark">{dict.auth.changePassword}</h1>
        <p className="mt-1 text-sm text-muted">{session.username}</p>
      </div>

      <ChangePasswordForm
        locale={locale}
        dict={dict}
        forced={session.mustChangePassword}
      />
    </main>
  );
}
