import { redirect } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { PetitionForm } from "@/components/petitions/PetitionForm";
import { getSession } from "@/lib/auth/guard";
import { listWards } from "@/server/queries";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function NewPetitionPage({
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
  if (!session?.isAdmin) redirect(`/${locale}/petitions`);

  const [dict, wards] = await Promise.all([getDictionary(locale), listWards()]);

  // Arriving from a ward page pre-selects that ward.
  const preselectedWard = wards.find((w) => w.id === ward)?.id ?? "";

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        backHref={`/${locale}/petitions`}
        title={dict.petitions.newTitle}
      />

      <main className="mx-auto max-w-lg px-4 py-4">
        <PetitionForm
          locale={locale}
          dict={dict}
          wards={wards}
          cancelHref={`/${locale}/petitions`}
          petition={{
            title: "",
            scope: "ward",
            wardId: preselectedWard,
            petitionerName: "",
            petitionerPhone: "",
            submittedOn: new Date().toISOString().slice(0, 10),
            description: "",
            department: "corporation",
            departmentOther: "",
            status: "submitted",
            handledById: "",
            photoUrls: [],
          }}
        />
      </main>
    </>
  );
}
