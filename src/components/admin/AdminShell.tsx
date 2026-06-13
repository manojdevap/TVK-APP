"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { createClient } from "@/lib/supabase/client";

const adminLinks = [
  { href: "", key: "title" as const },
  { href: "/wards", key: "wards" as const },
  { href: "/users", key: "users" as const },
  { href: "/events", key: "events" as const },
  { href: "/petitions", key: "petitions" as const },
];

export function AdminShell({
  children,
  locale,
  dict,
}: {
  children: React.ReactNode;
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const base = `/${locale}/admin`;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/admin/login`);
  }

  const navItems = adminLinks.map((item) => ({
    href: `${base}${item.href}`,
    label: item.key === "title" ? dict.admin.title : dict.admin[item.key],
  }));

  return (
    <SidebarLayout
      locale={locale}
      municipalityName={`${dict.admin.title} · ${dict.municipality.name}`}
      mobileTitle={dict.nav.appTitle}
      navItems={navItems}
      footerExtra={
        <div className="space-y-2 border-t border-tvk-maroon pt-4">
          <Link
            href={`/${locale}`}
            className="block text-xs text-tvk-yellow/80 hover:text-tvk-yellow"
          >
            {dict.admin.backToApp}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-white/50 hover:text-white"
          >
            {dict.admin.logout}
          </button>
        </div>
      }
    >
      {children}
    </SidebarLayout>
  );
}
