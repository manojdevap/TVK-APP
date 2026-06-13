import Link from "next/link";
import { TvkFlagStripe, TvkLogo } from "@/components/brand/TvkBrand";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-tvk-maroon-dark via-tvk-maroon to-[#3d0f16]">
      <TvkFlagStripe />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Link
          href={`/${locale}`}
          className="mb-8 self-start text-sm font-medium text-tvk-yellow/90 hover:text-tvk-yellow sm:self-center"
        >
          {dict.admin.backToApp}
        </Link>

        <div className="mb-6 flex flex-col items-center text-center">
          <TvkLogo size={72} />
          <p className="mt-3 text-sm font-medium text-tvk-yellow">{dict.municipality.name}</p>
        </div>

        <AdminLoginForm locale={locale} dict={dict} />
      </div>
      <TvkFlagStripe />
    </div>
  );
}
