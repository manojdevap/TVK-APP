import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { StatusChip } from "@/components/petitions/StatusChip";
import { StatusActions } from "@/components/petitions/StatusActions";
import { EventDate } from "@/components/events/EventDate";
import { getSession } from "@/lib/auth/guard";
import { getPetition, listPetitionPhotos } from "@/server/petition-queries";
import { departmentLabel } from "@/lib/petition-labels";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function PetitionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  const locale = resolveLocale(localeParam);

  const [dict, session, item] = await Promise.all([
    getDictionary(locale),
    getSession(),
    getPetition(id),
  ]);

  if (!item) notFound();

  const photos = await listPetitionPhotos(item.id);
  const isAdmin = session?.isAdmin ?? false;

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        backHref={`/${locale}/petitions`}
        title={dict.petitions.title}
        action={
          isAdmin ? (
            <Link
              href={`/${locale}/petitions/${item.id}/edit`}
              className="flex h-11 items-center justify-center rounded-full px-3 text-sm font-semibold text-yellow active:bg-white/10"
            >
              {dict.common.edit}
            </Link>
          ) : undefined
        }
      />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <div className="card space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
            <StatusChip status={item.status} dict={dict} />
          </div>

          <Row label={dict.petitions.department}>
            {departmentLabel(item.department, item.departmentOther, dict)}
          </Row>

          <Row label={dict.petitions.affects}>
            {item.wardNumber ? (
              <Link
                href={`/${locale}/wards/${item.wardNumber}`}
                className="font-medium text-maroon underline"
              >
                {dict.wards.ward} {item.wardNumber}
              </Link>
            ) : (
              dict.petitions.municipalityWide
            )}
          </Row>

          <Row label={dict.petitions.submittedOn}>
            <EventDate
              value={item.submittedOn}
              locale={locale}
              dict={dict}
              withRelative={false}
            />
          </Row>
        </div>

        <div className="card space-y-3">
          <h3 className="section-title">{dict.petitions.whoRaised}</h3>
          <Row label={dict.petitions.petitionerName}>{item.petitionerName}</Row>
          <Row label={dict.petitions.petitionerPhone}>
            {item.petitionerPhone ? (
              // Tapping calls them — this is used standing in the street.
              <a href={`tel:${item.petitionerPhone}`} className="text-maroon underline">
                {item.petitionerPhone}
              </a>
            ) : (
              <span className="text-muted">{dict.common.none}</span>
            )}
          </Row>
          <Row label={dict.petitions.handledBy}>
            {item.handledById ? (
              <Link
                href={`/${locale}/members/${item.handledById}`}
                className="font-medium text-maroon underline"
              >
                {item.handledByName}
              </Link>
            ) : (
              <span className="text-muted">{dict.petitions.unassigned}</span>
            )}
          </Row>
        </div>

        {item.description && (
          <div className="card">
            <h3 className="section-title">{dict.petitions.description}</h3>
            <p className="mt-2 whitespace-pre-line text-foreground">{item.description}</p>
          </div>
        )}

        {photos.length > 0 && (
          <section className="space-y-2">
            <h3 className="section-title">
              {dict.petitions.photos} · {photos.length}
            </h3>
            <ul className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <li key={photo.id}>
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
          <>
            <StatusActions petitionId={item.id} status={item.status} dict={dict} />
            <Link href={`/${locale}/petitions/${item.id}/edit`} className="btn-secondary w-full">
              {dict.petitions.editTitle}
            </Link>
          </>
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
