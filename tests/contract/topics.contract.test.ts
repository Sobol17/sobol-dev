import { expect, it } from 'vitest';
import { TOPICS } from '$lib/server/queue/topics';
import { createLeadSlice } from '../helpers/lead-slice';
it('registers exactly the two core v4 topics in the production handler factory', () => {
	const slice = createLeadSlice();
	try {
		expect(Object.values(TOPICS).sort()).toEqual(['lead.submitted', 'outbox.dispatch']);
		expect(Object.keys(slice.handlers).sort()).toEqual(Object.values(TOPICS).sort());
		expect(Object.values(slice.handlers).every((handler) => typeof handler === 'function')).toBe(
			true
		);
	} finally {
		slice.dispose();
	}
});
