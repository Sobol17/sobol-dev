<script lang="ts">
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Badge, Button, Card, Dialog, EmptyState, FileDrop, Input, Skeleton } from '$lib/ui';
	import { getToastStore } from '$lib/state/toast.svelte';
	import { errorText } from '$lib/utils/errors';
	import { formatDate } from '$lib/utils/format';
	import { ALLOWED_IMAGE_MIMES, MAX_UPLOAD_BYTES } from '$lib/utils/image-type';
	import { mediaUrl, pickVariant } from '$lib/utils/media';
	import type { MediaStatus } from '$lib/types';
	import type { MediaListItem } from '$lib/server/repositories/media.repository';
	import { adminMedia, deleteMedia, setMediaAlt, uploadMedia } from './media.remote';

	const toasts = getToastStore();
	const library = $derived(adminMedia());

	const STATUS_LABELS: Record<MediaStatus, string> = {
		pending: 'В обработке',
		ready: 'Готово',
		failed: 'Ошибка'
	};

	const STATUS_TONES: Record<MediaStatus, 'neutral' | 'success' | 'danger'> = {
		pending: 'neutral',
		ready: 'success',
		failed: 'danger'
	};

	let editing = $state<MediaListItem | null>(null);
	let altDraft = $state('');
	let pendingDelete = $state<MediaListItem | null>(null);

	async function upload(files: File[]): Promise<void> {
		for (const file of files) {
			try {
				await uploadMedia({ file });
				toasts.success(`${file.name} загружен, идёт обработка`);
			} catch (thrown) {
				toasts.error(errorText(thrown, 'Загрузка не удалась'));
			}
		}
	}

	function startEditing(item: MediaListItem): void {
		editing = item;
		altDraft = item.alt ?? '';
	}

	async function saveAlt(): Promise<void> {
		const item = editing;
		if (!item) return;
		editing = null;
		await setMediaAlt({ id: item.id, alt: altDraft });
		toasts.success('Описание сохранено');
	}

	async function confirmDelete(): Promise<void> {
		const item = pendingDelete;
		if (!item) return;
		pendingDelete = null;
		await deleteMedia({ id: item.id });
		toasts.success('Файл удалён');
	}

	function sizeMb(bytes: number): string {
		return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
	}
</script>

<SeoHead title="Медиа — SobolDev" description="Библиотека изображений." noindex />

<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
	<h1 class="font-display text-[28px] tracking-[-.02em]" style="font-weight:700">Медиа</h1>
	<Button variant="secondary" onclick={() => library.refresh()}>Обновить</Button>
</div>

<FileDrop
	accept={ALLOWED_IMAGE_MIMES.join(',')}
	maxSizeMb={MAX_UPLOAD_BYTES / (1024 * 1024)}
	multiple
	onfiles={upload}
	class="mb-8"
/>

<!-- Await once for the server render, then read `current`: that is what a refresh updates. -->
{#await library}
	<Card><Skeleton lines={4} /></Card>
{:then}
	{@const items = library.current ?? []}
	{#if items.length === 0}
		<EmptyState
			title="Изображений пока нет"
			description="Загрузите скриншоты кейсов: обработка в webp и avif запускается сама."
		/>
	{:else}
		<ul class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each items as item (item.id)}
				<li>
					<Card padding="sm" class="grid gap-4">
						<div class="overflow-hidden rounded-field border border-line bg-paper">
							<img
								src={mediaUrl(pickVariant(item, 400)?.key ?? item.storageKey)}
								alt={item.alt ?? ''}
								width={item.width ?? undefined}
								height={item.height ?? undefined}
								loading="lazy"
								class="aspect-[4/3] w-full object-cover"
							/>
						</div>

						<div class="flex flex-wrap items-center gap-2">
							<Badge tone={STATUS_TONES[item.status]}>{STATUS_LABELS[item.status]}</Badge>
							{#if item.usedBy > 0}
								<Badge tone="accent">в {item.usedBy} кейсах</Badge>
							{/if}
						</div>

						{#if item.status === 'failed'}
							<p class="text-[13px] text-danger">
								Файл не удалось обработать. Загрузите другой: он не откроется как изображение.
							</p>
						{/if}

						<p class="text-[13px] text-muted">
							{item.alt || 'Без описания'}
						</p>
						<p class="font-mono text-[12px] text-muted">
							{item.width ?? '?'}×{item.height ?? '?'} · {sizeMb(item.sizeBytes)} · {formatDate(
								item.createdAt
							)}
						</p>

						<div class="flex flex-wrap gap-2">
							<Button size="sm" variant="secondary" onclick={() => startEditing(item)}>
								Описание
							</Button>
							<Button size="sm" variant="ghost" onclick={() => (pendingDelete = item)}>
								Удалить
							</Button>
						</div>
					</Card>
				</li>
			{/each}
		</ul>
	{/if}
{/await}

<Dialog
	bind:open={() => editing !== null, (open) => (editing = open ? editing : null)}
	title="Описание изображения"
	description="Alt читают поисковики и экранные читалки. Опишите, что на картинке."
>
	<Input name="alt" bind:value={altDraft} placeholder="Экран каталога с фильтрами" />

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (editing = null)}>Отмена</Button>
		<Button onclick={saveAlt}>Сохранить</Button>
	{/snippet}
</Dialog>

<Dialog
	bind:open={() => pendingDelete !== null, (open) => (pendingDelete = open ? pendingDelete : null)}
	title="Удалить изображение?"
	description="Файл исчезнет из всех галерей, где он стоит. Отменить нельзя."
>
	<p class="text-[15px]">{pendingDelete?.alt || 'Без описания'}</p>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (pendingDelete = null)}>Отмена</Button>
		<Button variant="danger" onclick={confirmDelete}>Удалить</Button>
	{/snippet}
</Dialog>
