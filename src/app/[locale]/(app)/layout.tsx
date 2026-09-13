import { BottomNav } from "@/components/shell/BottomNav";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/**
 * Every screen in here shows live roster data behind a sign-in, so nothing may be
 * prerendered at build time or cached between people.
 */
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const dict = await getDictionary(locale);

  return (
    /*
     * No min-height here on purpose. The nav is fixed, so nothing needs a
     * full-height container — and `100dvh` grows when a phone hides its URL bar,
     * which stretched this box and left empty scrollable space under the content.
     * The padding alone is what keeps the last row clear of the bar.
     */
    <div style={{ paddingBottom: "var(--bottom-nav)" }}>
      {children}
      <BottomNav locale={locale} dict={dict} />
    </div>
  );
}
