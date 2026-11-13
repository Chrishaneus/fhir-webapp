import type { ResourceType } from '#lib/fhir/resources.js';
import { formatName } from '#lib/fhir/format.js';
import type { Bundle, HumanName, Resource } from '#lib/fhir/types.js';

/** Rows per page of a resource list. */
export const PAGE_SIZE = 20;

/** The page number in an address (`?page=3`), at least 1. */
export function pageOf(url: URL): number {
	const page = Number(url.searchParams.get('page'));
	return Number.isInteger(page) && page > 1 ? page : 1;
}

/** The API query for one page of a resource list. */
export function listQuery(config: ResourceType, url: URL): URLSearchParams {
	const query = new URLSearchParams();
	query.set('_count', String(PAGE_SIZE));
	query.set('_offset', String((pageOf(url) - 1) * PAGE_SIZE));
	if (config.defaultSort) query.set('_sort', config.defaultSort);
	for (const include of config.include ?? []) query.append('_include', include);
	return query;
}

/** A bundle's matches (the rows) and the names of what it included, by "Type/id". */
export function splitBundle(bundle: Bundle): { rows: Resource[]; names: Record<string, string> } {
	const rows: Resource[] = [];
	const names: Record<string, string> = {};
	for (const entry of bundle.entry ?? []) {
		const resource = entry.resource;
		if (!resource) continue;
		const mode = (entry as { search?: { mode?: string } }).search?.mode;
		if (mode === 'include') {
			names[`${resource.resourceType}/${resource.id}`] = displayName(resource);
		} else {
			rows.push(resource);
		}
	}
	return { rows, names };
}

/** What to call a resource: a person's name, an organization's name, else its type and id. */
export function displayName(resource: Resource): string {
	const fields = resource as Record<string, unknown>;
	if (Array.isArray(fields.name))
		return formatName(fields.name as HumanName[]) || resource.id || '';
	if (typeof fields.name === 'string') return fields.name;
	return `${resource.resourceType}/${resource.id}`;
}
