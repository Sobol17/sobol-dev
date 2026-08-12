import { SqliteUnitOfWork } from '$lib/server/db/unit-of-work';
import { FixedClock } from '$lib/server/domain/clock';
import { ProjectService } from '$lib/server/domain/project.service';
import { ProjectRepository } from '$lib/server/repositories/project.repository';
import type { ProjectInput } from '$lib/schemas/project';
import { createTestDb, type TestDb } from './db';

/** The projects slice wired the way the container wires it, on a database of its own. */
export function createProjectSlice(now = new Date('2026-04-01T09:00:00.000Z')) {
	const db: TestDb = createTestDb();
	const clock = new FixedClock(now);
	const repository = new ProjectRepository(db.db);
	const projects = new ProjectService(repository, new SqliteUnitOfWork(db.db), clock);

	return { db, clock, repository, projects, dispose: () => db.drop() };
}

export function projectInput(overrides: Partial<ProjectInput> = {}): ProjectInput {
	return {
		title: 'Панель дилера',
		slug: undefined,
		category: 'web',
		summary: 'Личный кабинет дилера с заказами, остатками и выгрузкой документов в 1С.',
		body: '## Задача\n\nЗаказы приходили в почту и терялись.',
		clientName: undefined,
		roleText: undefined,
		year: undefined,
		durationWeeks: undefined,
		liveUrl: undefined,
		repoUrl: undefined,
		tags: [],
		metrics: [],
		featured: false,
		...overrides
	};
}
