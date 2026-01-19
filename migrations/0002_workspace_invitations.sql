CREATE TABLE "workspace_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"role" text NOT NULL,
	"created_by_user_id" varchar NOT NULL,
	"email" text,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"used_by_user_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE INDEX "invitations_token_idx" ON "workspace_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitations_workspace_idx" ON "workspace_invitations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "invitations_expires_at_idx" ON "workspace_invitations" USING btree ("expires_at");
