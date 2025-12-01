CREATE TABLE "agent_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"agent_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"conversations_handled" integer DEFAULT 0 NOT NULL,
	"messages_received" integer DEFAULT 0 NOT NULL,
	"messages_sent" integer DEFAULT 0 NOT NULL,
	"avg_first_response_time" integer,
	"avg_resolution_time" integer,
	"csat_total" integer DEFAULT 0 NOT NULL,
	"csat_count" integer DEFAULT 0 NOT NULL,
	"transfers_in" integer DEFAULT 0 NOT NULL,
	"transfers_out" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_metrics_agent_date" UNIQUE("agent_id","date")
);
--> statement-breakpoint
CREATE TABLE "automation_runs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" varchar NOT NULL,
	"bot_id" varchar NOT NULL,
	"session_id" varchar,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"status" text DEFAULT 'running' NOT NULL,
	"trigger_context" json DEFAULT '{}'::json,
	"actions_executed" integer DEFAULT 0,
	"result" json DEFAULT '{"success":false}'::json,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "automation_workflows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bot_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger_type" text NOT NULL,
	"trigger_config" json DEFAULT '{}'::json,
	"conditions" json DEFAULT '[]'::json,
	"actions" json DEFAULT '[]'::json,
	"status" text DEFAULT 'active' NOT NULL,
	"priority" integer DEFAULT 10 NOT NULL,
	"throttle_seconds" integer DEFAULT 0,
	"max_executions_per_session" integer,
	"schedule_timezone" text DEFAULT 'America/New_York',
	"next_scheduled_run" timestamp,
	"last_scheduled_run" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_flow_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flow_id" varchar NOT NULL,
	"version" integer NOT NULL,
	"name" text,
	"description" text,
	"nodes" json DEFAULT '[]'::json NOT NULL,
	"edges" json DEFAULT '[]'::json NOT NULL,
	"variables" json DEFAULT '[]'::json,
	"settings" json DEFAULT '{}'::json,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_flows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"bot_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"flow_type" text DEFAULT 'conversation' NOT NULL,
	"current_version_id" varchar,
	"is_published" boolean DEFAULT false NOT NULL,
	"triggers" json DEFAULT '[]'::json,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_runs" integer DEFAULT 0 NOT NULL,
	"successful_runs" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"config" json DEFAULT '{}'::json,
	"status" text DEFAULT 'active' NOT NULL,
	"last_sync_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"activity_type" text NOT NULL,
	"actor_id" varchar,
	"actor_type" text NOT NULL,
	"actor_name" text,
	"description" text,
	"old_value" text,
	"new_value" text,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_type" text NOT NULL,
	"sender_id" varchar,
	"sender_name" text,
	"sender_avatar" text,
	"content" text NOT NULL,
	"content_type" text DEFAULT 'text' NOT NULL,
	"rich_content" json,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"is_ai_generated" boolean DEFAULT false NOT NULL,
	"ai_confidence" integer,
	"ai_source_ids" text[],
	"external_message_id" varchar,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "conversation_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"bot_id" varchar NOT NULL,
	"content" text NOT NULL,
	"author_id" varchar NOT NULL,
	"author_name" varchar,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"bot_id" varchar,
	"channel_id" varchar NOT NULL,
	"external_id" varchar,
	"contact_id" varchar,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"contact_avatar" text,
	"subject" text,
	"tags" text[] DEFAULT '{}',
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_agent_id" varchar,
	"assigned_team" text,
	"is_handled_by_bot" boolean DEFAULT true NOT NULL,
	"bot_handoff_reason" text,
	"message_count" integer DEFAULT 0 NOT NULL,
	"first_response_at" timestamp,
	"resolved_at" timestamp,
	"csat_score" integer,
	"csat_feedback" text,
	"ai_context" json DEFAULT '{}'::json,
	"custom_fields" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"auth_type" text NOT NULL,
	"config" json DEFAULT '{}'::json,
	"settings" json DEFAULT '{}'::json,
	"status" text DEFAULT 'active' NOT NULL,
	"last_sync_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"source_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"content" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"token_count" integer,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"content" text NOT NULL,
	"metadata" json DEFAULT '{}'::json,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"content_hash" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"bot_id" varchar,
	"source_type" text NOT NULL,
	"name" text NOT NULL,
	"config" json NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"status_message" text,
	"document_count" integer DEFAULT 0 NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"last_sync_at" timestamp,
	"next_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_attachments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"mime_type" text,
	"file_size" integer,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_states" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"bot_id" varchar NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"read_by_user_id" varchar,
	"assigned_to_user_id" varchar,
	"assigned_at" timestamp,
	"priority" text DEFAULT 'normal',
	"tags" text[] DEFAULT ARRAY[]::text[],
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_states_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" text DEFAULT 'info' NOT NULL,
	"source" text NOT NULL,
	"workspace_id" varchar,
	"client_id" varchar,
	"user_id" varchar,
	"session_id" varchar,
	"message" text NOT NULL,
	"details" json DEFAULT '{}'::json,
	"error_code" varchar,
	"stack_trace" text,
	"request_method" varchar,
	"request_path" varchar,
	"ip_address" varchar,
	"user_agent" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widget_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bot_id" varchar NOT NULL,
	"position" text DEFAULT 'bottom-right' NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"primary_color" text DEFAULT '#2563eb' NOT NULL,
	"accent_color" text,
	"avatar_url" text,
	"bubble_size" text DEFAULT 'medium' NOT NULL,
	"window_width" integer DEFAULT 360,
	"window_height" integer DEFAULT 520,
	"border_radius" integer DEFAULT 16,
	"show_powered_by" boolean DEFAULT true NOT NULL,
	"header_title" text,
	"header_subtitle" text DEFAULT 'Online',
	"welcome_message" text,
	"placeholder_text" text DEFAULT 'Type your message...',
	"offline_message" text DEFAULT 'We''re currently offline. Leave a message!',
	"auto_open" boolean DEFAULT false NOT NULL,
	"auto_open_delay" integer DEFAULT 5,
	"auto_open_once" boolean DEFAULT true NOT NULL,
	"sound_enabled" boolean DEFAULT false NOT NULL,
	"sound_url" text,
	"mobile_fullscreen" boolean DEFAULT true NOT NULL,
	"mobile_breakpoint" integer DEFAULT 480,
	"custom_css" text,
	"advanced" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "widget_settings_bot_id_unique" UNIQUE("bot_id")
);
--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "client_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "client_settings" ALTER COLUMN "client_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "conversation_analytics" ALTER COLUMN "client_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "bot_settings" ADD COLUMN "quick_actions" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "client_settings" ADD COLUMN "external_booking_url" text;--> statement-breakpoint
ALTER TABLE "client_settings" ADD COLUMN "external_payment_url" text;--> statement-breakpoint
ALTER TABLE "client_settings" ADD COLUMN "webhook_url" text;--> statement-breakpoint
ALTER TABLE "client_settings" ADD COLUMN "webhook_secret" text;--> statement-breakpoint
ALTER TABLE "client_settings" ADD COLUMN "webhook_events" json DEFAULT '{"newLead":true,"newAppointment":true,"chatSessionStart":false,"chatSessionEnd":false,"leadStatusChange":false}'::json;--> statement-breakpoint
ALTER TABLE "client_settings" ADD COLUMN "webhook_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "agent_metrics_workspace_id_idx" ON "agent_metrics" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_metrics_agent_id_idx" ON "agent_metrics" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_metrics_date_idx" ON "agent_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "automation_runs_workflow_id_idx" ON "automation_runs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "automation_runs_bot_id_idx" ON "automation_runs" USING btree ("bot_id");--> statement-breakpoint
CREATE INDEX "automation_runs_session_id_idx" ON "automation_runs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "automation_runs_triggered_at_idx" ON "automation_runs" USING btree ("triggered_at");--> statement-breakpoint
CREATE INDEX "automation_runs_status_idx" ON "automation_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "automation_workflows_bot_id_idx" ON "automation_workflows" USING btree ("bot_id");--> statement-breakpoint
CREATE INDEX "automation_workflows_status_idx" ON "automation_workflows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "automation_workflows_trigger_type_idx" ON "automation_workflows" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "bot_flow_versions_flow_id_idx" ON "bot_flow_versions" USING btree ("flow_id");--> statement-breakpoint
CREATE INDEX "bot_flow_versions_version_idx" ON "bot_flow_versions" USING btree ("version");--> statement-breakpoint
CREATE INDEX "bot_flows_workspace_id_idx" ON "bot_flows" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "bot_flows_bot_id_idx" ON "bot_flows" USING btree ("bot_id");--> statement-breakpoint
CREATE INDEX "bot_flows_status_idx" ON "bot_flows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bot_flows_flow_type_idx" ON "bot_flows" USING btree ("flow_type");--> statement-breakpoint
CREATE INDEX "channels_workspace_id_idx" ON "channels" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "channels_type_idx" ON "channels" USING btree ("type");--> statement-breakpoint
CREATE INDEX "channels_status_idx" ON "channels" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversation_activities_conversation_id_idx" ON "conversation_activities" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "conversation_activities_activity_type_idx" ON "conversation_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "conversation_activities_created_at_idx" ON "conversation_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "conversation_messages_conversation_id_idx" ON "conversation_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "conversation_messages_sender_type_idx" ON "conversation_messages" USING btree ("sender_type");--> statement-breakpoint
CREATE INDEX "conversation_messages_created_at_idx" ON "conversation_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "conversation_notes_session_id_idx" ON "conversation_notes" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "conversation_notes_client_id_idx" ON "conversation_notes" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "conversation_notes_bot_id_idx" ON "conversation_notes" USING btree ("bot_id");--> statement-breakpoint
CREATE INDEX "conversation_notes_author_id_idx" ON "conversation_notes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "conversations_workspace_id_idx" ON "conversations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "conversations_bot_id_idx" ON "conversations" USING btree ("bot_id");--> statement-breakpoint
CREATE INDEX "conversations_channel_id_idx" ON "conversations" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "conversations_status_idx" ON "conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversations_assigned_agent_id_idx" ON "conversations" USING btree ("assigned_agent_id");--> statement-breakpoint
CREATE INDEX "conversations_contact_id_idx" ON "conversations" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "conversations_last_message_at_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "integrations_workspace_id_idx" ON "integrations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "integrations_type_idx" ON "integrations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "integrations_provider_idx" ON "integrations" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "integrations_status_idx" ON "integrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_document_id_idx" ON "knowledge_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_source_id_idx" ON "knowledge_chunks" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_workspace_id_idx" ON "knowledge_chunks" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_documents_source_id_idx" ON "knowledge_documents" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "knowledge_documents_workspace_id_idx" ON "knowledge_documents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_sources_workspace_id_idx" ON "knowledge_sources" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_sources_bot_id_idx" ON "knowledge_sources" USING btree ("bot_id");--> statement-breakpoint
CREATE INDEX "knowledge_sources_status_idx" ON "knowledge_sources" USING btree ("status");--> statement-breakpoint
CREATE INDEX "message_attachments_message_id_idx" ON "message_attachments" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "session_states_session_id_idx" ON "session_states" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_states_client_id_idx" ON "session_states" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "session_states_bot_id_idx" ON "session_states" USING btree ("bot_id");--> statement-breakpoint
CREATE INDEX "session_states_status_idx" ON "session_states" USING btree ("status");--> statement-breakpoint
CREATE INDEX "session_states_is_read_idx" ON "session_states" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "session_states_assigned_to_idx" ON "session_states" USING btree ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX "system_logs_level_idx" ON "system_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "system_logs_source_idx" ON "system_logs" USING btree ("source");--> statement-breakpoint
CREATE INDEX "system_logs_workspace_id_idx" ON "system_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "system_logs_client_id_idx" ON "system_logs" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "system_logs_created_at_idx" ON "system_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "system_logs_is_resolved_idx" ON "system_logs" USING btree ("is_resolved");--> statement-breakpoint
CREATE INDEX "widget_settings_bot_id_idx" ON "widget_settings" USING btree ("bot_id");--> statement-breakpoint
ALTER TABLE "monthly_usage" ADD CONSTRAINT "monthly_usage_client_month_unique" UNIQUE("client_id","month");