import { UsersManager } from "@/components/admin/UsersManager";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const dict = await getDictionary((await params).locale);
  return <UsersManager dict={dict} />;
}
