ALTER TABLE "riot_accounts" ADD COLUMN "verification_code" text;--> statement-breakpoint
ALTER TABLE "riot_accounts" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;