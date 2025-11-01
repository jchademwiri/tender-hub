-- Email preferences table for user notification settings
CREATE TABLE IF NOT EXISTS "email_preferences" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "invitations" boolean DEFAULT true NOT NULL,
    "password_reset" boolean DEFAULT true NOT NULL,
    "email_verification" boolean DEFAULT true NOT NULL,
    "account_deletion" boolean DEFAULT true NOT NULL,
    "password_changed" boolean DEFAULT true NOT NULL,
    "approval_decisions" boolean DEFAULT true NOT NULL,
    "system_maintenance" boolean DEFAULT true NOT NULL,
    "user_status_changes" boolean DEFAULT true NOT NULL,
    "marketing_emails" boolean DEFAULT false NOT NULL,
    "weekly_digest" boolean DEFAULT true NOT NULL,
    "monthly_report" boolean DEFAULT true NOT NULL,
    "immediate_notifications" boolean DEFAULT true NOT NULL,
    "daily_digest" boolean DEFAULT false NOT NULL,
    "weekly_digest_notifications" boolean DEFAULT false NOT NULL,
    "unsubscribe_token" text,
    "unsubscribed_at" timestamp,
    "unsubscribe_reason" text,
    "last_updated" timestamp DEFAULT now() NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "email_preferences_user_id_unique" UNIQUE("user_id"),
    CONSTRAINT "email_preferences_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
-- Email delivery log for tracking sent emails
CREATE TABLE IF NOT EXISTS "email_delivery_log" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text,
    "recipient" text NOT NULL,
    "email_type" text NOT NULL,
    "subject" text NOT NULL,
    "message_id" text,
    "status" text NOT NULL,
    "delivery_time" integer,
    "retry_count" integer DEFAULT 0 NOT NULL,
    "error_message" text,
    "metadata" jsonb,
    "sent_at" timestamp DEFAULT now() NOT NULL,
    "delivered_at" timestamp,
    "bounced_at" timestamp,
    "opened_at" timestamp,
    "clicked_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);
-- Add foreign key constraints
DO $$ BEGIN
ALTER TABLE "email_preferences"
ADD CONSTRAINT "email_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
ALTER TABLE "email_delivery_log"
ADD CONSTRAINT "email_delivery_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE
set null ON UPDATE no action;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- Create indexes
CREATE INDEX IF NOT EXISTS "email_preferences_user_idx" ON "email_preferences" ("user_id");
CREATE INDEX IF NOT EXISTS "email_preferences_unsubscribe_idx" ON "email_preferences" ("unsubscribe_token");
CREATE INDEX IF NOT EXISTS "email_delivery_user_idx" ON "email_delivery_log" ("user_id");
CREATE INDEX IF NOT EXISTS "email_delivery_recipient_idx" ON "email_delivery_log" ("recipient");
CREATE INDEX IF NOT EXISTS "email_delivery_type_idx" ON "email_delivery_log" ("email_type");
CREATE INDEX IF NOT EXISTS "email_delivery_status_idx" ON "email_delivery_log" ("status");
CREATE INDEX IF NOT EXISTS "email_delivery_sent_at_idx" ON "email_delivery_log" ("sent_at");