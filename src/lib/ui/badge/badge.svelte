<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '../cn';

	type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

	interface Props {
		tone?: Tone;
		class?: string;
		children: Snippet;
	}

	let { tone = 'neutral', class: className, children }: Props = $props();

	const TONES: Record<Tone, string> = {
		neutral: 'bg-paper text-muted',
		success: 'bg-success/10 text-success',
		warning: 'bg-warning/10 text-warning',
		danger: 'bg-danger/10 text-danger',
		accent: 'bg-accent-soft text-accent'
	};
</script>

<span
	class={cn(
		'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 font-mono text-[11px] tracking-[.06em] uppercase',
		TONES[tone],
		className
	)}
>
	{@render children()}
</span>
