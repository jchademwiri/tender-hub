CREATE TABLE "email_delivery_log" (
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
--> statement-breakpoint
CREATE TABLE "email_preferences" (
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
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "email_delivery_log" ADD CONSTRAINT "email_delivery_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_delivery_user_idx" ON "email_delivery_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_delivery_recipient_idx" ON "email_delivery_log" USING btree ("recipient");--> statement-breakpoint
CREATE INDEX "email_delivery_type_idx" ON "email_delivery_log" USING btree ("email_type");--> statement-breakpoint
CREATE INDEX "email_delivery_status_idx" ON "email_delivery_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_delivery_sent_at_idx" ON "email_delivery_log" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "email_preferences_user_idx" ON "email_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_preferences_unsubscribe_idx" ON "email_preferences" USING btree ("unsubscribe_token");