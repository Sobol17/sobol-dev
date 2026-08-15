import type { BudgetRange, LeadType, TimelineRange } from '$lib/types';

export const LEAD_STEPS = ['Что нужно', 'Задача', 'Контакт'];

/** Which step owns which field. Drives the jump to the first field the server rejected. */
const FIELD_STEPS: Record<string, number> = {
	type: 0,
	goal: 1,
	budget: 1,
	timeline: 1,
	contactName: 2,
	contactEmail: 2,
	contactTelegram: 2
};

export interface LeadFormInitial {
	type?: string;
	goal?: string;
	budget?: string;
	timeline?: string;
	contactName?: string;
	contactEmail?: string;
	contactTelegram?: string;
}

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

	/**
	 * Seeded from the query string and from what the server sent back after a rejected
	 * submission, so a failed post never empties the form the visitor already filled.
	 */
	constructor(initial: LeadFormInitial = {}) {
		this.type = (initial.type ?? '') as LeadType | '';
		this.goal = initial.goal ?? '';
		this.budget = (initial.budget ?? 'unknown') as BudgetRange;
		this.timeline = (initial.timeline ?? 'unknown') as TimelineRange;
		this.contactName = initial.contactName ?? '';
		this.contactEmail = initial.contactEmail ?? '';
		this.contactTelegram = initial.contactTelegram ?? '';
	}

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

	/** Opens the earliest step that owns a rejected field. Returns false when nothing matched. */
	showFirstInvalid(fields: readonly string[]): boolean {
		const steps = fields
			.map((field) => FIELD_STEPS[field])
			.filter((step): step is number => step !== undefined);
		if (steps.length === 0) return false;

		this.step = Math.min(...steps);
		return true;
	}
}
