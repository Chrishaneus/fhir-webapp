import type { Resource } from '#lib/fhir/types.js';

/** The editable JSON of a resource: everything but meta, which the server sets. */
export function editableJson(resource: Resource): string {
	const { meta: _meta, ...rest } = resource;
	return JSON.stringify(rest, null, 2);
}

/**
 * Parse an editor's JSON as a resource of the given type (and id, when editing one), or say
 * what's wrong with it in words.
 */
export function parseResourceJson(
	text: string,
	type: string,
	id?: string
): { resource: Resource } | { problem: string } {
	let value: unknown;
	try {
		value = JSON.parse(text);
	} catch (e) {
		return { problem: `That isn’t valid JSON: ${(e as Error).message}` };
	}
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return { problem: 'A resource is a JSON object, between { and }.' };
	}
	const resource = value as Resource;
	if (resource.resourceType !== type) {
		return { problem: `resourceType must be "${type}".` };
	}
	if (id !== undefined && resource.id !== id) {
		return { problem: `id must stay "${id}".` };
	}
	return { resource };
}
