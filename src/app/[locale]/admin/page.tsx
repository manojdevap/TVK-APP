import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const links = ["wards", "users", "events", "petitions"] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold text-tvk-maroon-dark">{dict.admin.title}</h1>
      <p className="mt-2 text-muted">{dict.municipality.name}</p>
      <p className="mt-1 text-sm text-muted">{dict.municipality.subtitle}</p>
      <p className="mt-6 text-sm text-muted">{dict.platform.scopeNote}</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {links.map((key) => (
          <li key={key}>
            <Link
              href={`/${locale}/admin/${key}`}
              className="card-hover block font-medium text-foreground"
            >
              {dict.admin[key]}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
