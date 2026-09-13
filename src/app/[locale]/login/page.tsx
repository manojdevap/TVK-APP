import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";
import { party } from "@/config/party";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { next } = await searchParams;
  const dict = await getDictionary(locale);

  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10"
      style={{ paddingTop: "max(2.5rem, env(safe-area-inset-top, 0px))" }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src={party.emblem}
          alt=""
          width={72}
          height={72}
          className="rounded-full bg-white shadow-sm"
          priority
        />
        <div>
          <h1 className="text-balance text-xl font-bold leading-snug text-maroon-dark">
            {dict.app.name}
          </h1>
          <p className="mt-1 text-sm text-muted">{dict.app.subtitle}</p>
        </div>
        <p className="text-sm font-medium text-foreground">{dict.auth.welcome}</p>
      </div>

      <LoginForm locale={locale} dict={dict} nextPath={next} />
    </main>
  );
}
