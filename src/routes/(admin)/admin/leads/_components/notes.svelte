<script lang="ts">
	import * as v from 'valibot';
	import { Button, Card, Field, Textarea } from '$lib/ui';
	import { formatDate } from '$lib/utils/format';
	import { errorText } from '$lib/utils/errors';
	import { leadNoteSchema } from '$lib/schemas/lead';
	import { addLeadNote, getLead } from '../leads.remote';
	let { id, notes }: { id: string; notes: Awaited<ReturnType<typeof getLead>>['notes'] } = $props();
	let body = $state('');
	let saving = $state(false);
	let error = $state('');
	let saved = $state('');
	async function add() {
		error = '';
		saved = '';
		const parsed = v.safeParse(leadNoteSchema, { id, body });
		if (!parsed.success) {
			error = 'Напишите заметку от 1 до 4000 символов';
			return;
		}
		saving = true;
		try {
			await addLeadNote(parsed.output);
			body = '';
			saved = 'Заметка добавлена';
		} catch (thrown) {
			error = errorText(thrown, 'Не удалось добавить заметку');
		} finally {
			saving = false;
		}
	}
</script>

<section aria-labelledby="notes-title" class="mt-8">
	<h2 id="notes-title" class="text-xl font-semibold tracking-[-.02em]">Заметки</h2>
	<p class="mt-2 max-w-[46ch] text-sm leading-6 text-muted">
		История работы с заявкой. Сохранённые заметки остаются без изменений.
	</p>
	<ul class="mt-4 grid gap-4" aria-label="История заметок">
		{#each notes as note (note.id)}
			<li>
				<Card padding="sm"
					><div class="flex flex-wrap justify-between gap-2 text-xs leading-5 text-muted">
						<span>{note.authorName ?? 'Удалённый пользователь'}</span><time
							datetime={note.createdAt.toISOString()}>{formatDate(note.createdAt)}</time
						>
					</div>
					<p class="mt-3 max-w-[62ch] text-sm leading-6 wrap-anywhere whitespace-pre-wrap">
						{note.body}
					</p></Card
				>
			</li>
		{:else}<li class="text-sm text-muted">Заметок пока нет</li>{/each}
	</ul>
	<form
		class="mt-6 grid gap-4"
		onsubmit={(event) => {
			event.preventDefault();
			void add();
		}}
	>
		<Field label="Новая заметка" for="note" error={error || undefined}
			><Textarea
				name="note"
				bind:value={body}
				rows={4}
				maxlength={4000}
				invalid={!!error}
				disabled={saving}
			/></Field
		>
		<Button type="submit" loading={saving} disabled={!body.trim()} class="justify-self-start"
			>Добавить заметку</Button
		>
		{#if saved}<p role="status" class="text-sm text-success">{saved}</p>{/if}
	</form>
</section>
