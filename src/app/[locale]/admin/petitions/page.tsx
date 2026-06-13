import { PetitionsManager } from "@/components/admin/PetitionsManager";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function AdminPetitionsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const dict = await getDictionary((await params).locale);
  return <PetitionsManager dict={dict} />;
}
