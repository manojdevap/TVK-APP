import "server-only";
import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { members, petitionPhotos, petitions, wards } from "@/db/schema";
import type { Department, PetitionStatus } from "@/db/schema";

export type PetitionRow = {
  id: string;
  title: string;
  description: string | null;
  wardId: string | null;
  wardNumber: number | null;
  petitionerName: string;
  petitionerPhone: string | null;
  department: Department;
  departmentOther: string | null;
  status: PetitionStatus;
  submittedOn: string;
  handledById: string | null;
  handledByName: string | null;
};

const petitionColumns = {
  id: petitions.id,
  title: petitions.title,
  description: petitions.description,
  wardId: petitions.wardId,
  wardNumber: wards.number,
  petitionerName: petitions.petitionerName,
  petitionerPhone: petitions.petitionerPhone,
  department: petitions.department,
  departmentOther: petitions.departmentOther,
  status: petitions.status,
  submittedOn: petitions.submittedOn,
  handledById: petitions.handledById,
  handledByName: members.fullName,
};

/** Sentinel used in the ward filter to mean "petitions with no ward" */
export const MUNICIPALITY_WIDE = "municipality";

export type PetitionSearch = {
  query?: string;
  wardId?: string;
  status?: string;
  department?: string;
  page?: number;
  pageSize?: number;
};

export type PetitionPage = {
  rows: PetitionRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

const STATUSES: PetitionStatus[] = ["submitted", "in_progress", "resolved", "rejected"];
const DEPARTMENTS: Department[] = [
  "electricity_board",
  "revenue_board",
  "corporation",
  "water_board",
  "police",
  "other",
];

/** Newest grievance first — the queue is worked from the top */
export async function searchPetitions(options: PetitionSearch = {}): Promise<PetitionPage> {
  const db = getDb();
  const pageSize = Math.min(Math.max(options.pageSize ?? 25, 1), 100);
  const page = Math.max(options.page ?? 1, 1);

  const term = options.query?.trim();
  const status = STATUSES.find((s) => s === options.status);
  const department = DEPARTMENTS.find((d) => d === options.department);

  const filters = [
    options.wardId === MUNICIPALITY_WIDE
      ? isNull(petitions.wardId)
      : options.wardId
        ? eq(petitions.wardId, options.wardId)
        : undefined,
    status ? eq(petitions.status, status) : undefined,
    department ? eq(petitions.department, department) : undefined,
    term
      ? or(
          ilike(petitions.title, `%${term}%`),
          ilike(petitions.description, `%${term}%`),
          ilike(petitions.petitionerName, `%${term}%`),
          ilike(petitions.petitionerPhone, `%${term}%`)
        )
      : undefined,
  ].filter((f) => f !== undefined);

  const where = filters.length ? and(...filters) : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(petitions)
    .where(where);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);

  const rows = await db
    .select(petitionColumns)
    .from(petitions)
    .leftJoin(wards, eq(petitions.wardId, wards.id))
    .leftJoin(members, eq(petitions.handledById, members.id))
    .where(where)
    .orderBy(desc(petitions.submittedOn), desc(petitions.createdAt))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  return { rows, total, page: safePage, pageSize, pageCount };
}

export async function getPetition(id: string): Promise<PetitionRow | null> {
  const db = getDb();
  const rows = await db
    .select(petitionColumns)
    .from(petitions)
    .leftJoin(wards, eq(petitions.wardId, wards.id))
    .leftJoin(members, eq(petitions.handledById, members.id))
    .where(eq(petitions.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listWardPetitions(wardId: string, limit = 10): Promise<PetitionRow[]> {
  const db = getDb();
  return db
    .select(petitionColumns)
    .from(petitions)
    .leftJoin(wards, eq(petitions.wardId, wards.id))
    .leftJoin(members, eq(petitions.handledById, members.id))
    .where(eq(petitions.wardId, wardId))
    .orderBy(desc(petitions.submittedOn))
    .limit(limit);
}

export type PetitionPhotoRow = { id: string; url: string; sortOrder: number };

export async function listPetitionPhotos(petitionId: string): Promise<PetitionPhotoRow[]> {
  const db = getDb();
  return db
    .select({
      id: petitionPhotos.id,
      url: petitionPhotos.url,
      sortOrder: petitionPhotos.sortOrder,
    })
    .from(petitionPhotos)
    .where(eq(petitionPhotos.petitionId, petitionId))
    .orderBy(asc(petitionPhotos.sortOrder), asc(petitionPhotos.createdAt));
}

/** Counts for the dashboard: how much is still outstanding */
export async function getPetitionTotals() {
  const db = getDb();
  const rows = await db
    .select({ status: petitions.status, n: sql<number>`count(*)::int` })
    .from(petitions)
    .groupBy(petitions.status);

  const byStatus = Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<
    PetitionStatus,
    number | undefined
  >;

  const total = rows.reduce((sum, r) => sum + r.n, 0);
  const open = (byStatus.submitted ?? 0) + (byStatus.in_progress ?? 0);

  return { total, open, resolved: byStatus.resolved ?? 0 };
}
