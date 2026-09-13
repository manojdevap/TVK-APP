CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"username" text PRIMARY KEY NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"first_failure_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"gender" "gender" NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"voter_id" text,
	"ward_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"joined_on" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ta" text DEFAULT '' NOT NULL,
	"max_per_ward" integer,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"password_hash" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer NOT NULL,
	"name_en" text DEFAULT '' NOT NULL,
	"name_ta" text DEFAULT '' NOT NULL,
	"area_en" text DEFAULT '' NOT NULL,
	"area_ta" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "members_voter_id_key" ON "members" USING btree (upper("voter_id"));--> statement-breakpoint
CREATE INDEX "members_ward_idx" ON "members" USING btree ("ward_id");--> statement-breakpoint
CREATE INDEX "members_role_idx" ON "members" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "members_name_idx" ON "members" USING btree (lower("full_name"));--> statement-breakpoint
CREATE UNIQUE INDEX "roles_slug_key" ON "roles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_key" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX "wards_number_key" ON "wards" USING btree ("number");