export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

export interface ProposalScopeItem {
	title: string;
	description?: string;
	weeks?: number;
}
