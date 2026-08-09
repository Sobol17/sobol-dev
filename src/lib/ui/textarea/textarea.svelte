<script lang="ts">
	import { cn } from '../cn';

	interface Props {
		value?: string;
		name: string;
		rows?: number;
		maxlength?: number;
		placeholder?: string;
		invalid?: boolean;
		class?: string;
		[key: string]: unknown;
	}

	let {
		value = $bindable(''),
		name,
		rows = 4,
		maxlength,
		placeholder,
		invalid = false,
		class: className,
		...rest
	}: Props = $props();
</script>

<textarea
	{name}
	id={name}
	{rows}
	{maxlength}
	{placeholder}
	bind:value
	aria-invalid={invalid ? 'true' : undefined}
	class={cn(
		'w-full resize-y rounded-field border bg-paper px-5 py-4 text-[15px] transition outline-none',
		'placeholder:text-muted focus:border-ink focus:bg-surface',
		invalid ? 'border-danger' : 'border-line',
		className
	)}
	{...rest}></textarea>
