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

/** The sort in an address (`?sort=-date`), if it's one of the type's sortable columns. */
export function sortOf(config: ResourceType, url: URL): string | undefined {
	const sort = url.searchParams.get('sort');
	const allowed = config.columns.flatMap((c) => (c.sort ? [c.sort, `-${c.sort}`] : []));
	return sort && allowed.includes(sort) ? sort : undefined;
}

/** The filters in an address, by search field key; empty values are left out. */
export function filtersOf(config: ResourceType, url: URL): Record<string, string> {
	const filters: Record<string, string> = {};
	for (const field of config.search) {
		const value = url.searchParams.get(field.key)?.trim();
		if (value && (field.kind !== 'select' || field.options?.includes(value))) {
			filters[field.key] = value;
		}
	}
	return filters;
}

/**
 * The API query for one page of a resource list: the filters (with a date field's prefix, such
 * as `ge` for "from"), the sort or the type's default, the page, and what to include.
 */
export function listQuery(config: ResourceType, url: URL): URLSearchParams {
	const query = new URLSearchParams();
	const filters = filtersOf(config, url);
	for (const field of config.search) {
		const value = filters[field.key];
		if (value) query.append(field.param, `${field.prefix ?? ''}${value}`);
	}
	const sort = sortOf(config, url) ?? config.defaultSort;
	if (sort) query.set('_sort', sort);
	query.set('_count', String(PAGE_SIZE));
	query.set('_offset', String((pageOf(url) - 1) * PAGE_SIZE));
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
