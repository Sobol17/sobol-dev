<script lang="ts">
	import { Checkbox, Field, Input, Select, Textarea } from '$lib/ui';
	import { PROJECT_CATEGORY_LABELS } from '$lib/utils/format';
	import type { ProjectCategory } from '$lib/types';
	import type { ProjectFormValues, ProjectIssues } from '../form-values';

	interface Props {
		values: ProjectFormValues;
		issues: ProjectIssues;
	}

	let { values, issues }: Props = $props();

	const categoryOptions = (Object.keys(PROJECT_CATEGORY_LABELS) as ProjectCategory[]).map(
		(value) => ({ value, label: PROJECT_CATEGORY_LABELS[value] })
	);

	const METRICS_PLACEHOLDER = 'Конверсия: +18%\nСрок: 6 недель';
</script>

<div class="grid gap-6">
	<Field label="Заголовок" for="title" error={issues.title} required>
		<Input name="title" value={values.title} invalid={Boolean(issues.title)} />
	</Field>

	<div class="grid gap-6 sm:grid-cols-2">
		<Field
			label="Адрес страницы"
			for="slug"
			hint="Пусто — соберу из заголовка и добавлю суффикс при совпадении"
			error={issues.slug}
		>
			<Input name="slug" value={values.slug} placeholder="miracle" invalid={Boolean(issues.slug)} />
		</Field>

		<Field label="Направление" for="category" error={issues.category}>
			<Select name="category" options={categoryOptions} value={values.category} />
		</Field>
	</div>

	<Field
		label="Короткое описание"
		for="summary"
		hint="Одно предложение для карточки в списке"
		error={issues.summary}
		required
	>
		<Textarea
			name="summary"
			rows={2}
			maxlength={300}
			value={values.summary}
			invalid={Boolean(issues.summary)}
		/>
	</Field>

	<Field
		label="Текст кейса"
		for="body"
		hint="Markdown. Рендерится с санитайзом на публичной странице"
		error={issues.body}
		required
	>
		<Textarea
			name="body"
			rows={14}
			maxlength={20000}
			value={values.body}
			invalid={Boolean(issues.body)}
		/>
	</Field>

	<div class="grid gap-6 sm:grid-cols-2">
		<Field label="Клиент" for="clientName" error={issues.clientName}>
			<Input name="clientName" value={values.clientName} invalid={Boolean(issues.clientName)} />
		</Field>
		<Field label="Роль" for="roleText" error={issues.roleText}>
			<Input
				name="roleText"
				value={values.roleText}
				placeholder="Fullstack, от макета до релиза"
				invalid={Boolean(issues.roleText)}
			/>
		</Field>
	</div>

	<div class="grid gap-6 sm:grid-cols-2">
		<Field label="Год" for="year" error={issues.year}>
			<Input name="year" inputmode="numeric" value={values.year} invalid={Boolean(issues.year)} />
		</Field>
		<Field label="Длительность, недель" for="durationWeeks" error={issues.durationWeeks}>
			<Input
				name="durationWeeks"
				inputmode="numeric"
				value={values.durationWeeks}
				invalid={Boolean(issues.durationWeeks)}
			/>
		</Field>
	</div>

	<div class="grid gap-6 sm:grid-cols-2">
		<Field label="Ссылка на проект" for="liveUrl" error={issues.liveUrl}>
			<Input
				name="liveUrl"
				type="url"
				value={values.liveUrl}
				placeholder="https://"
				invalid={Boolean(issues.liveUrl)}
			/>
		</Field>
		<Field label="Репозиторий" for="repoUrl" error={issues.repoUrl}>
			<Input
				name="repoUrl"
				type="url"
				value={values.repoUrl}
				placeholder="https://"
				invalid={Boolean(issues.repoUrl)}
			/>
		</Field>
	</div>

	<Field
		label="Стек"
		for="tags"
		hint="Через запятую: SvelteKit, TypeScript, SQLite"
		error={issues.tags}
	>
		<Input name="tags" value={values.tags} invalid={Boolean(issues.tags)} />
	</Field>

	<Field
		label="Метрики"
		for="metrics"
		hint="По строке на метрику, формат «Подпись: значение»"
		error={issues.metrics}
	>
		<Textarea
			name="metrics"
			rows={4}
			value={values.metrics}
			placeholder={METRICS_PLACEHOLDER}
			invalid={Boolean(issues.metrics)}
		/>
	</Field>

	<Checkbox name="featured" checked={values.featured} label="Показывать на главной" />
</div>
