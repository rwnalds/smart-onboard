CREATE TABLE "agency_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"industry" text NOT NULL,
	"description" text NOT NULL,
	"onboarding_goal" text NOT NULL,
	"tone" text NOT NULL,
	"target_audience" text NOT NULL,
	"max_questions" integer DEFAULT 8 NOT NULL,
	"primary_color" text DEFAULT '#4f46e5' NOT NULL,
	"background_color" text DEFAULT '#ffffff' NOT NULL,
	"text_color" text DEFAULT '#111827' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agency_configs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"question_id" text NOT NULL,
	"question_text" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"agency_config_id" integer,
	"client_name" text,
	"client_email" text,
	"meeting_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration" integer,
	"summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"call_session_id" text NOT NULL,
	"checklist_item_id" integer NOT NULL,
	"completed_at" timestamp NOT NULL,
	"extracted_info" text,
	"transcript_segment_id" integer,
	"manually_marked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"agency_config_id" integer NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"category" text,
	"order" integer NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"call_session_id" text NOT NULL,
	"prompt" text NOT NULL,
	"category" text,
	"suggested" boolean DEFAULT true NOT NULL,
	"used_by_agent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"client_name" text,
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"call_session_id" text NOT NULL,
	"speaker" text NOT NULL,
	"text" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"confidence" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "agency_configs" ADD CONSTRAINT "agency_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_agency_config_id_agency_configs_id_fk" FOREIGN KEY ("agency_config_id") REFERENCES "public"."agency_configs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_completions" ADD CONSTRAINT "checklist_completions_call_session_id_call_sessions_id_fk" FOREIGN KEY ("call_session_id") REFERENCES "public"."call_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_completions" ADD CONSTRAINT "checklist_completions_checklist_item_id_checklist_items_id_fk" FOREIGN KEY ("checklist_item_id") REFERENCES "public"."checklist_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_completions" ADD CONSTRAINT "checklist_completions_transcript_segment_id_transcript_segments_id_fk" FOREIGN KEY ("transcript_segment_id") REFERENCES "public"."transcript_segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_agency_config_id_agency_configs_id_fk" FOREIGN KEY ("agency_config_id") REFERENCES "public"."agency_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_prompts" ADD CONSTRAINT "question_prompts_call_session_id_call_sessions_id_fk" FOREIGN KEY ("call_session_id") REFERENCES "public"."call_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_call_session_id_call_sessions_id_fk" FOREIGN KEY ("call_session_id") REFERENCES "public"."call_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agency_configs_user_id_idx" ON "agency_configs" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agency_configs_slug_idx" ON "agency_configs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "answers_submission_id_idx" ON "answers" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "call_sessions_user_id_idx" ON "call_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "call_sessions_status_idx" ON "call_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "call_sessions_started_at_idx" ON "call_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "checklist_completions_call_session_id_idx" ON "checklist_completions" USING btree ("call_session_id");--> statement-breakpoint
CREATE INDEX "checklist_items_agency_config_id_idx" ON "checklist_items" USING btree ("agency_config_id");--> statement-breakpoint
CREATE INDEX "question_prompts_call_session_id_idx" ON "question_prompts" USING btree ("call_session_id");--> statement-breakpoint
CREATE INDEX "submissions_user_id_idx" ON "submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transcript_segments_call_session_id_idx" ON "transcript_segments" USING btree ("call_session_id");--> statement-breakpoint
CREATE INDEX "transcript_segments_timestamp_idx" ON "transcript_segments" USING btree ("timestamp");