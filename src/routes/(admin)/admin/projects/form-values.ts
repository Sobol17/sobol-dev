import type { ProjectCategory, ProjectMetric } from '$lib/types';
import { formatMetricLines, formatTagList } from '$lib/utils/project';

/** What the editor puts in the inputs. Everything is a string: that is what a form posts. */
export interface ProjectFormValues {
	title: string;
	slug: string;
	category: ProjectCategory;
	summary: string;
	body: string;
	clientName: string;
	roleText: string;
	year: string;
	durationWeeks: string;
	liveUrl: string;
	repoUrl: string;
	tags: string;
	metrics: string;
	featured: boolean;
}

export const EMPTY_PROJECT: ProjectFormValues = {
	title: '',
	slug: '',
	category: 'web',
	summary: '',
	body: '',
	clientName: '',
	roleText: '',
	year: '',
	durationWeeks: '',
	liveUrl: '',
	repoUrl: '',
	tags: '',
	metrics: '',
	featured: false
};

/** The stored shape the editor reads back. Kept structural so it also fits serialized load data. */
export interface EditableProject {
	title: string;
	slug: string;
	category: ProjectCategory;
	summary: string;
	body: string;
	clientName: string | null;
	roleText: string | null;
	year: number | null;
	durationWeeks: number | null;
	liveUrl: string | null;
	repoUrl: string | null;
	metrics: ProjectMetric[];
	featured: boolean;
}

export function toFormValues(project: EditableProject, tags: readonly string[]): ProjectFormValues {
	return {
		title: project.title,
		slug: project.slug,
		category: project.category,
		summary: project.summary,
		body: project.body,
		clientName: project.clientName ?? '',
		roleText: project.roleText ?? '',
		year: project.year === null ? '' : String(project.year),
		durationWeeks: project.durationWeeks === null ? '' : String(project.durationWeeks),
		liveUrl: project.liveUrl ?? '',
		repoUrl: project.repoUrl ?? '',
		tags: formatTagList(tags),
		metrics: formatMetricLines(project.metrics),
		featured: project.featured
	};
}

interface IssueSource {
	issues(): { message: string }[] | undefined;
}

export type ProjectIssues = Partial<Record<keyof ProjectFormValues, string>>;

const FIELD_NAMES = Object.keys(EMPTY_PROJECT) as (keyof ProjectFormValues)[];

/**
 * One message per field is all the editor shows. Reading the whole set in one place keeps the
 * create and the edit page free of fourteen identical lines each. The field object is a proxy
 * without enumerable keys, so the names come from the value shape instead.
 */
export function firstIssues(
	fields: Partial<Record<keyof ProjectFormValues, IssueSource>>
): ProjectIssues {
	const issues: ProjectIssues = {};
	for (const name of FIELD_NAMES) {
		const message = fields[name]?.issues()?.[0]?.message;
		if (message) issues[name] = message;
	}
	return issues;
}
