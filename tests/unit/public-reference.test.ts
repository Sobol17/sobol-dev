import { describe, expect, it } from 'vitest';
import { generatePublicId, parsePublicId } from '../../src/lib/utils/public-id';

describe('public reference on the confirmation page', () => {
	it('accepts the reference issued by the lead service', () => {
		const reference = generatePublicId();
		expect(parsePublicId(reference)).toBe(reference);
	});
	it.each([null, undefined, '', '123456', 'demo01', 'CDFGHJ7', '<script>', ' CDFGHJ', ['CDFGHJ']])(
		'rejects an absent or malformed reference: %j',
		(value) => expect(parsePublicId(value)).toBeNull()
	);
});
