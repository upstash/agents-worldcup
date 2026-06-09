import { error } from '@sveltejs/kit';
import { fetchAgentDetail } from '$lib/server/boxes.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const detail = await fetchAgentDetail(params.name);
	if (!detail) throw error(404, `Unknown agent: ${params.name}`);

	setHeaders({
		'cache-control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=300'
	});

	return { name: params.name, ...detail };
};
