<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '../cn';

	interface Props {
		value?: string;
		type?: HTMLInputAttributes['type'];
		name: string;
		placeholder?: string;
		invalid?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		class?: string;
		[key: string]: unknown;
	}

	let {
		value = $bindable(''),
		type = 'text',
		name,
		placeholder,
		invalid = false,
		autocomplete,
		class: className,
		...rest
	}: Props = $props();
</script>

<input
	{type}
	{name}
	id={name}
	{placeholder}
	{autocomplete}
	bind:value
	aria-invalid={invalid ? 'true' : undefined}
	class={cn(
		'w-full rounded-field border bg-paper px-5 py-4 text-[15px] transition outline-none',
		'placeholder:text-muted focus:border-ink focus:bg-surface',
		invalid ? 'border-danger' : 'border-line',
		className
	)}
	{...rest}
/>
