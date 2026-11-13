import { error } from '@sveltejs/kit';
import type { Bundle, Resource } from '#lib/fhir/types.js';
import { ApiError, userApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

/** The resource types counted on the dashboard, in order. */
const COUNTED = [
	'Patient',
	'Practitioner',
	'Encounter',
	'Observation',
	'Condition',
	'MedicationRequest'
] as const;

const GENDERS = ['female', 'male', 'other', 'unknown'] as const;

export const load: PageServerLoad = async (event) => {
	const api = userApi(event);
	const total = (query: string) => api<Bundle>(query).then((b) => b.total ?? 0);
	try {
		// All at once: each is one small request (`_summary=count` sends no resources).
		const [counts, genders, encounters, changes] = await Promise.all([
			Promise.all(
				COUNTED.map(async (type) => ({ type, total: await total(`/${type}?_summary=count`) }))
			),
			Promise.all(
				GENDERS.map(async (gender) => ({
					gender,
					total: await total(`/Patient?gender=${gender}&_summary=count`)
				}))
			),
			// With each encounter's patient, to show their name.
			api<Bundle>('/Encounter?_sort=-date&_count=5&_include=Encounter:subject'),
			api<Bundle<Resource>>('/_history?_count=8')
		]);
		return { counts, genders, encounters, changes };
	} catch (e) {
		if (e instanceof ApiError) error(e.status >= 500 ? 503 : e.status, e.message);
		throw e;
	}
};
