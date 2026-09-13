import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

/** The public bodies a grievance is raised with */
export const departmentEnum = pgEnum("department", [
  "electricity_board",
  "revenue_board",
  "corporation",
  "water_board",
  "police",
  "other",
]);

export const petitionStatusEnum = pgEnum("petition_status", [
  "submitted",
  "in_progress",
  "resolved",
  "rejected",
]);

/** Ward 1..N of the municipality. The roster is fixed; wards are edited, not created. */
export const wards = pgTable(
  "wards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: integer("number").notNull(),
    nameEn: text("name_en").notNull().default(""),
    nameTa: text("name_ta").notNull().default(""),
    areaEn: text("area_en").notNull().default(""),
    areaTa: text("area_ta").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("wards_number_key").on(t.number)]
);

/**
 * Party positions, editable by an admin at runtime.
 *
 * These carry no application permissions — an admin can add "Booth Agent" without
 * handing anyone write access. Who may change data is decided by `users.isAdmin`.
 *
 * `maxPerWard` caps how many members of a ward may hold the position; null means
 * unlimited. Organiser is capped at 1, Associate Organiser is not.
 */
export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    nameEn: text("name_en").notNull(),
    nameTa: text("name_ta").notNull().default(""),
    maxPerWard: integer("max_per_ward"),
    sortOrder: integer("sort_order").notNull().default(100),
    /** Seeded roles the app relies on — renameable, but not deletable */
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("roles_slug_key").on(t.slug)]
);

/**
 * A person on the party roster. Members are records, not accounts — they do not
 * sign in. Linking a member to a login comes in a later release.
 */
export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    gender: genderEnum("gender").notNull(),
    address: text("address").notNull().default(""),
    voterId: text("voter_id"),
    /** Absolute URL of the member's photo in blob storage; null when none was taken */
    photoUrl: text("photo_url"),
    wardId: uuid("ward_id")
      .notNull()
      .references(() => wards.id, { onDelete: "restrict" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    joinedOn: date("joined_on"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Two people may share a name; a voter ID identifies exactly one person.
    uniqueIndex("members_voter_id_key").on(sql`upper(${t.voterId})`),
    index("members_ward_idx").on(t.wardId),
    index("members_role_idx").on(t.roleId),
    index("members_name_idx").on(sql`lower(${t.fullName})`),
  ]
);

/**
 * A ward event — a meeting, rally or camp.
 *
 * Title and description are single free-text fields rather than an English/Tamil pair:
 * whoever writes it types in whichever language they use, and the roster is bilingual
 * only where the app itself supplies the words.
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    eventDate: date("event_date").notNull(),
    /** The single image shown at the top of the event and as its thumbnail */
    bannerUrl: text("banner_url"),
    /** The ward this belongs to, or null when the whole party organised it */
    wardId: uuid("ward_id").references(() => wards.id, { onDelete: "restrict" }),
    /** The member running it. Nulled rather than blocking if that member is removed. */
    organiserId: uuid("organiser_id").references(() => members.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("events_ward_idx").on(t.wardId),
    index("events_date_idx").on(t.eventDate),
    index("events_organiser_idx").on(t.organiserId),
  ]
);

/**
 * Gallery images for an event.
 *
 * A table rather than an array column so a single picture can be removed with one
 * delete, instead of reading the whole list, filtering it and writing it back —
 * which would lose a concurrent upload.
 */
export const eventPhotos = pgTable(
  "event_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("event_photos_event_idx").on(t.eventId, t.sortOrder)]
);

/**
 * A grievance raised by a resident, tracked until the department settles it.
 *
 * The petitioner is recorded as plain text, not a link to a member: the people
 * bringing complaints are residents of the ward, and most of them are not on the
 * party roster.
 */
export const petitions = pgTable(
  "petitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    /** The ward it concerns, or null when it affects the whole municipality */
    wardId: uuid("ward_id").references(() => wards.id, { onDelete: "restrict" }),
    petitionerName: text("petitioner_name").notNull(),
    petitionerPhone: text("petitioner_phone"),
    department: departmentEnum("department").notNull().default("corporation"),
    /** Free text naming the body, used only when department is "other" */
    departmentOther: text("department_other"),
    status: petitionStatusEnum("status").notNull().default("submitted"),
    submittedOn: date("submitted_on").notNull(),
    /** The member who took it up, if anyone has */
    handledById: uuid("handled_by_id").references(() => members.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("petitions_ward_idx").on(t.wardId),
    index("petitions_status_idx").on(t.status),
    index("petitions_submitted_idx").on(t.submittedOn),
  ]
);

/** Evidence photos for a petition — the same shape as the event gallery */
export const petitionPhotos = pgTable(
  "petition_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    petitionId: uuid("petition_id")
      .notNull()
      .references(() => petitions.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("petition_photos_petition_idx").on(t.petitionId, t.sortOrder)]
);

/** Someone who can sign in. In this release every account is an admin. */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull(),
    displayName: text("display_name").notNull().default(""),
    passwordHash: text("password_hash").notNull(),
    isAdmin: boolean("is_admin").notNull().default(false),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_username_key").on(sql`lower(${t.username})`)]
);

/**
 * Sign-in throttle. Serverless instances do not share memory, so failed attempts
 * are counted in the database or they are not counted at all.
 */
export const loginAttempts = pgTable("login_attempts", {
  username: text("username").primaryKey(),
  failures: integer("failures").notNull().default(0),
  firstFailureAt: timestamp("first_failure_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Ward = typeof wards.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type EventRecord = typeof events.$inferSelect;
export type EventPhoto = typeof eventPhotos.$inferSelect;
export type Petition = typeof petitions.$inferSelect;
export type PetitionPhoto = typeof petitionPhotos.$inferSelect;
export type Department = (typeof departmentEnum.enumValues)[number];
export type PetitionStatus = (typeof petitionStatusEnum.enumValues)[number];
export type User = typeof users.$inferSelect;
export type Gender = (typeof genderEnum.enumValues)[number];
