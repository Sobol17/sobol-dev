import { afterEach, expect, it } from 'vitest';
import { createLeadSlice, leadInput, requestMeta } from '../helpers/lead-slice';

let slice: ReturnType<typeof createLeadSlice>;
afterEach(() => slice?.dispose());
it('fails when the database is unavailable instead of confirming a submission', async () => {
	slice = createLeadSlice();
	slice.db.close();
	await expect(slice.leads.submit(leadInput(), requestMeta())).rejects.toThrow();
});
