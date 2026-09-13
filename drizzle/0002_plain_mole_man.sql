CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_date" date NOT NULL,
	"photo_url" text,
	"ward_id" uuid NOT NULL,
	"organiser_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organiser_id_members_id_fk" FOREIGN KEY ("organiser_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_ward_idx" ON "events" USING btree ("ward_id");--> statement-breakpoint
CREATE INDEX "events_date_idx" ON "events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "events_organiser_idx" ON "events" USING btree ("organiser_id");