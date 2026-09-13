import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { PetitionForm } from "@/components/petitions/PetitionForm";
import { DeletePetitionButton } from "@/components/petitions/DeletePetitionButton";
import { getSession } from "@/lib/auth/guard";
import { listWards } from "@/server/queries";
import { getPetition, listPetitionPhotos } from "@/server/petition-queries";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function EditPetitionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  const locale = resolveLocale(localeParam);

  const session = await getSession();
  // Someone without admin rights is sent to the petition itself, not turned away.
  if (!session?.isAdmin) redirect(`/${locale}/petitions/${id}`);

  const [dict, item] = await Promise.all([getDictionary(locale), getPetition(id)]);
  if (!item) notFound();

  const [photos, wards] = await Promise.all([listPetitionPhotos(item.id), listWards()]);

  return (
    <>
      <AppHeader
        locale={locale}
        dict={dict}
        backHref={`/${locale}/petitions/${item.id}`}
        title={dict.petitions.editTitle}
      />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <PetitionForm
          locale={locale}
          dict={dict}
          wards={wards}
          petitionId={item.id}
          handlerName={item.handledByName ?? ""}
          cancelHref={`/${locale}/petitions/${item.id}`}
          petition={{
            title: item.title,
            scope: item.wardId ? "ward" : "municipality",
            wardId: item.wardId ?? "",
            place: item.place ?? "",
            latitude: item.latitude,
            longitude: item.longitude,
            petitionerName: item.petitionerName,
            petitionerPhone: item.petitionerPhone ?? "",
            submittedOn: item.submittedOn,
            description: item.description ?? "",
            department: item.department,
            departmentOther: item.departmentOther ?? "",
            status: item.status,
            handledById: item.handledById ?? "",
            photoUrls: photos.map((photo) => photo.url),
          }}
        />

        {/* Deleting leaves nothing to return to, so this one goes back to the list */}
        <DeletePetitionButton
          petitionId={item.id}
          dict={dict}
          redirectTo={`/${locale}/petitions`}
        />
      </main>
    </>
  );
}
