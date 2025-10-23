CREATE TABLE "user_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"publisher_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_bookmarks_user_idx" ON "user_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_bookmarks_publisher_idx" ON "user_bookmarks" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX "user_bookmarks_unique_idx" ON "user_bookmarks" USING btree ("user_id","publisher_id");