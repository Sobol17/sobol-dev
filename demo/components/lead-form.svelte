<script lang="ts">
	import { onMount, untrack, flushSync } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import * as v from 'valibot';
	import { COPY, FORM } from '../../src/routes/(public)/landing-content';
	import { leadInputSchema, leadTypeSchema } from '$lib/schemas/lead';
	import { Button, Field, Input, RadioCards, Select, Stepper, Textarea } from '$lib/ui';
	import { LEAD_STEPS, LeadFormState } from '$lib/state/lead-form.svelte';
	import { BUDGET_LABELS, TIMELINE_LABELS } from '$lib/utils/format';
	import type { BudgetRange, LeadType, TimelineRange } from '$lib/types';
	let { initialType }: { initialType?: LeadType } = $props();
	let formElement: HTMLFormElement;
	let enhanced = $state(false);
	let errors = $state<Partial<Record<keyof typeof FORM.errors, { message: string }[]>>>({});
	const form = new LeadFormState({ type: untrack(() => initialType) });
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
	onMount(() => {
		enhanced = true;
	});
	afterNavigate(() => {
		const type = v.safeParse(leadTypeSchema, page.url.searchParams.get('type'));
		if (type.success) form.type = type.output;
	});
	function advance(direction: 'next' | 'back') {
		flushSync(() => form[direction]());
		const name = form.step === 0 ? 'goal' : form.step === 1 ? 'budget' : 'contactName';
		(formElement.elements.namedItem(name) as HTMLElement | null)?.focus();
	}
	function previewSubmission(event: SubmitEvent) {
		event.preventDefault();
		if (form.step < 2) {
			advance('next');
			return;
		}
		const result = v.safeParse(leadInputSchema, {
			type: form.type,
			goal: form.goal,
			budget: form.budget,
			timeline: form.timeline,
			contactName: form.contactName,
			contactEmail: form.contactEmail,
			contactTelegram: form.contactTelegram
		});
		errors = {};
		if (!result.success) {
			for (const failure of result.issues) {
				const key = failure.path?.[0]?.key as keyof typeof FORM.errors;
				if (key && key in FORM.errors) errors[key] = [{ message: failure.message }];
			}
			flushSync(() => form.showFirstInvalid(Object.keys(errors)));
			formElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			return;
		}
		void goto(`${base}/thanks/`);
	}
</script>

{#if enhanced}
	<Stepper step={form.step} steps={FORM.steps} class="mb-8" />
{/if}

<form onsubmit={previewSubmission} bind:this={formElement} class="grid gap-8" novalidate>
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
		{#if issue(errors.type, 'type')}
			<p class="mt-2 text-[13px] text-danger" role="alert">{COPY.form.typeError}</p>
		{/if}
		<Field
			label={FORM.goal}
			for="goal"
			hint={FORM.goalHint}
			error={issue(errors.goal, 'goal')}
			required
		>
			<Textarea
				name="goal"
				rows={5}
				maxlength={2000}
				placeholder={COPY.form.goalPlaceholder}
				bind:value={form.goal}
				invalid={Boolean(errors.goal)}
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
			error={issue(errors.contactName, 'contactName')}
			required
		>
			<Input
				name="contactName"
				autocomplete="name"
				placeholder={COPY.form.namePlaceholder}
				bind:value={form.contactName}
				invalid={Boolean(errors.contactName)}
			/>
		</Field>

		<div class="grid gap-6 sm:grid-cols-2">
			<Field
				label={FORM.email}
				for="contactEmail"
				hint={FORM.contactHint}
				error={issue(errors.contactEmail, 'contactEmail')}
			>
				<Input
					name="contactEmail"
					type="email"
					autocomplete="email"
					placeholder={FORM.emailPlaceholder}
					bind:value={form.contactEmail}
					invalid={Boolean(errors.contactEmail)}
				/>
			</Field>
			<Field
				label={FORM.telegram}
				for="contactTelegram"
				error={issue(errors.contactTelegram, 'contactTelegram')}
			>
				<Input
					name="contactTelegram"
					placeholder={FORM.telegramPlaceholder}
					bind:value={form.contactTelegram}
					invalid={Boolean(errors.contactTelegram)}
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
			<Button type="submit" size="lg" disabled={!enhanced}>Показать результат</Button>
		{/if}

		<p class="text-[13px] leading-relaxed text-muted">
			Демо: данные не отправляются и не сохраняются. Используйте вымышленные контакты.
		</p>
	</div>
</form>
