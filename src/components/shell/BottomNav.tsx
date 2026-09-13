"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (inner: string) => boolean;
};

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export function BottomNav({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const inner = pathname.startsWith(`/${locale}`) ? pathname.slice(locale.length + 1) || "/" : pathname;

  const items: Item[] = [
    {
      href: `/${locale}`,
      label: dict.nav.home,
      icon: <Icon path="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
      match: (p) => p === "/",
    },
    {
      href: `/${locale}/wards`,
      label: dict.nav.wards,
      icon: <Icon path="M4 21V8l8-5 8 5v13M9 21v-6h6v6M4 21h16" />,
      match: (p) => p.startsWith("/wards"),
    },
    {
      href: `/${locale}/members`,
      label: dict.nav.members,
      icon: (
        <Icon path="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      ),
      match: (p) => p.startsWith("/members"),
    },
    {
      href: `/${locale}/events`,
      label: dict.nav.events,
      icon: (
        <Icon path="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" />
      ),
      match: (p) => p.startsWith("/events"),
    },
    {
      href: `/${locale}/petitions`,
      label: dict.nav.petitions,
      icon: (
        <Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6" />
      ),
      match: (p) => p.startsWith("/petitions"),
    },
    {
      href: `/${locale}/settings`,
      label: dict.nav.settings,
      icon: (
        <Icon path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10.6 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16.11 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      ),
      match: (p) => p.startsWith("/settings"),
    },
  ];

  return (
    <nav
      aria-label={dict.nav.home}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active = item.match(inner);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 text-[10px] font-medium transition ${
                  active ? "text-maroon" : "text-muted"
                }`}
              >
                <span className={active ? "text-maroon" : "text-muted"}>{item.icon}</span>
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
