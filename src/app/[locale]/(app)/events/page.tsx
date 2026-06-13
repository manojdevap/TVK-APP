import { DataSourceBanner } from "@/components/ui/DataSourceBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventsList } from "@/components/events/EventsList";
import { fetchEvents, fetchUsers, fetchWards } from "@/lib/data/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const { data: events, source } = await fetchEvents(locale);
  const { data: wards } = await fetchWards(locale);
  const { data: users } = await fetchUsers();

  return (
    <>
      <DataSourceBanner source={source} dict={dict} />
      <PageHeader title={dict.events.title} description={dict.events.description} />

      {events.length === 0 ? (
        <EmptyState message={dict.dataSource.emptyEvents} />
      ) : (
        <EventsList
          events={events}
          wards={wards}
          users={users}
          locale={locale}
          dict={dict}
        />
      )}
    </>
  );
}
