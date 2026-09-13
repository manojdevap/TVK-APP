import { redirect } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { EventForm } from "@/components/events/EventForm";
import { getSession } from "@/lib/auth/guard";
import { listWards } from "@/server/queries";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function NewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ward?: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { ward } = await searchParams;

  const session = await getSession();
  if (!session?.isAdmin) redirect(`/${locale}/events`);

  const [dict, wards] = await Promise.all([getDictionary(locale), listWards()]);

  // Arriving from a ward page pre-selects that ward and its members.
  const preselectedWard = wards.find((w) => w.id === ward)?.id ?? "";

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        backHref={`/${locale}/events`}
        title={dict.events.newTitle}
      />

      <main className="mx-auto max-w-lg px-4 py-4">
        <EventForm
          locale={locale}
          dict={dict}
          wards={wards}
          cancelHref={`/${locale}/events`}
          event={{
            title: "",
            eventDate: new Date().toISOString().slice(0, 10),
            scope: "ward",
            wardId: preselectedWard,
            description: "",
            bannerUrl: "",
            galleryUrls: [],
            organiserId: "",
          }}
        />
      </main>
    </>
  );
}
