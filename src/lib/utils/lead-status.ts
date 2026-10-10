import type { LeadStatus } from '$lib/types';

export const LEAD_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
	new: ['qualifying', 'lost', 'spam'],
	qualifying: ['proposal_sent', 'won', 'lost', 'spam'],
	proposal_sent: ['qualifying', 'won', 'lost', 'spam'],
	won: ['qualifying'],
	lost: ['qualifying'],
	spam: ['new']
};
