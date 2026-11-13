import type { ResourceType } from './resources.js';
import type { Resource } from './types.js';

/** A resource's heading: its first column's text (a name, a code), else its type and id. */
export function displayTitle(config: ResourceType, resource: Resource): string {
	for (const column of config.columns) {
		const cell = column.value(resource);
		if (typeof cell === 'string' && cell) return cell;
	}
	return `${config.label} ${resource.id ?? ''}`.trim();
}
