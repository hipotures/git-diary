import { getAllDailyData } from '$lib/server/db/queries.js';
import {
	calculateLongestStreak,
	calculateMaxGap,
	calculateRegularity
} from '$lib/domain/stats.js';
import type { PageServerLoad } from './$types.js';
import type { ComparisonStats } from '$lib/domain/types.js';

export const load: PageServerLoad = () => {
	// Fetch 360 days for static prerender (will be filtered client-side)
	const period = '360d';
	const days = 360;

	const allData = getAllDailyData(days);

	const stats: ComparisonStats = {
		period,
		repos: allData.map((item) => {
			const totalCommits = item.daily.reduce((sum, d) => sum + d.commits, 0);
			const activeDays = item.daily.filter((d) => d.commits > 0).length;

			return {
				id: item.repo.id,
				owner: item.repo.owner,
				name: item.repo.name,
				displayName: item.repo.displayName,
				totalCommits,
				activeDays,
				regularity: calculateRegularity(item.daily, days),
				maxGap: calculateMaxGap(item.daily),
				longestStreak: calculateLongestStreak(item.daily),
				firstCommitDate: item.firstCommitDate,
				lastCommitDate: item.lastCommitDate,
				netLoc: item.netLoc
			};
		})
	};

	return { stats, allData };
};

export const prerender = true;
