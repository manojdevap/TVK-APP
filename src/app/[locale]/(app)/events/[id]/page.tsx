import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { EventDate } from "@/components/events/EventDate";
import { getSession } from "@/lib/auth/guard";
import { getEvent, listEventPhotos } from "@/server/queries";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/**
 * Reading an event is separate from changing it. Everyone lands here; an admin gets
 * an Edit button through to the form rather than being dropped straight into it.
 */
export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  const locale = resolveLocale(localeParam);

  const [dict, session, item] = await Promise.all([
    getDictionary(locale),
    getSession(),
    getEvent(id),
  ]);

  if (!item) notFound();

  const gallery = await listEventPhotos(item.id);
  const isAdmin = session?.isAdmin ?? false;

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        backHref={`/${locale}/events`}
        title={item.title}
        action={
          isAdmin ? (
            <Link
              href={`/${locale}/events/${item.id}/edit`}
              className="flex h-11 items-center justify-center rounded-full px-3 text-sm font-semibold text-yellow active:bg-white/10"
            >
              {dict.common.edit}
            </Link>
          ) : undefined
        }
      />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {item.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.bannerUrl}
            alt=""
            className="max-h-64 w-full rounded-2xl border border-border object-cover"
          />
        )}

        <div className="card space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>

          <Row label={dict.events.date}>
            <EventDate value={item.eventDate} locale={locale} dict={dict} />
          </Row>

          <Row label={dict.events.organisedFor}>
            {item.wardNumber ? (
              <Link
                href={`/${locale}/wards/${item.wardNumber}`}
                className="font-medium text-maroon underline"
              >
                {dict.wards.ward} {item.wardNumber}
              </Link>
            ) : (
              dict.events.partyWide
            )}
          </Row>

          <Row label={dict.events.organisedBy}>
            {item.organiserId ? (
              <Link
                href={`/${locale}/members/${item.organiserId}`}
                className="font-medium text-maroon underline"
              >
                {item.organiserName}
              </Link>
            ) : (
              <span className="text-muted">{dict.events.unassignedOrganiser}</span>
            )}
          </Row>
        </div>

        {item.description && (
          <div className="card">
            <h3 className="section-title">{dict.events.description}</h3>
            <p className="mt-2 whitespace-pre-line text-foreground">{item.description}</p>
          </div>
        )}

        {gallery.length > 0 && (
          <section className="space-y-2">
            <h3 className="section-title">
              {dict.events.galleryHeading} · {gallery.length}
            </h3>
            <ul className="grid grid-cols-3 gap-2">
              {gallery.map((photo) => (
                <li key={photo.id}>
                  {/* Opens full size in a new tab — a lightbox is more than this needs */}
                  <a href={photo.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt=""
                      className="aspect-square w-full rounded-xl border border-border object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {isAdmin && (
          <Link href={`/${locale}/events/${item.id}/edit`} className="btn-secondary w-full">
            {dict.events.editTitle}
          </Link>
        )}
      </main>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  );
}
