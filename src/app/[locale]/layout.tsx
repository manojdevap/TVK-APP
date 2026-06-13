import { notFound } from "next/navigation";
import { LangSetter } from "@/components/i18n/LangSetter";
import { locales, type Locale } from "@/i18n/config";

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
  if (!locales.includes(locale as Locale)) notFound();

  return (
    <>
      <LangSetter locale={locale as Locale} />
      {children}
    </>
  );
}
