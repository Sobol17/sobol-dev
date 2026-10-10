<script lang="ts">
	import * as v from 'valibot';
	import { Button, Field, Select } from '$lib/ui';
	import type { LeadStatus } from '$lib/types';
	import { LEAD_TRANSITIONS } from '$lib/utils/lead-status';
	import { LEAD_STATUS_LABELS } from '$lib/utils/format';
	import { errorText } from '$lib/utils/errors';
	import { leadStatusChangeSchema } from '$lib/schemas/lead';
	import { changeLeadStatus, listLeads } from '../leads.remote';
	let { id, status }: { id: string; status: LeadStatus } = $props();
	let selected = $state('');
	let saving = $state(false);
	let error = $state('');
	let saved = $state('');
	const options = $derived([
		{ value: '', label: 'Выберите статус' },
		...LEAD_TRANSITIONS[status].map((value) => ({ value, label: LEAD_STATUS_LABELS[value] }))
	]);
	async function update(target: string) {
		error = '';
		saved = '';
		const parsed = v.safeParse(leadStatusChangeSchema, { id, status: target });
		if (!parsed.success) {
			error = 'Выберите доступный статус';
			return;
		}
		saving = true;
		try {
			await changeLeadStatus(parsed.output).updates(listLeads);
			selected = '';
			saved = 'Статус сохранён';
		} catch (thrown) {
			error = errorText(thrown, 'Не удалось сохранить статус');
		} finally {
			saving = false;
		}
	}
</script>

<div class="grid gap-4">
	{#if status === 'spam'}
		<p class="max-w-[46ch] text-sm leading-6 text-muted">
			Возврат сохранит контакты, источник и заметки заявки.
		</p>
		<Button onclick={() => update('new')} loading={saving} class="justify-self-start"
			>Вернуть в заявки</Button
		>
	{:else}
		<form
			onsubmit={(event) => {
				event.preventDefault();
				void update(selected);
			}}
			class="grid items-end gap-4 sm:grid-cols-[1fr_auto]"
		>
			<Field label="Новый статус" for="new-status" error={error || undefined}
				><Select name="new-status" bind:value={selected} {options} disabled={saving} /></Field
			>
			<Button type="submit" loading={saving} disabled={!selected}>Сохранить статус</Button>
		</form>
	{/if}
	{#if error && status === 'spam'}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
	{#if saved}<p role="status" class="text-sm text-success">{saved}</p>{/if}
</div>
