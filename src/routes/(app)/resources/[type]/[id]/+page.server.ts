import { error } from '@sveltejs/kit';
import { parseReference } from '#lib/fhir/format.js';
import { resourceType } from '#lib/fhir/resources.js';
import type { Resource } from '#lib/fhir/types.js';
import { ApiError, userApi } from '#lib/server/api.js';
import { displayName } from '#lib/server/search.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const config = resourceType(event.params.type);
	if (!config) error(404, `The app doesn’t show ${event.params.type} resources.`);
	const api = userApi(event);
	let resource: Resource;
	try {
		resource = await api<Resource>(`/${config.type}/${encodeURIComponent(event.params.id)}`);
	} catch (e) {
		if (e instanceof ApiError) {
			if (e.status === 404 || e.status === 410)
				error(404, `No ${config.label.toLowerCase()} with id ${event.params.id}.`);
			error(e.status >= 500 ? 503 : e.status, e.message);
		}
		throw e;
	}

	// Name the resources the summary points at; one that can't be read just keeps its reference.
	const references = new Set<string>();
	for (const column of config.columns) {
		const cell = column.value(resource);
		if (typeof cell !== 'string' && parseReference(cell.reference.reference)) {
			references.add(cell.reference.reference!);
		}
	}
	const names: Record<string, string> = {};
	await Promise.all(
		[...references].map(async (reference) => {
			try {
				names[reference] = displayName(await api<Resource>(`/${reference}`));
			} catch {
				// Shown as its reference instead.
			}
		})
	);
	return { type: config.type, resource, names };
};
