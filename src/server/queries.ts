import "server-only";
import { alias } from "drizzle-orm/pg-core";
import { and, asc, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { eventPhotos, events, members, roles, wards } from "@/db/schema";

// The events query already joins wards; aliasing members keeps the organiser join distinct.
const organisers = alias(members, "organisers");
const organiserWards = alias(wards, "organiser_wards");

/** Sentinel used in the ward filter to mean "events with no ward" */
export const PARTY_WIDE = "party";

export type WardSummary = {
  id: string;
  number: number;
  nameEn: string;
  nameTa: string;
  areaEn: string;
  areaTa: string;
  memberCount: number;
};

export type MemberRow = {
  id: string;
  fullName: string;
  phone: string | null;
  gender: "male" | "female" | "other";
  address: string;
  voterId: string | null;
  photoUrl: string | null;
  joinedOn: string | null;
  notes: string | null;
  wardId: string;
  wardNumber: number;
  roleId: string;
  roleSlug: string;
  roleNameEn: string;
  roleNameTa: string;
  roleSortOrder: number;
};

const memberColumns = {
  id: members.id,
  fullName: members.fullName,
  phone: members.phone,
  gender: members.gender,
  address: members.address,
  voterId: members.voterId,
  photoUrl: members.photoUrl,
  joinedOn: members.joinedOn,
  notes: members.notes,
  wardId: members.wardId,
  wardNumber: wards.number,
  roleId: members.roleId,
  roleSlug: roles.slug,
  roleNameEn: roles.nameEn,
  roleNameTa: roles.nameTa,
  roleSortOrder: roles.sortOrder,
};

export async function listRoles() {
  const db = getDb();
  return db.select().from(roles).orderBy(asc(roles.sortOrder), asc(roles.nameEn));
}

export async function listWards(): Promise<WardSummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: wards.id,
      number: wards.number,
      nameEn: wards.nameEn,
      nameTa: wards.nameTa,
      areaEn: wards.areaEn,
      areaTa: wards.areaTa,
      memberCount: count(members.id),
    })
    .from(wards)
    .leftJoin(members, eq(members.wardId, wards.id))
    .groupBy(wards.id)
    .orderBy(asc(wards.number));

  return rows;
}

export async function getWardByNumber(number: number) {
  const db = getDb();
  const rows = await db.select().from(wards).where(eq(wards.number, number)).limit(1);
  return rows[0] ?? null;
}

/** Members of one ward, leadership positions first */
export async function listWardMembers(wardId: string): Promise<MemberRow[]> {
  const db = getDb();
  return db
    .select(memberColumns)
    .from(members)
    .innerJoin(wards, eq(members.wardId, wards.id))
    .innerJoin(roles, eq(members.roleId, roles.id))
    .where(eq(members.wardId, wardId))
    .orderBy(asc(roles.sortOrder), asc(members.fullName));
}

export async function getMember(id: string): Promise<MemberRow | null> {
  const db = getDb();
  const rows = await db
    .select(memberColumns)
    .from(members)
    .innerJoin(wards, eq(members.wardId, wards.id))
    .innerJoin(roles, eq(members.roleId, roles.id))
    .where(eq(members.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export type MemberSearch = {
  query?: string;
  wardId?: string;
  roleId?: string;
  page?: number;
  pageSize?: number;
};

export type MemberPage = {
  rows: MemberRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

/**
 * Paged in SQL rather than in the browser — a full municipality roster is tens of
 * thousands of people and must never all cross the wire.
 */
export async function searchMembers(options: MemberSearch = {}): Promise<MemberPage> {
  const db = getDb();
  const pageSize = Math.min(Math.max(options.pageSize ?? 25, 1), 100);
  const page = Math.max(options.page ?? 1, 1);

  const term = options.query?.trim();
  const filters = [
    options.wardId ? eq(members.wardId, options.wardId) : undefined,
    options.roleId ? eq(members.roleId, options.roleId) : undefined,
    term
      ? or(
          ilike(members.fullName, `%${term}%`),
          ilike(members.phone, `%${term}%`),
          ilike(members.voterId, `%${term}%`),
          ilike(members.address, `%${term}%`)
        )
      : undefined,
  ].filter((f) => f !== undefined);

  const where = filters.length ? and(...filters) : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(members)
    .where(where);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);

  const rows = await db
    .select(memberColumns)
    .from(members)
    .innerJoin(wards, eq(members.wardId, wards.id))
    .innerJoin(roles, eq(members.roleId, roles.id))
    .where(where)
    .orderBy(asc(members.fullName))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  return { rows, total, page: safePage, pageSize, pageCount };
}

export type Totals = {
  members: number;
  wards: number;
  wardsWithOrganiser: number;
};

export async function getTotals(): Promise<Totals> {
  const db = getDb();

  const [memberRow] = await db.select({ n: sql<number>`count(*)::int` }).from(members);
  const [wardRow] = await db.select({ n: sql<number>`count(*)::int` }).from(wards);
  const [organisedRow] = await db
    .select({ n: sql<number>`count(distinct ${members.wardId})::int` })
    .from(members)
    .innerJoin(roles, eq(members.roleId, roles.id))
    .where(eq(roles.slug, "organiser"));

  return {
    members: memberRow?.n ?? 0,
    wards: wardRow?.n ?? 0,
    wardsWithOrganiser: organisedRow?.n ?? 0,
  };
}

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  bannerUrl: string | null;
  wardId: string | null;
  wardNumber: number | null;
  organiserId: string | null;
  organiserName: string | null;
  organiserWardNumber: number | null;
};

const eventColumns = {
  id: events.id,
  title: events.title,
  description: events.description,
  eventDate: events.eventDate,
  bannerUrl: events.bannerUrl,
  wardId: events.wardId,
  wardNumber: wards.number,
  organiserId: events.organiserId,
  organiserName: organisers.fullName,
  organiserWardNumber: organiserWards.number,
};

export type EventSearch = {
  query?: string;
  /** A ward id, or "party" for events with no ward */
  wardId?: string;
  page?: number;
  pageSize?: number;
};

export type EventPage = {
  rows: EventRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

/** Newest first — an organiser opening the app wants the most recent event, not the oldest */
export async function searchEvents(options: EventSearch = {}): Promise<EventPage> {
  const db = getDb();
  const pageSize = Math.min(Math.max(options.pageSize ?? 25, 1), 100);
  const page = Math.max(options.page ?? 1, 1);

  const term = options.query?.trim();
  const filters = [
    options.wardId === PARTY_WIDE
      ? isNull(events.wardId)
      : options.wardId
        ? eq(events.wardId, options.wardId)
        : undefined,
    term ? or(ilike(events.title, `%${term}%`), ilike(events.description, `%${term}%`)) : undefined,
  ].filter((f) => f !== undefined);

  const where = filters.length ? and(...filters) : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(events)
    .where(where);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);

  const rows = await db
    .select(eventColumns)
    .from(events)
    .leftJoin(wards, eq(events.wardId, wards.id))
    .leftJoin(organisers, eq(events.organiserId, organisers.id))
    .leftJoin(organiserWards, eq(organisers.wardId, organiserWards.id))
    .where(where)
    .orderBy(desc(events.eventDate), desc(events.createdAt))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  return { rows, total, page: safePage, pageSize, pageCount };
}

export type EventGalleryPhoto = { id: string; url: string; sortOrder: number };

/** Gallery images for one event. List pages never need these, so they are fetched alone. */
export async function listEventPhotos(eventId: string): Promise<EventGalleryPhoto[]> {
  const db = getDb();
  return db
    .select({ id: eventPhotos.id, url: eventPhotos.url, sortOrder: eventPhotos.sortOrder })
    .from(eventPhotos)
    .where(eq(eventPhotos.eventId, eventId))
    .orderBy(asc(eventPhotos.sortOrder), asc(eventPhotos.createdAt));
}

export async function getEvent(id: string): Promise<EventRow | null> {
  const db = getDb();
  const rows = await db
    .select(eventColumns)
    .from(events)
    .leftJoin(wards, eq(events.wardId, wards.id))
    .leftJoin(organisers, eq(events.organiserId, organisers.id))
    .leftJoin(organiserWards, eq(organisers.wardId, organiserWards.id))
    .where(eq(events.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listWardEvents(wardId: string, limit = 20): Promise<EventRow[]> {
  const db = getDb();
  return db
    .select(eventColumns)
    .from(events)
    .leftJoin(wards, eq(events.wardId, wards.id))
    .leftJoin(organisers, eq(events.organiserId, organisers.id))
    .leftJoin(organiserWards, eq(organisers.wardId, organiserWards.id))
    .where(eq(events.wardId, wardId))
    .orderBy(desc(events.eventDate))
    .limit(limit);
}

/**
 * Candidates for the organiser picker.
 *
 * With a ward, it lists that ward's members. Without one — a party-wide event — the
 * whole roster is far too long for a phone, so a name is required to narrow it.
 */
export async function listMembersForPicker(options: { wardId?: string; query?: string } = {}) {
  const db = getDb();
  const term = options.query?.trim();

  if (!options.wardId && !term) return [];

  const filters = [
    options.wardId ? eq(members.wardId, options.wardId) : undefined,
    term ? ilike(members.fullName, `%${term}%`) : undefined,
  ].filter((f) => f !== undefined);

  return db
    .select({
      id: members.id,
      fullName: members.fullName,
      wardNumber: wards.number,
    })
    .from(members)
    .innerJoin(wards, eq(members.wardId, wards.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(members.fullName))
    .limit(options.wardId ? 500 : 25);
}
