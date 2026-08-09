CREATE TABLE `auth_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`ip_hash` text NOT NULL,
	`email` text,
	`succeeded` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_attempts_ip_idx` ON `auth_attempts` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`payload` text NOT NULL,
	`unique_key` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 5 NOT NULL,
	`run_at` integer NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`last_error` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `jobs_claim_idx` ON `jobs` (`status`,`run_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_unique_open_uq` ON `jobs` (`unique_key`) WHERE unique_key is not null and status in ('pending','active');--> statement-breakpoint
CREATE TABLE `lead_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`author_id` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `lead_notes_lead_idx` ON `lead_notes` (`lead_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`type` text NOT NULL,
	`goal` text NOT NULL,
	`budget` text DEFAULT 'unknown' NOT NULL,
	`timeline` text DEFAULT 'unknown' NOT NULL,
	`contact_name` text NOT NULL,
	`contact_email` text,
	`contact_telegram` text,
	`status` text DEFAULT 'new' NOT NULL,
	`utm` text NOT NULL,
	`referrer` text,
	`ip_hash` text,
	`user_agent` text,
	`spam_score` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "leads_contact_ck" CHECK("leads"."contact_email" is not null or "leads"."contact_telegram" is not null)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_public_id_uq` ON `leads` (`public_id`);--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`storage_key` text NOT NULL,
	`mime` text NOT NULL,
	`width` integer,
	`height` integer,
	`size_bytes` integer NOT NULL,
	`alt` text,
	`blurhash` text,
	`variants` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_storage_key_uq` ON `media` (`storage_key`);--> statement-breakpoint
CREATE TABLE `outbox_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`template_key` text NOT NULL,
	`recipient` text NOT NULL,
	`payload` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`sent_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outbox_dedupe_uq` ON `outbox_messages` (`dedupe_key`);--> statement-breakpoint
CREATE TABLE `project_media` (
	`project_id` text NOT NULL,
	`media_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`caption` text,
	PRIMARY KEY(`project_id`, `media_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project_tags` (
	`project_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`project_id`, `tag_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tech_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`client_name` text,
	`role_text` text,
	`year` integer,
	`duration_weeks` integer,
	`live_url` text,
	`repo_url` text,
	`cover_media_id` text,
	`metrics` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_uq` ON `projects` (`slug`);--> statement-breakpoint
CREATE INDEX `projects_list_idx` ON `projects` (`status`,`position`);--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`public_token` text NOT NULL,
	`title` text NOT NULL,
	`body_md` text NOT NULL,
	`scope` text NOT NULL,
	`price_from` integer,
	`price_to` integer,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`timeline_weeks` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`valid_until` integer,
	`sent_at` integer,
	`viewed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proposals_token_uq` ON `proposals` (`public_token`);--> statement-breakpoint
CREATE INDEX `proposals_lead_idx` ON `proposals` (`lead_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_hash` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `tech_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tech_tags_slug_uq` ON `tech_tags` (`slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_uq` ON `users` (`email`);