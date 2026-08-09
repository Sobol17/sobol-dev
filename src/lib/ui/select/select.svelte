<script lang="ts">
	import { cn } from '../cn';

	interface Option {
		value: string;
		label: string;
	}

	interface Props {
		value?: string;
		options: Option[];
		name: string;
		invalid?: boolean;
		class?: string;
		[key: string]: unknown;
	}

	let {
		value = $bindable(''),
		options,
		name,
		invalid = false,
		class: className,
		...rest
	}: Props = $props();
</script>

<!-- Native select on purpose: it submits without JS and matches the platform on mobile. -->
<select
	{name}
	id={name}
	bind:value
	aria-invalid={invalid ? 'true' : undefined}
	class={cn(
		'w-full appearance-none rounded-field border bg-paper px-5 py-4 text-[15px] transition outline-none',
		'focus:border-ink focus:bg-surface',
		invalid ? 'border-danger' : 'border-line',
		className
	)}
	{...rest}
>
	{#each options as option (option.value)}
		<option value={option.value}>{option.label}</option>
	{/each}
</select>
