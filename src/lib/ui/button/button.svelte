<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '../cn';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		size?: Size;
		loading?: boolean;
		disabled?: boolean;
		href?: string;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		children: Snippet;
		[key: string]: unknown;
	}

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		disabled = false,
		href,
		type = 'button',
		class: className,
		children,
		...rest
	}: Props = $props();

	const VARIANTS: Record<Variant, string> = {
		primary: 'bg-accent text-white hover:bg-invert hover:text-invert-fg',
		secondary: 'border border-line bg-surface text-ink hover:border-ink/40',
		ghost: 'text-ink hover:bg-accent-soft',
		danger: 'bg-danger text-white hover:brightness-110'
	};

	const SIZES: Record<Size, string> = {
		sm: 'px-4 py-2 text-[13px]',
		md: 'px-6 py-3 text-[14px]',
		lg: 'px-8 py-4 text-[15px]'
	};

	const classes = $derived(
		cn(
			'inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-[background-color,color,border-color,transform] duration-150 active:scale-[.98]',
			'disabled:pointer-events-none disabled:opacity-50',
			VARIANTS[variant],
			SIZES[size],
			className
		)
	);

	const blocked = $derived(disabled || loading);
</script>

{#snippet body()}
	{#if loading}
		<span
			class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
			aria-hidden="true"
		></span>
	{/if}
	{@render children()}
{/snippet}

{#if href}
	<a
		{href}
		class={classes}
		aria-disabled={blocked ? 'true' : undefined}
		tabindex={blocked ? -1 : undefined}
		{...rest as HTMLAnchorAttributes}
	>
		{@render body()}
	</a>
{:else}
	<button
		{type}
		class={classes}
		disabled={blocked}
		aria-busy={loading ? 'true' : undefined}
		{...rest as HTMLButtonAttributes}
	>
		{@render body()}
	</button>
{/if}
