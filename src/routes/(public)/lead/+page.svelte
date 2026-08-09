<script lang="ts">
	import { onMount } from 'svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Button, Field, Input, RadioCards, Select, Stepper, Textarea } from '$lib/ui';
	import { LEAD_STEPS, LeadFormState } from '$lib/state/lead-form.svelte';
	import { BUDGET_LABELS, LEAD_TYPE_LABELS, TIMELINE_LABELS } from '$lib/utils/format';
	import type { BudgetRange, LeadType, TimelineRange } from '$lib/types';
	import { submitLead } from './lead.remote';

	const form = new LeadFormState();

	/**
	 * Steps collapse only once the client took over. Server-rendered markup shows every
	 * fieldset, so the form stays usable with JS disabled.
	 */
	let enhanced = $state(false);
	onMount(() => {
		enhanced = true;
	});

	const typeOptions = (Object.keys(LEAD_TYPE_LABELS) as LeadType[]).map((value) => ({
		value,
		label: LEAD_TYPE_LABELS[value]
	}));
	const budgetOptions = (Object.keys(BUDGET_LABELS) as BudgetRange[]).map((value) => ({
		value,
		label: BUDGET_LABELS[value]
	}));
	const timelineOptions = (Object.keys(TIMELINE_LABELS) as TimelineRange[]).map((value) => ({
		value,
		label: TIMELINE_LABELS[value]
	}));

	const issue = (issues: { message: string }[] | undefined) => issues?.[0]?.message;
</script>

<SeoHead
	title="Бриф — SobolDev"
	description="Четыре вопроса и контакт. Разберу заявку в день обращения и пришлю смету."
/>

<section class="pt-36 pb-20 md:pt-44 md:pb-28">
	<div class="container-page max-w-[760px]">
		<p class="mb-4 font-mono text-[11px] tracking-[.18em] text-muted uppercase">Заявка</p>
		<h1
			class="font-display text-[32px] leading-[1.08] tracking-[-.03em] sm:text-[44px]"
			style="font-weight:700"
		>
			Соберите бриф — пришлю&nbsp;КП
		</h1>
		<p class="mt-5 text-[16px] leading-relaxed text-muted">
			Четыре вопроса и контакт. Остальное уточню сам, когда буду считать смету.
		</p>

		{#if enhanced}
			<Stepper step={form.step} steps={LEAD_STEPS} class="mt-10" />
		{/if}

		<form {...submitLead} class="mt-10 grid gap-9">
			<fieldset class:hidden={enhanced && form.step !== 0}>
				<legend class="mb-4 flex items-baseline gap-3">
					<span class="font-mono text-[12px] text-accent">01</span>
					<span class="text-[16px] font-medium">Что нужно сделать?</span>
				</legend>
				<RadioCards name="type" options={typeOptions} bind:value={form.type} columns={2} />
				{#if issue(submitLead.fields.type.issues())}
					<p class="mt-2 text-[13px] text-danger" role="alert">Выберите тип проекта</p>
				{/if}
			</fieldset>

			<div class="grid gap-6" class:hidden={enhanced && form.step !== 1}>
				<Field
					label="Что нужно получить в итоге?"
					for="goal"
					hint="Минимум 20 символов. Чем конкретнее, тем точнее смета."
					error={issue(submitLead.fields.goal.issues())}
					required
				>
					<Textarea
						name="goal"
						rows={5}
						maxlength={2000}
						placeholder="Например: интернет-магазин на 30 товаров с оплатой и выгрузкой в 1С"
						bind:value={form.goal}
						invalid={Boolean(submitLead.fields.goal.issues())}
					/>
				</Field>

				<div class="grid gap-6 sm:grid-cols-2">
					<Field label="Бюджет" for="budget">
						<Select name="budget" options={budgetOptions} bind:value={form.budget} />
					</Field>
					<Field label="Когда нужен результат" for="timeline">
						<Select name="timeline" options={timelineOptions} bind:value={form.timeline} />
					</Field>
				</div>
			</div>

			<div class="grid gap-6" class:hidden={enhanced && form.step !== 2}>
				<Field
					label="Как к вам обращаться"
					for="contactName"
					error={issue(submitLead.fields.contactName.issues())}
					required
				>
					<Input
						name="contactName"
						autocomplete="name"
						placeholder="Имя"
						bind:value={form.contactName}
						invalid={Boolean(submitLead.fields.contactName.issues())}
					/>
				</Field>

				<div class="grid gap-6 sm:grid-cols-2">
					<Field
						label="Почта"
						for="contactEmail"
						hint="Достаточно одного канала связи"
						error={issue(submitLead.fields.contactEmail.issues())}
					>
						<Input
							name="contactEmail"
							type="email"
							autocomplete="email"
							placeholder="you@example.com"
							bind:value={form.contactEmail}
							invalid={Boolean(submitLead.fields.contactEmail.issues())}
						/>
					</Field>
					<Field
						label="Telegram"
						for="contactTelegram"
						error={issue(submitLead.fields.contactTelegram.issues())}
					>
						<Input
							name="contactTelegram"
							placeholder="@username"
							bind:value={form.contactTelegram}
							invalid={Boolean(submitLead.fields.contactTelegram.issues())}
						/>
					</Field>
				</div>
			</div>

			<!-- Honeypot. Hidden from people, irresistible to bots. -->
			<div class="absolute -left-[9999px]" aria-hidden="true">
				<label for="website">Не заполняйте это поле</label>
				<input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
			</div>

			<div class="flex flex-wrap items-center gap-3">
				{#if enhanced && form.step > 0}
					<Button variant="secondary" size="lg" onclick={() => form.back()}>Назад</Button>
				{/if}

				{#if enhanced && form.step < LEAD_STEPS.length - 1}
					<Button size="lg" disabled={!form.canAdvance} onclick={() => form.next()}>Дальше</Button>
				{:else}
					<Button type="submit" size="lg" loading={submitLead.pending > 0}>Отправить бриф</Button>
				{/if}

				<p class="text-[13px] leading-relaxed text-muted">
					Отвечу в течение рабочего дня. Данные никуда не передаю.
				</p>
			</div>
		</form>
	</div>
</section>
