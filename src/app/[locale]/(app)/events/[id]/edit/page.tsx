import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { EventForm } from "@/components/events/EventForm";
import { DeleteEventButton } from "@/components/events/DeleteEventButton";
import { getSession } from "@/lib/auth/guard";
import { getEvent, listEventPhotos, listWards } from "@/server/queries";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  const locale = resolveLocale(localeParam);

  const session = await getSession();
  // Someone without admin rights is sent to the event itself, not turned away.
  if (!session?.isAdmin) redirect(`/${locale}/events/${id}`);

  const [dict, item] = await Promise.all([getDictionary(locale), getEvent(id)]);
  if (!item) notFound();

  const [gallery, wards] = await Promise.all([listEventPhotos(item.id), listWards()]);

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        backHref={`/${locale}/events/${item.id}`}
        title={dict.events.editTitle}
      />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <EventForm
          locale={locale}
          dict={dict}
          wards={wards}
          organiserName={item.organiserName ?? ""}
          eventId={item.id}
          cancelHref={`/${locale}/events/${item.id}`}
          event={{
            title: item.title,
            eventDate: item.eventDate,
            scope: item.wardId ? "ward" : "party",
            wardId: item.wardId ?? "",
            venue: item.venue ?? "",
            latitude: item.latitude,
            longitude: item.longitude,
            description: item.description ?? "",
            bannerUrl: item.bannerUrl ?? "",
            galleryUrls: gallery.map((photo) => photo.url),
            organiserId: item.organiserId ?? "",
          }}
        />

        {/* Deleting leaves nothing to return to, so this one goes back to the list */}
        <DeleteEventButton eventId={item.id} dict={dict} redirectTo={`/${locale}/events`} />
      </main>
    </>
  );
}
