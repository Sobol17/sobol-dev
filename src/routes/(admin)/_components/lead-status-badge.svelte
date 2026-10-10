<script lang="ts">
	import { Badge } from '$lib/ui';
	import { LEAD_STATUS_LABELS } from '$lib/utils/format';
	import type { LeadStatus } from '$lib/types';
	let { status }: { status: LeadStatus } = $props();
	const tones: Record<LeadStatus, 'accent' | 'neutral' | 'success' | 'danger'> = {
		new: 'accent',
		qualifying: 'neutral',
		proposal_sent: 'neutral',
		won: 'success',
		lost: 'neutral',
		spam: 'danger'
	};
</script>

<Badge tone={tones[status]} class="text-xs tracking-normal normal-case"
	>{LEAD_STATUS_LABELS[status]}</Badge
>
