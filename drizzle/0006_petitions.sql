CREATE TYPE "public"."department" AS ENUM('electricity_board', 'revenue_board', 'corporation', 'water_board', 'police', 'other');--> statement-breakpoint
CREATE TYPE "public"."petition_status" AS ENUM('submitted', 'in_progress', 'resolved', 'rejected');--> statement-breakpoint
CREATE TABLE "petition_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"petition_id" uuid NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "petitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"ward_id" uuid NOT NULL,
	"petitioner_name" text NOT NULL,
	"petitioner_phone" text,
	"department" "department" DEFAULT 'corporation' NOT NULL,
	"status" "petition_status" DEFAULT 'submitted' NOT NULL,
	"submitted_on" date NOT NULL,
	"handled_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "petition_photos" ADD CONSTRAINT "petition_photos_petition_id_petitions_id_fk" FOREIGN KEY ("petition_id") REFERENCES "public"."petitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petitions" ADD CONSTRAINT "petitions_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petitions" ADD CONSTRAINT "petitions_handled_by_id_members_id_fk" FOREIGN KEY ("handled_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "petition_photos_petition_idx" ON "petition_photos" USING btree ("petition_id","sort_order");--> statement-breakpoint
CREATE INDEX "petitions_ward_idx" ON "petitions" USING btree ("ward_id");--> statement-breakpoint
CREATE INDEX "petitions_status_idx" ON "petitions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "petitions_submitted_idx" ON "petitions" USING btree ("submitted_on");