import { eq } from 'drizzle-orm';
import { createDb } from '../src/lib/server/db/index';
import { leads, leadNotes, users, LEAD_STATUSES, LEAD_TYPES } from '../src/lib/server/db/schema';
import { hashPassword } from '../src/lib/server/security/password';
import { databaseFile } from './env';

const handle = createDb(databaseFile());
try {
	const email = process.env.SEED_ADMIN_EMAIL ?? 'owner@example.test';
	const passwordHash = await hashPassword(process.env.SEED_ADMIN_PASSWORD ?? 'change-me-right-now');
	handle.db
		.insert(users)
		.values({ email, passwordHash, displayName: 'Owner' })
		.onConflictDoNothing()
		.run();
	const admin = handle.db.select().from(users).where(eq(users.email, email)).get()!;
	handle.db.transaction((tx) => {
		for (let i = 0; i < 8; i += 1) {
			const publicId = `DEMO0${i + 1}`;
			tx.insert(leads)
				.values({
					publicId,
					type: LEAD_TYPES[i % LEAD_TYPES.length],
					goal: 'Демонстрационная заявка: собрать заказы и контакты клиентов в одном сервисе.',
					contactName: `Демо-клиент ${i + 1}`,
					contactEmail: i % 2 === 0 ? `client${i + 1}@example.test` : null,
					contactTelegram: i % 2 === 1 ? `@demo_client_${i + 1}` : null,
					status: LEAD_STATUSES[i % LEAD_STATUSES.length],
					spamScore: i === 5 ? 100 : 0,
					utm: { source: 'seed' }
				})
				.onConflictDoNothing()
				.run();
			if (i < 2) {
				const lead = tx.select().from(leads).where(eq(leads.publicId, publicId)).get()!;
				tx.insert(leadNotes)
					.values({
						id: `seed-note-${i + 1}`,
						leadId: lead.id,
						authorId: admin.id,
						body: 'Демонстрационная заметка: уточнить состав первого релиза.'
					})
					.onConflictDoNothing()
					.run();
			}
		}
	});
	console.log('seeded eight demo leads, two notes and an admin');
} finally {
	handle.close();
}
