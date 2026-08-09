import {
	sqliteTable,
	text,
	integer,
	index,
	uniqueIndex,
	primaryKey,
	check
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
// Relative path on purpose: drizzle-kit compiles this file outside the SvelteKit alias resolver.
import type { MediaVariant, ProjectMetric, ProposalScopeItem, UtmParams } from '../../types/index';

// ---------- enums as const tuples (single source for schema and types) ----------
export const PROJECT_CATEGORIES = ['web', 'mobile', 'tma'] as const;
export const PUBLISH_STATUSES = ['draft', 'published', 'archived'] as const;
export const MEDIA_STATUSES = ['pending', 'ready', 'failed'] as const;
export const LEAD_TYPES = ['web', 'mobile', 'tma', 'other'] as const;
export const LEAD_STATUSES = ['new', 'qualifying', 'proposal_sent', 'won', 'lost', 'spam'] as const;
export const BUDGET_RANGES = ['under_3k', '3k_10k', '10k_30k', 'over_30k', 'unknown'] as const;
export const TIMELINE_RANGES = ['asap', 'under_1m', '1_3m', 'over_3m', 'unknown'] as const;
export const PROPOSAL_STATUSES = [
	'draft',
	'sent',
	'viewed',
	'accepted',
	'declined',
	'expired'
] as const;
export const OUTBOX_CHANNELS = ['telegram'] as const; // second channel is an append-only change
export const OUTBOX_STATUSES = ['pending', 'sent', 'failed'] as const;
export const JOB_STATUSES = ['pending', 'active', 'done', 'failed'] as const;

const id = () =>
	text('id')
		.primaryKey()
		.$defaultFn(() => randomUUID());
const createdAt = () =>
	integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date());
const updatedAt = () =>
	integer('updated_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date());

// ---------- auth ----------
export const users = sqliteTable(
	'users',
	{
		id: id(),
		email: text('email').notNull(),
		passwordHash: text('password_hash').notNull(),
		displayName: text('display_name').notNull(),
		createdAt: createdAt()
	},
	(t) => [uniqueIndex('users_email_uq').on(t.email)]
);

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(), // sha256 of the raw cookie token
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		ipHash: text('ip_hash'),
		userAgent: text('user_agent'),
		createdAt: createdAt()
	},
	(t) => [index('sessions_user_idx').on(t.userId)]
);

export const authAttempts = sqliteTable(
	'auth_attempts',
	{
		id: id(),
		ipHash: text('ip_hash').notNull(),
		email: text('email'),
		succeeded: integer('succeeded', { mode: 'boolean' }).notNull(),
		createdAt: createdAt()
	},
	(t) => [index('auth_attempts_ip_idx').on(t.ipHash, t.createdAt)]
);

// ---------- media ----------
export const media = sqliteTable(
	'media',
	{
		id: id(),
		storageKey: text('storage_key').notNull(),
		mime: text('mime').notNull(),
		width: integer('width'),
		height: integer('height'),
		sizeBytes: integer('size_bytes').notNull(),
		alt: text('alt'),
		blurhash: text('blurhash'),
		variants: text('variants', { mode: 'json' })
			.$type<MediaVariant[]>()
			.notNull()
			.$defaultFn(() => []),
		status: text('status', { enum: MEDIA_STATUSES }).notNull().default('pending'),
		createdAt: createdAt()
	},
	(t) => [uniqueIndex('media_storage_key_uq').on(t.storageKey)]
);

// ---------- portfolio ----------
export const projects = sqliteTable(
	'projects',
	{
		id: id(),
		slug: text('slug').notNull(),
		title: text('title').notNull(),
		category: text('category', { enum: PROJECT_CATEGORIES }).notNull(),
		summary: text('summary').notNull(),
		body: text('body').notNull(), // markdown, sanitized on render
		clientName: text('client_name'),
		roleText: text('role_text'),
		year: integer('year'),
		durationWeeks: integer('duration_weeks'),
		liveUrl: text('live_url'),
		repoUrl: text('repo_url'),
		coverMediaId: text('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
		metrics: text('metrics', { mode: 'json' })
			.$type<ProjectMetric[]>()
			.notNull()
			.$defaultFn(() => []),
		status: text('status', { enum: PUBLISH_STATUSES }).notNull().default('draft'),
		featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
		position: integer('position').notNull().default(0),
		publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(t) => [
		uniqueIndex('projects_slug_uq').on(t.slug),
		index('projects_list_idx').on(t.status, t.position)
	]
);

export const techTags = sqliteTable(
	'tech_tags',
	{
		id: id(),
		slug: text('slug').notNull(),
		name: text('name').notNull()
	},
	(t) => [uniqueIndex('tech_tags_slug_uq').on(t.slug)]
);

export const projectTags = sqliteTable(
	'project_tags',
	{
		projectId: text('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		tagId: text('tag_id')
			.notNull()
			.references(() => techTags.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.projectId, t.tagId] })]
);

export const projectMedia = sqliteTable(
	'project_media',
	{
		projectId: text('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		mediaId: text('media_id')
			.notNull()
			.references(() => media.id, { onDelete: 'cascade' }),
		position: integer('position').notNull().default(0),
		caption: text('caption')
	},
	(t) => [primaryKey({ columns: [t.projectId, t.mediaId] })]
);

// ---------- leads ----------
export const leads = sqliteTable(
	'leads',
	{
		id: id(),
		publicId: text('public_id').notNull(), // short human-readable ref
		type: text('type', { enum: LEAD_TYPES }).notNull(),
		goal: text('goal').notNull(),
		budget: text('budget', { enum: BUDGET_RANGES }).notNull().default('unknown'),
		timeline: text('timeline', { enum: TIMELINE_RANGES }).notNull().default('unknown'),
		contactName: text('contact_name').notNull(),
		contactEmail: text('contact_email'),
		contactTelegram: text('contact_telegram'),
		status: text('status', { enum: LEAD_STATUSES }).notNull().default('new'),
		utm: text('utm', { mode: 'json' })
			.$type<UtmParams>()
			.notNull()
			.$defaultFn(() => ({})),
		referrer: text('referrer'),
		ipHash: text('ip_hash'),
		userAgent: text('user_agent'),
		spamScore: integer('spam_score').notNull().default(0),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(t) => [
		uniqueIndex('leads_public_id_uq').on(t.publicId),
		index('leads_status_idx').on(t.status, t.createdAt),
		// At least one contact channel must be present.
		check(
			'leads_contact_ck',
			sql`${t.contactEmail} is not null or ${t.contactTelegram} is not null`
		)
	]
);

export const leadNotes = sqliteTable(
	'lead_notes',
	{
		id: id(),
		leadId: text('lead_id')
			.notNull()
			.references(() => leads.id, { onDelete: 'cascade' }),
		authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),
		body: text('body').notNull(),
		createdAt: createdAt()
	},
	(t) => [index('lead_notes_lead_idx').on(t.leadId, t.createdAt)]
);

// ---------- proposals ----------
export const proposals = sqliteTable(
	'proposals',
	{
		id: id(),
		leadId: text('lead_id')
			.notNull()
			.references(() => leads.id, { onDelete: 'cascade' }),
		publicToken: text('public_token').notNull(),
		title: text('title').notNull(),
		bodyMd: text('body_md').notNull(),
		scope: text('scope', { mode: 'json' })
			.$type<ProposalScopeItem[]>()
			.notNull()
			.$defaultFn(() => []),
		priceFrom: integer('price_from'),
		priceTo: integer('price_to'),
		currency: text('currency').notNull().default('EUR'),
		timelineWeeks: integer('timeline_weeks'),
		status: text('status', { enum: PROPOSAL_STATUSES }).notNull().default('draft'),
		validUntil: integer('valid_until', { mode: 'timestamp_ms' }),
		sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
		viewedAt: integer('viewed_at', { mode: 'timestamp_ms' }),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(t) => [
		uniqueIndex('proposals_token_uq').on(t.publicToken),
		index('proposals_lead_idx').on(t.leadId)
	]
);

// ---------- outbox ----------
export const outboxMessages = sqliteTable(
	'outbox_messages',
	{
		id: id(),
		channel: text('channel', { enum: OUTBOX_CHANNELS }).notNull(),
		templateKey: text('template_key').notNull(),
		recipient: text('recipient').notNull(),
		payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
		dedupeKey: text('dedupe_key').notNull(),
		status: text('status', { enum: OUTBOX_STATUSES }).notNull().default('pending'),
		attempts: integer('attempts').notNull().default(0),
		lastError: text('last_error'),
		sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
		createdAt: createdAt()
	},
	(t) => [uniqueIndex('outbox_dedupe_uq').on(t.dedupeKey)]
);

// ---------- queue ----------
export const jobs = sqliteTable(
	'jobs',
	{
		id: id(),
		topic: text('topic').notNull(),
		payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
		uniqueKey: text('unique_key'), // null means no deduplication
		status: text('status', { enum: JOB_STATUSES }).notNull().default('pending'),
		attempts: integer('attempts').notNull().default(0),
		maxAttempts: integer('max_attempts').notNull().default(5),
		runAt: integer('run_at', { mode: 'timestamp_ms' }).notNull(),
		startedAt: integer('started_at', { mode: 'timestamp_ms' }),
		finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
		lastError: text('last_error'),
		createdAt: createdAt()
	},
	(t) => [
		index('jobs_claim_idx').on(t.status, t.runAt),
		// Deduplication applies only to work that has not finished yet.
		uniqueIndex('jobs_unique_open_uq')
			.on(t.uniqueKey)
			.where(sql`unique_key is not null and status in ('pending','active')`)
	]
);
