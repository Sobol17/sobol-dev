<script lang="ts">
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Button, Card } from '$lib/ui';
	import ProjectFields from '../_components/project-fields.svelte';
	import { EMPTY_PROJECT, firstIssues } from '../form-values';
	import { createProject } from '../projects.remote';

	const issues = $derived(firstIssues(createProject.fields));
</script>

<SeoHead title="Новый кейс — SobolDev" description="Создание кейса." noindex />

<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
	<h1 class="font-display text-[28px] tracking-[-.02em]" style="font-weight:700">Новый кейс</h1>
	<Button href="/admin/projects" variant="ghost">К списку</Button>
</div>

<form {...createProject} class="grid max-w-[820px] gap-8">
	<Card padding="lg">
		<ProjectFields values={EMPTY_PROJECT} {issues} />
	</Card>

	<div class="flex items-center gap-3">
		<Button type="submit" size="lg" loading={createProject.pending > 0}>Создать черновик</Button>
		<p class="text-[13px] text-muted">Кейс создаётся черновиком, публикация — отдельным шагом.</p>
	</div>
</form>
