import { describe, expect, it } from 'vitest';
import { LeadFormState } from '$lib/state/lead-form.svelte';

describe('LeadFormState', () => {
	it('starts on the step it was seeded for and keeps the values it was given', () => {
		const form = new LeadFormState({ type: 'tma', goal: 'x'.repeat(25), contactName: 'Игорь' });

		expect(form.type).toBe('tma');
		expect(form.goal).toHaveLength(25);
		expect(form.contactName).toBe('Игорь');
		expect(form.step).toBe(0);
	});

	it('refuses to advance until the current step is answered', () => {
		const form = new LeadFormState();

		form.next();
		expect(form.step).toBe(0);

		form.type = 'web';
		form.next();
		expect(form.step).toBe(1);

		form.back();
		expect(form.step).toBe(0);
	});

	it('opens the earliest step that owns a rejected field', () => {
		const form = new LeadFormState({ type: 'web', goal: 'x'.repeat(25) });
		form.next();
		form.next();

		expect(form.showFirstInvalid(['contactEmail', 'goal'])).toBe(true);
		expect(form.step).toBe(1);
	});

	it('stays put when the server rejected nothing it knows about', () => {
		const form = new LeadFormState({ type: 'web' });

		expect(form.showFirstInvalid(['website'])).toBe(false);
		expect(form.step).toBe(0);
	});
});
