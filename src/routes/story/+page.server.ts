import { getAllDailyData } from '$lib/server/db/queries.js';
import { generateStorySummary } from '$lib/domain/stats.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = () => {
	const data30d = getAllDailyData(30);
	const data90d = getAllDailyData(90);

	const story30d = generateStorySummary(data30d, 30);
	const story90d = generateStorySummary(data90d, 90);

	return {
		story30d,
		story90d
	};
};

export const prerender = true;
