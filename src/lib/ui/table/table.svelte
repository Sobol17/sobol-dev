<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { cn } from '../cn';

	interface Column {
		key: string;
		label: string;
		align?: 'left' | 'right' | 'center';
		width?: string;
	}

	interface Props {
		columns: Column[];
		rows: T[];
		row: Snippet<[T]>;
		empty?: Snippet;
		class?: string;
	}

	let { columns, rows, row, empty, class: className }: Props = $props();

	const ALIGN: Record<'left' | 'right' | 'center', string> = {
		left: 'text-left',
		right: 'text-right',
		center: 'text-center'
	};
</script>

<div class={cn('overflow-x-auto rounded-card border border-line bg-surface', className)}>
	<table class="w-full border-collapse text-[14px]">
		<thead>
			<tr class="border-b border-line">
				{#each columns as column (column.key)}
					<th
						scope="col"
						style={column.width ? `width:${column.width}` : undefined}
						class={cn(
							'px-5 py-4 font-mono text-[11px] font-normal tracking-[.12em] text-muted uppercase',
							ALIGN[column.align ?? 'left']
						)}
					>
						{column.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as item, index (index)}
				{@render row(item)}
			{:else}
				<tr>
					<td colspan={columns.length} class="px-5 py-12 text-center text-muted">
						{#if empty}
							{@render empty()}
						{:else}
							Пусто
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
