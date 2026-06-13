import Link from "next/link";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

const navKeys = [
  { href: "", key: "dashboard" as const },
  { href: "/wards", key: "wards" as const },
  { href: "/events", key: "events" as const },
  { href: "/users", key: "users" as const },
  { href: "/petitions", key: "petitions" as const },
];

export function AppShell({
  children,
  locale,
  dict,
}: {
  children: React.ReactNode;
  locale: Locale;
  dict: Dictionary;
}) {
  const navItems = navKeys.map((item) => ({
    href: `/${locale}${item.href}`,
    label: dict.nav[item.key],
  }));

  return (
    <SidebarLayout
      locale={locale}
      municipalityName={dict.municipality.name}
      mobileTitle={dict.nav.appTitle}
      version={dict.nav.version}
      navItems={navItems}
      footerExtra={
        <div className="space-y-2 border-t border-tvk-maroon pt-4">
          <Link
            href={`/${locale}/admin/login`}
            className="block rounded-lg border border-tvk-yellow/40 bg-tvk-maroon px-3 py-2.5 text-center text-sm font-medium text-tvk-yellow transition hover:bg-tvk-yellow hover:text-tvk-maroon-dark"
          >
            {dict.nav.admin}
          </Link>
        </div>
      }
    >
      {children}
    </SidebarLayout>
  );
}
