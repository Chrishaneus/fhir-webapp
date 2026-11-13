import { error } from '@sveltejs/kit';
import { resourceType } from '#lib/fhir/resources.js';
import type { Bundle } from '#lib/fhir/types.js';
import { ApiError, userApi } from '#lib/server/api.js';
import { listQuery, pageOf, PAGE_SIZE, splitBundle } from '#lib/server/search.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const config = resourceType(event.params.type);
	if (!config) error(404, `The app doesn’t show ${event.params.type} resources.`);
	const query = listQuery(config, event.url);
	try {
		const bundle = await userApi(event)<Bundle>(`/${config.type}?${query}`);
		const { rows, names } = splitBundle(bundle);
		return {
			type: config.type,
			rows,
			names,
			total: bundle.total ?? rows.length,
			page: pageOf(event.url),
			pageSize: PAGE_SIZE
		};
	} catch (e) {
		if (e instanceof ApiError) error(e.status >= 500 ? 503 : e.status, e.message);
		throw e;
	}
};
