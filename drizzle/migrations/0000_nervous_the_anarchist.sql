CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"body" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"secret_key" text NOT NULL,
	"avatar_base64" text NOT NULL,
	CONSTRAINT "users_secret_key_unique" UNIQUE("secret_key")
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;