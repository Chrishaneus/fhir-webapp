import { error } from '@sveltejs/kit';
import { resourceType } from '#lib/fhir/resources.js';
import type { Bundle, Resource } from '#lib/fhir/types.js';
import { ApiError, userApi } from '#lib/server/api.js';
import {
	displayName,
	filtersOf,
	listQuery,
	patientOf,
	pageOf,
	PAGE_SIZE,
	sortOf,
	splitBundle
} from '#lib/server/search.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const config = resourceType(event.params.type);
	if (!config) error(404, `The app doesn’t show ${event.params.type} resources.`);
	const query = listQuery(config, event.url);
	const patientId = patientOf(config, event.url);
	const api = userApi(event);
	try {
		const [bundle, patient] = await Promise.all([
			api<Bundle>(`/${config.type}?${query}`),
			patientId
				? api<Resource>(`/Patient/${patientId}`).then(
						(p) => ({ id: patientId, name: displayName(p) }),
						() => ({ id: patientId, name: patientId })
					)
				: null
		]);
		const { rows, names } = splitBundle(bundle);
		return {
			type: config.type,
			rows,
			names,
			total: bundle.total ?? rows.length,
			page: pageOf(event.url),
			pageSize: PAGE_SIZE,
			filters: filtersOf(config, event.url),
			sort: sortOf(config, event.url) ?? config.defaultSort ?? null,
			patient
		};
	} catch (e) {
		if (e instanceof ApiError) error(e.status >= 500 ? 503 : e.status, e.message);
		throw e;
	}
};
