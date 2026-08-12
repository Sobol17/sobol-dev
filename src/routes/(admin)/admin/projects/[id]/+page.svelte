<script lang="ts">
	import { goto } from '$app/navigation';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Badge, Button, Card } from '$lib/ui';
	import { getToastStore } from '$lib/state/toast.svelte';
	import { PUBLISH_STATUS_LABELS } from '$lib/utils/format';
	import { firstIssues } from '../form-values';
	import {
		deleteProject,
		publishProject,
		unpublishProject,
		updateProject
	} from '../projects.remote';
	import ProjectFields from '../_components/project-fields.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const toasts = getToastStore();
	const issues = $derived(firstIssues(updateProject.fields));

	async function togglePublish(): Promise<void> {
		if (data.status === 'published') {
			await unpublishProject({ id: data.id });
			toasts.success('Кейс снят с публикации');
		} else {
			await publishProject({ id: data.id });
			toasts.success('Кейс опубликован');
		}
		await goto(`/admin/projects/${data.id}`, { invalidateAll: true });
	}

	async function remove(): Promise<void> {
		await deleteProject({ id: data.id });
		toasts.success('Кейс удалён');
		await goto('/admin/projects');
	}
</script>

<SeoHead title="{data.values.title} — SobolDev" description="Редактор кейса." noindex />

<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="font-display text-[28px] tracking-[-.02em]" style="font-weight:700">
			{data.values.title}
		</h1>
		<Badge tone={data.status === 'published' ? 'success' : 'neutral'}>
			{PUBLISH_STATUS_LABELS[data.status]}
		</Badge>
	</div>

	<div class="flex flex-wrap gap-2">
		<Button variant="secondary" onclick={togglePublish}>
			{data.status === 'published' ? 'Снять с публикации' : 'Опубликовать'}
		</Button>
		<Button variant="ghost" onclick={remove}>Удалить</Button>
	</div>
</div>

<form
	{...updateProject.enhance(async ({ submit }) => {
		await submit();
		// A failed submission comes back as field issues, not as a rejection.
		if (updateProject.result?.saved) toasts.success('Сохранено');
	})}
	class="grid max-w-[820px] gap-8"
>
	<input type="hidden" name="id" value={data.id} />

	<Card padding="lg">
		<ProjectFields values={data.values} {issues} />
	</Card>

	<div class="flex items-center gap-3">
		<Button type="submit" size="lg" loading={updateProject.pending > 0}>Сохранить</Button>
		<Button href="/admin/projects" variant="ghost">К списку</Button>
	</div>
</form>
