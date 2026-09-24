<script lang="ts">
	import {
		Badge,
		Button,
		Card,
		Checkbox,
		Dialog,
		EmptyState,
		Field,
		FileDrop,
		Input,
		Pagination,
		RadioCards,
		Select,
		Skeleton,
		Stepper,
		Tabs,
		Table,
		Textarea
	} from '$lib/ui';
	import { getToastStore } from '$lib/state/toast.svelte';

	const toasts = getToastStore();

	let text = $state('Значение');
	let area = $state('Многострочный текст');
	let select = $state('web');
	let radio = $state('web');
	let checked = $state(true);
	let tab = $state('all');
	let page = $state(2);
	let dialogOpen = $state(false);
	let dropped = $state<string[]>([]);

	const options = [
		{ value: 'web', label: 'Веб' },
		{ value: 'mobile', label: 'Мобильное' },
		{ value: 'tma', label: 'Mini App' }
	];

	const rows = [
		{ id: '1', name: 'Первая строка', status: 'Новая' },
		{ id: '2', name: 'Вторая строка', status: 'В работе' }
	];

	const columns = [
		{ key: 'name', label: 'Название' },
		{ key: 'status', label: 'Статус', align: 'right' as const, width: '160px' }
	];
</script>

<svelte:head><title>Kitchen sink</title></svelte:head>

<div class="container-page grid gap-12 py-12">
	<header class="flex items-center justify-between gap-4">
		<h1 class="font-display text-[28px] tracking-[-.02em]" style="font-weight:700">Kitchen sink</h1>
	</header>

	<section class="grid gap-4">
		<h2 class="font-mono text-[11px] tracking-[.16em] text-muted uppercase">Button</h2>
		<div class="flex flex-wrap items-center gap-3">
			<Button variant="primary">Primary</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="danger">Danger</Button>
			<Button loading>Loading</Button>
			<Button disabled>Disabled</Button>
			<Button href="/kitchen-sink">Link</Button>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<Button size="sm">Small</Button>
			<Button size="md">Medium</Button>
			<Button size="lg">Large</Button>
		</div>
	</section>

	<section class="grid max-w-[560px] gap-5">
		<h2 class="font-mono text-[11px] tracking-[.16em] text-muted uppercase">
			Field, Input, Textarea, Select
		</h2>
		<Field label="Обычное поле" for="ks-input" hint="Подсказка под полем">
			<Input name="ks-input" bind:value={text} />
		</Field>
		<Field label="Поле с ошибкой" for="ks-invalid" error="Так нельзя" required>
			<Input name="ks-invalid" invalid value="" />
		</Field>
		<Field label="Текст" for="ks-area">
			<Textarea name="ks-area" bind:value={area} rows={3} />
		</Field>
		<Field label="Выбор" for="ks-select">
			<Select name="ks-select" {options} bind:value={select} />
		</Field>
		<Checkbox name="ks-check" label="Чекбокс" bind:checked />
	</section>

	<section class="grid gap-4">
		<h2 class="font-mono text-[11px] tracking-[.16em] text-muted uppercase">RadioCards</h2>
		<RadioCards
			name="ks-radio"
			columns={3}
			bind:value={radio}
			options={[
				{ value: 'web', label: 'Веб', description: 'Сайты и админки' },
				{ value: 'mobile', label: 'Мобильное', description: 'Flutter и React Native' },
				{ value: 'tma', label: 'Mini App', description: 'Внутри Telegram' }
			]}
		/>
	</section>

	<section class="grid gap-4">
		<h2 class="font-mono text-[11px] tracking-[.16em] text-muted uppercase">Badge, Card</h2>
		<div class="flex flex-wrap gap-2">
			<Badge tone="neutral">neutral</Badge>
			<Badge tone="success">success</Badge>
			<Badge tone="warning">warning</Badge>
			<Badge tone="danger">danger</Badge>
			<Badge tone="accent">accent</Badge>
		</div>
		<div class="grid gap-4 sm:grid-cols-3">
			<Card padding="sm">Padding sm</Card>
			<Card padding="md">Padding md</Card>
			<Card padding="lg" href="/kitchen-sink">Clickable lg</Card>
		</div>
	</section>

	<section class="grid gap-4">
		<h2 class="font-mono text-[11px] tracking-[.16em] text-muted uppercase">
			Tabs, Stepper, Pagination
		</h2>
		<Tabs
			bind:value={tab}
			items={[
				{ value: 'all', label: 'Все' },
				{ value: 'new', label: 'Новые' },
				{ value: 'spam', label: 'Спам' }
			]}
		/>
		<Stepper step={1} steps={['Тип', 'Задача', 'Контакт']} />
		<Pagination {page} pageCount={5} onpage={(next) => (page = next)} />
	</section>

	<section class="grid gap-4">
		<h2 class="font-mono text-[11px] tracking-[.16em] text-muted uppercase">Table</h2>
		<Table {columns} {rows}>
			{#snippet row(item: (typeof rows)[number])}
				<tr class="border-t border-line">
					<td class="px-5 py-4">{item.name}</td>
					<td class="px-5 py-4 text-right text-muted">{item.status}</td>
				</tr>
			{/snippet}
		</Table>
		<Table {columns} rows={[]}>
			{#snippet row(item: (typeof rows)[number])}
				<tr><td>{item.name}</td></tr>
			{/snippet}
		</Table>
	</section>

	<section class="grid gap-4">
		<h2 class="font-mono text-[11px] tracking-[.16em] text-muted uppercase">
			EmptyState, Skeleton
		</h2>
		<EmptyState title="Пока пусто" description="Здесь появятся записи, когда они будут.">
			{#snippet action()}
				<Button size="sm">Создать</Button>
			{/snippet}
		</EmptyState>
		<Skeleton variant="text" lines={4} />
		<Skeleton variant="block" />
	</section>

	<section class="grid gap-4">
		<h2 class="font-mono text-[11px] tracking-[.16em] text-muted uppercase">FileDrop</h2>
		<FileDrop
			accept="image/png,image/jpeg,image/webp"
			maxSizeMb={10}
			multiple
			onfiles={(files) => (dropped = files.map((file) => file.name))}
		/>
		{#if dropped.length > 0}
			<p class="font-mono text-[12px] text-muted">{dropped.join(', ')}</p>
		{/if}
	</section>

	<section class="grid gap-4">
		<h2 class="font-mono text-[11px] tracking-[.16em] text-muted uppercase">Dialog, Toast</h2>
		<div class="flex flex-wrap gap-3">
			<Button onclick={() => (dialogOpen = true)}>Открыть диалог</Button>
			<Button variant="secondary" onclick={() => toasts.success('Сохранено')}>Toast success</Button>
			<Button variant="secondary" onclick={() => toasts.error('Не сохранилось')}>Toast error</Button
			>
			<Button variant="secondary" onclick={() => toasts.push('Нейтральное сообщение')}>
				Toast neutral
			</Button>
		</div>

		<Dialog bind:open={dialogOpen} title="Удалить кейс?" description="Действие необратимо.">
			<p class="text-[14px] text-muted">Файлы галереи удалит фоновая уборка.</p>
			{#snippet footer()}
				<Button variant="secondary" onclick={() => (dialogOpen = false)}>Отмена</Button>
				<Button variant="danger" onclick={() => (dialogOpen = false)}>Удалить</Button>
			{/snippet}
		</Dialog>
	</section>
</div>
