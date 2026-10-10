import type { Db } from '../../src/lib/server/db/index';
import { leads } from '../../src/lib/server/db/schema';

/** Prepared before the server starts, so tests never introduce a second live database writer. */
export function seedAdminLeads(db: Db): void {
	const alphabet = '23456789CDFGHJKMNPQRTVWXY';
	for (let index = 0; index < 23; index++) {
		db.insert(leads)
			.values({
				publicId: `${alphabet[index]}23456`,
				type: index % 2 ? 'tma' : 'web',
				status: index === 22 ? 'spam' : 'new',
				contactName: index === 22 ? 'A4 Спам' : `A4 Клиент ${String(index).padStart(2, '0')}`,
				goal: 'Автоматизация обработки заказов и записи клиентов',
				contactEmail: 'fixture@example.test',
				contactTelegram: '@fixture_client',
				budget: '3k_10k',
				timeline: '1_3m',
				spamScore: index === 22 ? 90 : 0,
				utm: { source: 'telegram', campaign: 'a4' },
				referrer: 'https://t.me/fixture',
				userAgent: 'Fixture browser',
				ipHash: 'fixture-hash',
				createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
				updatedAt: new Date(Date.UTC(2026, 0, 1, 0, index))
			})
			.run();
	}
}
