CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'sent', 'opened', 'accepted', 'expired', 'cancelled', 'declined');--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."invitation_status";--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "status" SET DATA TYPE "public"."invitation_status" USING "status"::"public"."invitation_status";--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "opened_at" timestamp;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "expired_at" timestamp;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "declined_at" timestamp;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "email_subject" text;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "email_template" text;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "response_time" integer;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "reminder_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitation_status_idx" ON "invitation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invitation_inviter_idx" ON "invitation" USING btree ("inviter_id");--> statement-breakpoint
CREATE INDEX "invitation_created_at_idx" ON "invitation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "invitation_expires_at_idx" ON "invitation" USING btree ("expires_at");