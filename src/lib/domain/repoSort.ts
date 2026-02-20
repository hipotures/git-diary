import type { RepoSummary } from './types.js';

export type RepoSortField = 'name' | 'firstCommitDate' | 'totalCommits' | 'lastCommitDate';
export type SortDirection = 'asc' | 'desc';

/**
 * Sort repository summaries by the specified field and direction
 */
export function sortRepoSummaries(
	repos: RepoSummary[],
	field: RepoSortField,
	direction: SortDirection
): RepoSummary[] {
	const sorted = [...repos];

	sorted.sort((a, b) => {
		let comparison = 0;

		switch (field) {
			case 'name': {
				const nameA = `${a.owner}/${a.name}`.toLowerCase();
				const nameB = `${b.owner}/${b.name}`.toLowerCase();
				comparison = nameA.localeCompare(nameB);
				break;
			}

			case 'firstCommitDate': {
				// Handle nulls - always sort to the end
				if (a.firstCommitDate === null && b.firstCommitDate === null) {
					comparison = 0;
				} else if (a.firstCommitDate === null) {
					comparison = 1;
				} else if (b.firstCommitDate === null) {
					comparison = -1;
				} else {
					comparison = a.firstCommitDate.localeCompare(b.firstCommitDate);
				}
				break;
			}

			case 'totalCommits': {
				comparison = a.commitsAll - b.commitsAll;
				break;
			}

			case 'lastCommitDate': {
				if (a.lastCommitDate === null && b.lastCommitDate === null) {
					comparison = 0;
				} else if (a.lastCommitDate === null) {
					comparison = 1;
				} else if (b.lastCommitDate === null) {
					comparison = -1;
				} else {
					comparison = a.lastCommitDate.localeCompare(b.lastCommitDate);
					if (comparison === 0) {
						const aPushed = a.lastPushedAt ?? '';
						const bPushed = b.lastPushedAt ?? '';
						comparison = aPushed.localeCompare(bPushed);
					}
				}
				break;
			}
		}

		return direction === 'asc' ? comparison : -comparison;
	});

	return sorted;
}
