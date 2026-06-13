"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { TvkFlagStripe, TvkHeader } from "@/components/brand/TvkBrand";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import type { Locale } from "@/i18n/config";

type NavItem = { href: string; label: string };

export function SidebarLayout({
  locale,
  municipalityName,
  mobileTitle,
  version,
  navItems,
  footerExtra,
  children,
}: {
  locale: Locale;
  municipalityName: string;
  mobileTitle: string;
  version?: string;
  navItems: NavItem[];
  footerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === `/${locale}`) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <>
      <TvkFlagStripe />
      <div className="border-b border-tvk-maroon px-4 py-5">
        <TvkHeader locale={locale} />
        <p className="mt-3 text-xs leading-relaxed text-tvk-yellow/90">{municipalityName}</p>
        <div className="mt-4">
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-tvk-yellow text-tvk-maroon-dark"
                  : "text-white/90 hover:bg-tvk-maroon hover:text-tvk-yellow"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {footerExtra && <div className="shrink-0 px-3 pb-2">{footerExtra}</div>}
      {version && (
        <div className="shrink-0 border-t border-tvk-maroon p-4">
          <p className="text-xs text-white/40">{version}</p>
        </div>
      )}
      <TvkFlagStripe />
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-tvk-maroon-dark shadow-xl transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-lg p-2 text-tvk-maroon hover:bg-tvk-maroon/10"
            onClick={() => setOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="truncate text-sm font-semibold text-tvk-maroon-dark">{mobileTitle}</span>
        </header>
        <main className="flex-1 overflow-auto bg-gradient-to-br from-background to-[#ede4d8]">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
