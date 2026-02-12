import { getAllDailyData } from '$lib/server/db/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = () => {
	// Fetch 360 days (will be filtered client-side based on date range selector)
	const allData = getAllDailyData(360);

	return {
		allData
	};
};

export const prerender = true;
