<script lang="ts">
	import { cn } from '../cn';

	interface Props {
		page: number;
		pageCount: number;
		onpage: (page: number) => void;
		class?: string;
	}

	let { page, pageCount, onpage, class: className }: Props = $props();

	const pages = $derived(Array.from({ length: pageCount }, (_, index) => index + 1));
</script>

{#if pageCount > 1}
	<nav class={cn('flex flex-wrap items-center gap-2', className)} aria-label="Страницы">
		<button
			type="button"
			class="rounded-pill border border-line px-4 py-2 text-[14px] transition disabled:opacity-40"
			disabled={page <= 1}
			onclick={() => onpage(page - 1)}
		>
			Назад
		</button>

		{#each pages as number (number)}
			<button
				type="button"
				aria-current={number === page ? 'page' : undefined}
				class={cn(
					'size-9 rounded-pill text-[14px] transition',
					number === page ? 'bg-invert text-invert-fg' : 'text-muted hover:text-ink'
				)}
				onclick={() => onpage(number)}
			>
				{number}
			</button>
		{/each}

		<button
			type="button"
			class="rounded-pill border border-line px-4 py-2 text-[14px] transition disabled:opacity-40"
			disabled={page >= pageCount}
			onclick={() => onpage(page + 1)}
		>
			Вперёд
		</button>
	</nav>
{/if}
