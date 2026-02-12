import { json, error } from '@sveltejs/kit';
import { getRepoById, getRepoDailyData } from '$lib/server/db/queries.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = ({ params, url }) => {
	const id = parseInt(params.id, 10);

	if (isNaN(id)) {
		throw error(400, 'Invalid repo ID');
	}

	const repo = getRepoById(id);

	if (!repo) {
		throw error(404, 'Repository not found');
	}

	const daysParam = url.searchParams.get('days');
	const days = daysParam ? parseInt(daysParam, 10) : 90;

	if (isNaN(days) || days <= 0 || days > 365) {
		throw error(400, 'Invalid days parameter (must be 1-365)');
	}

	const daily = getRepoDailyData(id, days);

	return json({
		repo: { id: repo.id, owner: repo.owner, name: repo.name },
		daily
	});
};
