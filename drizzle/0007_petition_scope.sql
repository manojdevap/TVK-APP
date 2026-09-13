ALTER TABLE "petitions" ALTER COLUMN "ward_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "petitions" ADD COLUMN "department_other" text;