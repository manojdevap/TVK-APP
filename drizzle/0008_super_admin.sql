ALTER TABLE "users" ADD COLUMN "is_super_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- The only accounts that exist at this point were created from the command line by
-- whoever set the app up, so they keep the highest tier. Every account made after
-- this is a super admin only if a super admin says so.
UPDATE "users" SET "is_super_admin" = true WHERE "is_admin" = true;
