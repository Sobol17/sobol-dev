import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MAX_LEADS_PER_IP_PER_HOUR, MIN_FILL_MS, scoreSpam } from '$lib/utils/spam';

const signals = fc.record({
	input: fc.record({
		goal: fc.string({ maxLength: 2000 }),
		contactName: fc.string({ maxLength: 120 })
	}),
	meta: fc.record({
		honeypot: fc.string({ maxLength: 200 }),
		submittedAtMs: fc.integer({ min: 0, max: 2 ** 42 })
	}),
	fillDurationMs: fc.integer({ min: -10_000, max: 10 * 60 * 1000 }),
	recentFromIp: fc.integer({ min: 0, max: 50 })
});

describe('spam scoring', () => {
	it('always lands inside 0..100', () => {
		fc.assert(
			fc.property(signals, (candidate) => {
				const score = scoreSpam(candidate);
				expect(score).toBeGreaterThanOrEqual(0);
				expect(score).toBeLessThanOrEqual(100);
			})
		);
	});

	it('is deterministic for the same signals', () => {
		fc.assert(
			fc.property(signals, (candidate) => {
				expect(scoreSpam(candidate)).toBe(scoreSpam(candidate));
			})
		);
	});

	it('never scores a filled honeypot lower than the same empty one', () => {
		fc.assert(
			fc.property(signals, fc.string({ minLength: 1, maxLength: 50 }), (candidate, trap) => {
				const clean = scoreSpam({ ...candidate, meta: { ...candidate.meta, honeypot: '' } });
				const trapped = scoreSpam({
					...candidate,
					meta: { ...candidate.meta, honeypot: ` ${trap}` }
				});
				expect(trapped).toBeGreaterThanOrEqual(clean);
			})
		);
	});

	it('scores an instant submission at least as high as a slow one', () => {
		fc.assert(
			fc.property(signals, (candidate) => {
				const fast = scoreSpam({ ...candidate, fillDurationMs: 0 });
				const slow = scoreSpam({ ...candidate, fillDurationMs: MIN_FILL_MS + 1 });
				expect(fast).toBeGreaterThanOrEqual(slow);
			})
		);
	});

	it('reaches the spam threshold on a filled honeypot alone', () => {
		fc.assert(
			fc.property(signals, (candidate) => {
				const score = scoreSpam({
					...candidate,
					meta: { ...candidate.meta, honeypot: 'bot' },
					fillDurationMs: 60_000,
					recentFromIp: MAX_LEADS_PER_IP_PER_HOUR - 1
				});
				expect(score).toBeGreaterThanOrEqual(50);
			})
		);
	});
});
