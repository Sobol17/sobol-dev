<script lang="ts">
	import { COPY, FORM } from '../landing-content';
	import { leadInputSchema } from '$lib/schemas/lead';
	import { onMount, untrack, tick } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import * as v from 'valibot';
	import { leadTypeSchema } from '$lib/schemas/lead';
	import { Button, Field, Input, RadioCards, Select, Stepper, Textarea } from '$lib/ui';
	import { LEAD_STEPS, LeadFormState } from '$lib/state/lead-form.svelte';
	import { getToastStore } from '$lib/state/toast.svelte';
	import { BUDGET_LABELS, TIMELINE_LABELS } from '$lib/utils/format';
	import type { BudgetRange, LeadType, TimelineRange } from '$lib/types';
	import { submitLead } from './lead.remote';

	let formElement: HTMLFormElement;
	const FIELD_NAMES = [
		'type',
		'goal',
		'budget',
		'timeline',
		'contactName',
		'contactEmail',
		'contactTelegram'
	] as const;

	let { initialType }: { initialType?: LeadType } = $props();

	const toasts = getToastStore();

	/**
	 * Seeded twice over: from the type the landing passed in the query, then from whatever the
	 * server echoed back after a rejected submission. Without JS that is what refills the form.
	 */
	const form = new LeadFormState({
		// Untracked on purpose: seeding runs once, after that the visitor owns the field.
		type: submitLead.fields.type.value() ?? untrack(() => initialType),
		goal: submitLead.fields.goal.value(),
		budget: submitLead.fields.budget.value(),
		timeline: submitLead.fields.timeline.value(),
		contactName: submitLead.fields.contactName.value(),
		contactEmail: submitLead.fields.contactEmail.value(),
		contactTelegram: submitLead.fields.contactTelegram.value()
	});

	/**
	 * Enhanced submit keeps the visitor on the step that failed instead of leaving them on the
	 * contact step staring at a form that looks fine.
	 */
	const formAttributes = submitLead.preflight(leadInputSchema).enhance(async ({ submit }) => {
		try {
			await submit();
		} catch {
			toasts.error(FORM.networkError);
			return;
		}

		const rejected = FIELD_NAMES.filter((field) => submitLead.fields[field].issues());
		if (form.showFirstInvalid(rejected)) {
			toasts.error(FORM.validationError);
			await tick();
			formElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
		}
	});

	/**
	 * Steps collapse only once the client took over. Server-rendered markup shows every
	 * fieldset, so the form stays usable with JS disabled.
	 */
	let enhanced = $state(false);
	onMount(() => {
		enhanced = true;
	});

	const typeOptions = FORM.types;
	const budgetOptions = (Object.keys(BUDGET_LABELS) as BudgetRange[]).map((value) => ({
		value,
		label: BUDGET_LABELS[value]
	}));
	const timelineOptions = (Object.keys(TIMELINE_LABELS) as TimelineRange[]).map((value) => ({
		value,
		label: TIMELINE_LABELS[value]
	}));

	const issue = (
		issues: { message: string }[] | undefined,
		field: keyof typeof FORM.errors = 'type'
	) => (issues?.length ? FORM.errors[field] : undefined);
	afterNavigate(({ from }) => {
		if (from?.url.search === page.url.search) return;
		const type = v.safeParse(leadTypeSchema, page.url.searchParams.get('type'));
		if (type.success) form.type = type.output;
	});
	const action = $derived.by(() => {
		const params = new SvelteURLSearchParams(page.url.search);
		const remote = new SvelteURLSearchParams(formAttributes.action.slice(1));
		for (const [key, value] of remote) params.set(key, value);
		return `${page.url.pathname}?${params}#brief`;
	});
	async function advance(direction: 'next' | 'back') {
		form[direction]();
		await tick();
		const name = form.step === 0 ? 'goal' : form.step === 1 ? 'budget' : 'contactName';
		(formElement.elements.namedItem(name) as HTMLElement | null)?.focus();
	}
</script>

{#if enhanced}
	<Stepper step={form.step} steps={FORM.steps} class="mb-8" />
{/if}

<form {...formAttributes} {action} bind:this={formElement} class="grid gap-8" novalidate>
	<fieldset class:hidden={enhanced && form.step !== 0}>
		<legend class="mb-4 flex items-baseline gap-3">
			<span class="font-mono text-[12px] text-accent">01</span>
			<span class="text-[16px] font-medium">{COPY.form.typeLabel}</span>
		</legend>
		<RadioCards
			name="type"
			options={typeOptions}
			bind:value={form.type}
			columns={2}
			class="type-options mb-6 flex flex-wrap gap-2"
		/>
		{#if issue(submitLead.fields.type.issues(), 'type')}
			<p class="mt-2 text-[13px] text-danger" role="alert">{COPY.form.typeError}</p>
		{/if}
		<Field
			label={FORM.goal}
			for="goal"
			hint={FORM.goalHint}
			error={issue(submitLead.fields.goal.issues(), 'goal')}
			required
		>
			<Textarea
				name="goal"
				rows={5}
				maxlength={2000}
				placeholder={COPY.form.goalPlaceholder}
				bind:value={form.goal}
				invalid={Boolean(submitLead.fields.goal.issues())}
			/>
		</Field>
	</fieldset>

	<div class="grid gap-6" class:hidden={enhanced && form.step !== 1}>
		<div class="grid gap-6 sm:grid-cols-2">
			<Field label={FORM.budget} for="budget">
				<Select name="budget" options={budgetOptions} bind:value={form.budget} />
			</Field>
			<Field label={FORM.timeline} for="timeline">
				<Select name="timeline" options={timelineOptions} bind:value={form.timeline} />
			</Field>
		</div>
	</div>

	<div class="grid gap-6" class:hidden={enhanced && form.step !== 2}>
		<Field
			label={FORM.name}
			for="contactName"
			error={issue(submitLead.fields.contactName.issues(), 'contactName')}
			required
		>
			<Input
				name="contactName"
				autocomplete="name"
				placeholder={COPY.form.namePlaceholder}
				bind:value={form.contactName}
				invalid={Boolean(submitLead.fields.contactName.issues())}
			/>
		</Field>

		<div class="grid gap-6 sm:grid-cols-2">
			<Field
				label={FORM.email}
				for="contactEmail"
				hint={FORM.contactHint}
				error={issue(submitLead.fields.contactEmail.issues(), 'contactEmail')}
			>
				<Input
					name="contactEmail"
					type="email"
					autocomplete="email"
					placeholder={FORM.emailPlaceholder}
					bind:value={form.contactEmail}
					invalid={Boolean(submitLead.fields.contactEmail.issues())}
				/>
			</Field>
			<Field
				label={FORM.telegram}
				for="contactTelegram"
				error={issue(submitLead.fields.contactTelegram.issues(), 'contactTelegram')}
			>
				<Input
					name="contactTelegram"
					placeholder={FORM.telegramPlaceholder}
					bind:value={form.contactTelegram}
					invalid={Boolean(submitLead.fields.contactTelegram.issues())}
				/>
			</Field>
		</div>
	</div>

	<!-- Honeypot. Hidden from people, irresistible to bots. -->
	<div class="absolute -left-[9999px]" aria-hidden="true">
		<label for="website">{COPY.form.honeypotLabel}</label>
		<Input name="website" type="text" tabindex="-1" autocomplete="off" />
	</div>

	<div class="flex flex-wrap items-center gap-3">
		{#if enhanced && form.step > 0}
			<Button variant="secondary" size="lg" onclick={() => advance('back')}>{COPY.form.back}</Button
			>
		{/if}

		{#if enhanced && form.step < LEAD_STEPS.length - 1}
			<Button size="lg" disabled={!form.canAdvance} onclick={() => advance('next')}
				>{COPY.form.next}</Button
			>
		{:else}
			<Button type="submit" size="lg" loading={submitLead.pending > 0}>{COPY.form.submit}</Button>
		{/if}

		<p class="text-[13px] leading-relaxed text-muted">{COPY.form.note}</p>
	</div>
</form>
