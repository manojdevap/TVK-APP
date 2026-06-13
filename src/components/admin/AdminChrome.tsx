"use client";

import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

/** Wraps admin pages with guard + shell; login page renders without chrome */
export function AdminChrome({
  children,
  locale,
  dict,
}: {
  children: React.ReactNode;
  locale: Locale;
  dict: Dictionary;
}) {
  const pathname = usePathname();
  const isLogin = pathname.endsWith("/admin/login");

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <AdminGuard locale={locale} dict={dict}>
      <AdminShell locale={locale} dict={dict}>
        {children}
      </AdminShell>
    </AdminGuard>
  );
}
