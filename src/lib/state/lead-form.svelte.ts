import type { BudgetRange, LeadType, TimelineRange } from '$lib/types';

export const LEAD_STEPS = ['Что нужно', 'Задача', 'Контакт'];

/**
 * Form state for the multi-step lead form. A class in `.svelte.ts` keeps the fields reactive
 * across imports, which an exported `$state` variable would not.
 */
export class LeadFormState {
	step = $state(0);
	type = $state<LeadType | ''>('');
	goal = $state('');
	budget = $state<BudgetRange>('unknown');
	timeline = $state<TimelineRange>('unknown');
	contactName = $state('');
	contactEmail = $state('');
	contactTelegram = $state('');

	// Derived, not an effect: recomputed automatically, no sync bugs.
	readonly typeChosen = $derived(this.type !== '');
	readonly goalFilled = $derived(this.goal.trim().length >= 20);
	readonly contactFilled = $derived(
		this.contactName.trim().length >= 2 &&
			(this.contactEmail.trim().length > 0 || this.contactTelegram.trim().length > 0)
	);
	readonly canSubmit = $derived(this.typeChosen && this.goalFilled && this.contactFilled);

	readonly canAdvance = $derived(
		this.step === 0 ? this.typeChosen : this.step === 1 ? this.goalFilled : this.canSubmit
	);

	next(): void {
		if (this.step < LEAD_STEPS.length - 1 && this.canAdvance) this.step += 1;
	}

	back(): void {
		if (this.step > 0) this.step -= 1;
	}
}
