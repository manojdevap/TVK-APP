import { EventsManager } from "@/components/admin/EventsManager";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function AdminEventsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const dict = await getDictionary((await params).locale);
  return <EventsManager dict={dict} />;
}
