import type { Locale } from "@/i18n/config";
import type {
  DbEvent,
  DbPetition,
  DbProfile,
  DbWard,
} from "@/types/database";
import type {
  Department,
  Event,
  EventStatus,
  Petition,
  PetitionStatus,
  User,
  UserRole,
  Ward,
} from "@/types";

function localized(en: string, ta: string, locale: Locale): string {
  return locale === "ta" && ta ? ta : en;
}

export function mapWard(row: DbWard, memberIds: string[], locale: Locale): Ward {
  return {
    id: row.id,
    number: row.number,
    name: localized(row.name_en, row.name_ta, locale),
    area: localized(row.area_en, row.area_ta, locale),
    totalVoters: row.total_voters,
    ourVotes: row.our_votes,
    maleVoters: row.male_voters,
    femaleVoters: row.female_voters,
    headId: row.head_id ?? "",
    organiserId: row.organiser_id ?? "",
    memberIds,
  };
}

export function mapProfile(row: DbProfile): User {
  return {
    id: row.id,
    username: row.username,
    address: row.address,
    voterId: row.voter_id ?? "",
    wardId: row.ward_id ?? "",
    role: row.role as UserRole,
    gender: row.gender,
    phone: row.phone ?? undefined,
    isOurVote: row.is_our_vote,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

export function mapEvent(
  row: DbEvent,
  participantIds: string[],
  invitedIds: string[],
  locale: Locale
): Event {
  return {
    id: row.id,
    title: localized(row.title_en, row.title_ta, locale),
    description: localized(row.description_en, row.description_ta, locale),
    wardId: row.ward_id,
    date: row.event_date,
    location: row.location,
    status: row.status as EventStatus,
    photos: row.photos ?? [],
    organiserId: row.organiser_id ?? "",
    participantIds,
    invitedIds,
  };
}

export function mapPetition(row: DbPetition, locale: Locale): Petition {
  return {
    id: row.id,
    title: localized(row.title_en, row.title_ta, locale),
    description: localized(row.description_en, row.description_ta, locale),
    wardId: row.ward_id,
    petitionerId: row.petitioner_id ?? "",
    department: row.department as Department,
    status: row.status as PetitionStatus,
    submittedAt: row.submitted_at,
    photos: row.photos ?? [],
  };
}
