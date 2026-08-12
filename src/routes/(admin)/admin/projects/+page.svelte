<script lang="ts">
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Badge, Button, Card, Dialog, EmptyState, Skeleton, Table } from '$lib/ui';
	import { getToastStore } from '$lib/state/toast.svelte';
	import { PROJECT_CATEGORY_LABELS, PUBLISH_STATUS_LABELS, formatDate } from '$lib/utils/format';
	import type { PublishStatus } from '$lib/types';
	import type { AdminProjectListItem } from '$lib/server/repositories/project.repository';
	import {
		adminProjects,
		deleteProject,
		publishProject,
		reorderProjects,
		unpublishProject
	} from './projects.remote';

	const toasts = getToastStore();

	const columns = [
		{ key: 'title', label: 'Кейс' },
		{ key: 'category', label: 'Направление', width: '190px' },
		{ key: 'status', label: 'Статус', width: '150px' },
		{ key: 'updatedAt', label: 'Изменён', width: '170px' },
		{ key: 'actions', label: '', align: 'right' as const, width: '250px' }
	];

	const TONES: Record<PublishStatus, 'neutral' | 'success' | 'warning'> = {
		draft: 'neutral',
		published: 'success',
		archived: 'warning'
	};

	let dragId = $state<string | null>(null);
	let pendingDelete = $state<AdminProjectListItem | null>(null);

	/** Drag and drop sends the full order, so the server never guesses what moved where. */
	async function dropOn(items: AdminProjectListItem[], targetId: string): Promise<void> {
		const sourceId = dragId;
		dragId = null;
		if (!sourceId || sourceId === targetId) return;

		const ids = items.map((item) => item.id);
		const from = ids.indexOf(sourceId);
		const to = ids.indexOf(targetId);
		if (from === -1 || to === -1) return;

		ids.splice(to, 0, ...ids.splice(from, 1));
		await reorderProjects({ ids });
		toasts.success('Порядок сохранён');
	}

	async function togglePublish(item: AdminProjectListItem): Promise<void> {
		if (item.status === 'published') {
			await unpublishProject({ id: item.id });
			toasts.success(`«${item.title}» снят с публикации`);
		} else {
			await publishProject({ id: item.id });
			toasts.success(`«${item.title}» опубликован`);
		}
	}

	async function confirmDelete(): Promise<void> {
		const item = pendingDelete;
		if (!item) return;
		pendingDelete = null;
		await deleteProject({ id: item.id });
		toasts.success(`«${item.title}» удалён`);
	}
</script>

<SeoHead title="Кейсы — SobolDev" description="Управление портфолио." noindex />

<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
	<h1 class="font-display text-[28px] tracking-[-.02em]" style="font-weight:700">Кейсы</h1>
	<Button href="/admin/projects/new">Новый кейс</Button>
</div>

{#await adminProjects()}
	<Card><Skeleton lines={6} /></Card>
{:then items}
	<Table {columns} rows={items}>
		{#snippet row(item: AdminProjectListItem)}
			<tr
				class="border-t border-line"
				class:opacity-50={dragId === item.id}
				draggable="true"
				ondragstart={() => (dragId = item.id)}
				ondragend={() => (dragId = null)}
				ondragover={(event) => event.preventDefault()}
				ondrop={(event) => {
					event.preventDefault();
					void dropOn(items, item.id);
				}}
			>
				<td class="px-5 py-4">
					<a
						class="block font-medium transition hover:text-accent"
						href="/admin/projects/{item.id}"
					>
						{item.title}
					</a>
					<span class="block font-mono text-[12px] text-muted">/{item.slug}</span>
				</td>
				<td class="px-5 py-4 text-muted">
					{PROJECT_CATEGORY_LABELS[item.category]}
					{#if item.featured}<Badge tone="accent" class="ml-2">на главной</Badge>{/if}
				</td>
				<td class="px-5 py-4">
					<Badge tone={TONES[item.status]}>{PUBLISH_STATUS_LABELS[item.status]}</Badge>
				</td>
				<td class="px-5 py-4 text-muted">{formatDate(item.updatedAt)}</td>
				<td class="px-5 py-4">
					<div class="flex justify-end gap-2">
						<Button size="sm" variant="secondary" onclick={() => togglePublish(item)}>
							{item.status === 'published' ? 'Снять' : 'Опубликовать'}
						</Button>
						<Button size="sm" variant="ghost" onclick={() => (pendingDelete = item)}>Удалить</Button
						>
					</div>
				</td>
			</tr>
		{/snippet}

		{#snippet empty()}
			<EmptyState
				title="Кейсов пока нет"
				description="Добавьте первый кейс: он появится в публичном разделе после публикации."
				class="border-0"
			>
				{#snippet action()}
					<Button href="/admin/projects/new">Новый кейс</Button>
				{/snippet}
			</EmptyState>
		{/snippet}
	</Table>

	<p class="mt-4 text-[13px] text-muted">
		Перетащите строку, чтобы изменить порядок кейсов на публичной странице.
	</p>
{/await}

<Dialog
	bind:open={() => pendingDelete !== null, (open) => (pendingDelete = open ? pendingDelete : null)}
	title="Удалить кейс?"
	description="Кейс исчезнет с публичной страницы вместе со своей галереей и тегами. Отменить нельзя."
>
	<p class="text-[15px]">{pendingDelete?.title}</p>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (pendingDelete = null)}>Отмена</Button>
		<Button variant="danger" onclick={confirmDelete}>Удалить</Button>
	{/snippet}
</Dialog>
