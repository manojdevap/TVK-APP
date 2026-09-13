ALTER TABLE "events" ADD COLUMN "venue" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "petitions" ADD COLUMN "place" text;--> statement-breakpoint
ALTER TABLE "petitions" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "petitions" ADD COLUMN "longitude" double precision;