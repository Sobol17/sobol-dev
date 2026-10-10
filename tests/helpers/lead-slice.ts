import { SqliteUnitOfWork } from '$lib/server/db/unit-of-work';
import { FixedClock } from '$lib/server/domain/clock';
import { LeadService } from '$lib/server/domain/lead.service';
import { RateLimitService } from '$lib/server/domain/rate-limit.service';
import { LeadRepository } from '$lib/server/repositories/lead.repository';
import type { LeadInput, RequestMeta } from '$lib/types';
import { createTestDb } from './db';

/** Wire submission and admin services against a real temporary database. */
export function createLeadSlice(now = new Date('2026-03-01T10:00:00.000Z')) {
	const db = createTestDb();
	const clock = new FixedClock(now);
	const leadRepository = new LeadRepository(db.db);
	const leads = new LeadService(
		leadRepository,
		new SqliteUnitOfWork(db.db),
		new RateLimitService(clock),
		clock
	);
	return { db, clock, leads, leadRepository, dispose: () => db.drop() };
}

export function leadInput(overrides: Partial<LeadInput> = {}): LeadInput {
	return {
		type: 'web',
		goal: 'Нужен интернет-магазин на тридцать товаров с оплатой и выгрузкой в 1С',
		budget: '3k_10k',
		timeline: '1_3m',
		contactName: 'Игорь',
		contactTelegram: '@client',
		...overrides
	};
}

export function requestMeta(overrides: Partial<RequestMeta> = {}): RequestMeta {
	return {
		ipHash: 'ip-hash-1',
		userAgent: 'vitest',
		referrer: null,
		// Long enough before the clock to clear the minimum fill duration.
		submittedAtMs: new Date('2026-03-01T09:59:00.000Z').getTime(),
		honeypot: '',
		...overrides
	};
}
