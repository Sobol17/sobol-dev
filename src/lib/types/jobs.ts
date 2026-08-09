// Type-only import: erased at compile time, so this file stays safe for the client bundle.
import type { Topic } from '$lib/server/queue/topics';

export type JobStatus = 'pending' | 'active' | 'done' | 'failed';

export interface LeadSubmittedPayload {
	leadId: string;
}
export interface MediaProcessPayload {
	mediaId: string;
}
export interface OutboxDispatchPayload {
	messageId: string;
}

export interface PublishOptions {
	uniqueKey?: string;
	runAt?: Date;
	maxAttempts?: number;
}

export interface JobQueue {
	/** Enqueues a job. Called inside the caller's transaction so data and job commit together. */
	publish<T extends object>(topic: Topic, payload: T, options?: PublishOptions): void;
}
