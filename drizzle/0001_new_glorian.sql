CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'manager', 'user');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"session_id" text,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"parameters" jsonb,
	"ip_address" text,
	"user_agent" text,
	"success" boolean NOT NULL,
	"error_message" text,
	"processing_time" integer,
	"result_count" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"query_hash" text NOT NULL,
	"data" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"hit_count" integer DEFAULT 0,
	"last_accessed" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "daily_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"metric_type" text NOT NULL,
	"metric_name" text NOT NULL,
	"value" numeric(20, 2) NOT NULL,
	"metadata" jsonb,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text,
	"user_id" text,
	"event_type" text NOT NULL,
	"event_name" text NOT NULL,
	"properties" jsonb,
	"value" numeric(15, 2),
	"currency" text,
	"page_url" text,
	"page_path" text,
	"referrer" text,
	"user_agent" text,
	"ip_address" text,
	"device_type" text,
	"browser" text,
	"os" text,
	"country" text,
	"region" text,
	"city" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"url" text NOT NULL,
	"path" text NOT NULL,
	"title" text,
	"referrer" text,
	"query_params" jsonb,
	"time_on_page" integer,
	"scroll_depth" integer,
	"viewport_width" integer,
	"viewport_height" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" text NOT NULL,
	"policy_name" text NOT NULL,
	"retention_days" integer NOT NULL,
	"condition" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run" timestamp,
	"next_run" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"ip_address" text,
	"user_agent" text,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_term" text,
	"utm_content" text,
	"device_type" text,
	"browser" text,
	"browser_version" text,
	"os" text,
	"os_version" text,
	"screen_resolution" text,
	"timezone" text,
	"language" text,
	"country" text,
	"region" text,
	"city" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration" integer,
	"page_views" integer DEFAULT 0,
	"interactions" integer DEFAULT 0,
	"is_bounce" boolean DEFAULT false,
	"exit_page" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_consent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"session_id" text,
	"consent_type" text NOT NULL,
	"granted" boolean NOT NULL,
	"version" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"interaction_type" text NOT NULL,
	"element" text,
	"element_id" text,
	"element_class" text,
	"element_text" text,
	"page_url" text NOT NULL,
	"page_path" text NOT NULL,
	"x_coordinate" integer,
	"y_coordinate" integer,
	"viewport_x" integer,
	"viewport_y" integer,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_access_log" ADD CONSTRAINT "analytics_access_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consent" ADD CONSTRAINT "user_consent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_log_user_idx" ON "analytics_access_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "access_log_action_idx" ON "analytics_access_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "access_log_resource_idx" ON "analytics_access_log" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "access_log_timestamp_idx" ON "analytics_access_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "access_log_success_idx" ON "analytics_access_log" USING btree ("success");--> statement-breakpoint
CREATE INDEX "analytics_cache_key_idx" ON "analytics_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "analytics_cache_expires_idx" ON "analytics_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "analytics_cache_query_hash_idx" ON "analytics_cache" USING btree ("query_hash");--> statement-breakpoint
CREATE INDEX "daily_analytics_date_idx" ON "daily_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "daily_analytics_metric_type_idx" ON "daily_analytics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "daily_analytics_metric_name_idx" ON "daily_analytics" USING btree ("metric_name");--> statement-breakpoint
CREATE INDEX "daily_analytics_composite_idx" ON "daily_analytics" USING btree ("date","metric_type","metric_name");--> statement-breakpoint
CREATE INDEX "events_user_idx" ON "events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_session_idx" ON "events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "events_event_type_idx" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "events_event_name_idx" ON "events" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "events_timestamp_idx" ON "events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "page_views_session_idx" ON "page_views" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "page_views_user_idx" ON "page_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "page_views_url_idx" ON "page_views" USING btree ("url");--> statement-breakpoint
CREATE INDEX "page_views_timestamp_idx" ON "page_views" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "retention_policies_table_idx" ON "retention_policies" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "retention_policies_enabled_idx" ON "retention_policies" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "retention_policies_next_run_idx" ON "retention_policies" USING btree ("next_run");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_session_id_idx" ON "sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "sessions_started_at_idx" ON "sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "user_consent_user_idx" ON "user_consent" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_consent_session_idx" ON "user_consent" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "user_consent_type_idx" ON "user_consent" USING btree ("consent_type");--> statement-breakpoint
CREATE INDEX "user_consent_granted_at_idx" ON "user_consent" USING btree ("granted_at");--> statement-breakpoint
CREATE INDEX "interactions_session_idx" ON "user_interactions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "interactions_user_idx" ON "user_interactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "interactions_type_idx" ON "user_interactions" USING btree ("interaction_type");--> statement-breakpoint
CREATE INDEX "interactions_timestamp_idx" ON "user_interactions" USING btree ("timestamp");