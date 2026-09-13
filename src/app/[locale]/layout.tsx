import { notFound } from "next/navigation";
import { LangSetter } from "@/components/i18n/LangSetter";
import { isLocale, locales } from "@/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // An unknown language in the URL is a real 404, not a silent fall back to English.
  if (!isLocale(locale)) notFound();

  return (
    <>
      <LangSetter locale={locale} />
      {children}
    </>
  );
}
