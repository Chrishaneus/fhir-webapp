import type { ResourceType } from './resources.js';
import type { Resource } from './types.js';

/**
 * A resource's heading: its first text column (a name, a code), else its type and id. Only that
 * column: a later one ("Active: Yes") wouldn't say which resource this is.
 */
export function displayTitle(config: ResourceType, resource: Resource): string {
	const fallback = `${config.label} ${resource.id ?? ''}`.trim();
	for (const column of config.columns) {
		const cell = column.value(resource);
		if (typeof cell === 'string') return cell || fallback;
	}
	return fallback;
}
