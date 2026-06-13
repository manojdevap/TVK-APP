import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { GenderBreakdown } from "@/components/ui/GenderBreakdown";
import { PageHeader } from "@/components/ui/PageHeader";
import { PhotoGrid } from "@/components/ui/MediaDisplay";
import { AppImage } from "@/components/ui/AppImage";
import { fetchEvents, fetchUsers, fetchWards } from "@/lib/data/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { genderBreakdown } from "@/lib/stats";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale);

  const { data: events } = await fetchEvents(locale);
  const event = events.find((e) => e.id === id);
  if (!event) notFound();

  const { data: wards } = await fetchWards(locale);
  const { data: users } = await fetchUsers();

  const ward = wards.find((w) => w.id === event.wardId);
  const organiser = users.find((u) => u.id === event.organiserId);
  const participants = event.participantIds.map((pid) => users.find((u) => u.id === pid)!).filter(Boolean);
  const invited = event.invitedIds.map((iid) => users.find((u) => u.id === iid)!).filter(Boolean);

  return (
    <>
      <BackLink href={`/${locale}/events`}>{dict.common.backToEvents}</BackLink>

      <PageHeader title={event.title} description={`${event.date} · ${event.location}`} />

      <div className="flex flex-wrap gap-2">
        <Badge variant="info">{dict.eventStatus[event.status]}</Badge>
        {ward && <Badge>{ward.name}</Badge>}
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-foreground">{dict.events.descriptionHeading}</h2>
        <p className="mt-2 text-muted">{event.description}</p>
        {organiser && (
          <p className="mt-4 text-sm text-muted">
            {dict.events.organisedBy} {organiser.username}
          </p>
        )}
      </Card>

      {event.photos.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold text-foreground">{dict.events.photos}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {event.photos.map((photo) => (
              <div key={photo} className="relative h-48 overflow-hidden rounded-lg bg-background">
                <AppImage src={photo} alt={event.title} fill className="object-cover" />
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GenderBreakdown title={dict.events.participantsMF} stats={genderBreakdown(participants)} maleLabel={dict.common.male} femaleLabel={dict.common.female} />
        <GenderBreakdown title={dict.events.invitedMF} stats={genderBreakdown(invited)} maleLabel={dict.common.male} femaleLabel={dict.common.female} />
      </div>
    </>
  );
}
