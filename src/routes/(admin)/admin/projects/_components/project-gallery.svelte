<script lang="ts">
	import { Badge, Button, Card, Dialog, EmptyState, FileDrop, Skeleton } from '$lib/ui';
	import { getToastStore } from '$lib/state/toast.svelte';
	import { errorText } from '$lib/utils/errors';
	import { ALLOWED_IMAGE_MIMES, MAX_UPLOAD_BYTES } from '$lib/utils/image-type';
	import { mediaUrl, pickVariant } from '$lib/utils/media';
	import type { GalleryItem } from '$lib/server/repositories/media.repository';
	import { uploadMedia } from '../../media/media.remote';
	import {
		attachToGallery,
		detachFromGallery,
		projectGallery,
		readyMedia,
		reorderGallery,
		setProjectCover
	} from '../gallery.remote';

	interface Props {
		projectId: string;
	}

	let { projectId }: Props = $props();

	const toasts = getToastStore();
	const gallery = $derived(projectGallery(projectId));
	const library = $derived(readyMedia());

	let dragId = $state<string | null>(null);
	let pickerOpen = $state(false);

	/**
	 * Upload and attach are two steps on purpose: the image belongs to the library first,
	 * so the same screenshot can appear in a second case without a second upload.
	 */
	async function upload(files: File[]): Promise<void> {
		for (const file of files) {
			try {
				const created = await uploadMedia({ file });
				await attachToGallery({ projectId, mediaId: created.id });
				toasts.success(`${file.name} загружен, идёт обработка`);
			} catch (thrown) {
				toasts.error(errorText(thrown, 'Загрузка не удалась'));
			}
		}
	}

	async function dropOn(items: GalleryItem[], targetId: string): Promise<void> {
		const sourceId = dragId;
		dragId = null;
		if (!sourceId || sourceId === targetId) return;

		const mediaIds = items.map((item) => item.id);
		const from = mediaIds.indexOf(sourceId);
		const to = mediaIds.indexOf(targetId);
		if (from === -1 || to === -1) return;

		mediaIds.splice(to, 0, ...mediaIds.splice(from, 1));
		await reorderGallery({ projectId, mediaIds });
	}
</script>

<Card padding="lg" class="grid gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h2 class="font-display text-[20px] tracking-[-.02em]" style="font-weight:600">Галерея</h2>
		<Button size="sm" variant="secondary" onclick={() => (pickerOpen = true)}>
			Взять из библиотеки
		</Button>
	</div>

	<FileDrop
		accept={ALLOWED_IMAGE_MIMES.join(',')}
		maxSizeMb={MAX_UPLOAD_BYTES / (1024 * 1024)}
		multiple
		onfiles={upload}
	/>

	<!-- Await once for the server render, then read `current`: that is what a refresh updates. -->
	{#await gallery}
		<Skeleton lines={3} />
	{:then}
		{@const current = gallery.current ?? { coverMediaId: null, items: [] }}
		{#if current.items.length === 0}
			<EmptyState
				title="Скриншотов нет"
				description="Перетащите файлы выше: первый станет обложкой кейса."
			/>
		{:else}
			<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each current.items as item (item.id)}
					<li
						class="grid gap-3"
						class:opacity-50={dragId === item.id}
						draggable="true"
						ondragstart={() => (dragId = item.id)}
						ondragend={() => (dragId = null)}
						ondragover={(event) => event.preventDefault()}
						ondrop={(event) => {
							event.preventDefault();
							void dropOn(current.items, item.id);
						}}
					>
						<div class="overflow-hidden rounded-field border border-line bg-paper">
							<img
								src={mediaUrl(pickVariant(item, 400)?.key ?? item.storageKey)}
								alt={item.alt ?? ''}
								loading="lazy"
								class="aspect-[4/3] w-full object-cover"
							/>
						</div>

						<div class="flex flex-wrap items-center gap-2">
							{#if current.coverMediaId === item.id}
								<Badge tone="accent">обложка</Badge>
							{/if}
							{#if item.status !== 'ready'}
								<Badge tone={item.status === 'failed' ? 'danger' : 'neutral'}>
									{item.status === 'failed' ? 'ошибка' : 'обработка'}
								</Badge>
							{/if}
						</div>

						<div class="flex flex-wrap gap-2">
							<Button
								size="sm"
								variant="secondary"
								onclick={() => setProjectCover({ projectId, mediaId: item.id })}
							>
								На обложку
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onclick={() => detachFromGallery({ projectId, mediaId: item.id })}
							>
								Убрать
							</Button>
						</div>
					</li>
				{/each}
			</ul>

			<p class="text-[13px] text-muted">Перетащите карточку, чтобы изменить порядок в галерее.</p>
		{/if}
	{/await}
</Card>

<Dialog
	bind:open={pickerOpen}
	title="Библиотека"
	description="Изображения, которые уже обработаны. Одно и то же можно поставить в несколько кейсов."
>
	{#await library}
		<Skeleton lines={3} />
	{:then}
		{@const items = library.current ?? []}
		{#if items.length === 0}
			<p class="text-[14px] text-muted">Обработанных изображений пока нет.</p>
		{:else}
			<ul class="grid max-h-[50vh] gap-3 overflow-y-auto sm:grid-cols-3">
				{#each items as item (item.id)}
					<li>
						<button
							type="button"
							class="w-full overflow-hidden rounded-field border border-line transition hover:border-ink"
							onclick={async () => {
								await attachToGallery({ projectId, mediaId: item.id });
								pickerOpen = false;
							}}
						>
							<img
								src={mediaUrl(pickVariant(item, 400)?.key ?? item.storageKey)}
								alt={item.alt ?? ''}
								loading="lazy"
								class="aspect-[4/3] w-full object-cover"
							/>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	{/await}
</Dialog>
