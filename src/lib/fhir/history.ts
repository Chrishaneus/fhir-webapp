import type { Bundle, Resource } from './types.js';

/** One version of a resource, from its history. */
export interface Version {
	versionId: string;
	/** Created, updated or deleted. */
	change: 'created' | 'updated' | 'deleted';
	lastUpdated?: string;
	/** The resource as it was; none for a deletion. */
	resource?: Resource;
	/** Top-level fields that differ from the version before; empty for the first. */
	changed: string[];
}

/** Fields every version has its own value for, so they never count as changes. */
const BOOKKEEPING = new Set(['meta', 'text']);

/** Top-level fields that differ between two versions, in name order. */
export function changedFields(before: Resource | undefined, after: Resource | undefined): string[] {
	if (!before || !after) return [];
	const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
	return [...keys]
		.filter((key) => !BOOKKEEPING.has(key))
		.filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
		.sort();
}

/** A history bundle as versions, newest first, each compared with the one before it. */
export function versionsOf(bundle: Bundle): Version[] {
	const versions = (bundle.entry ?? []).map((entry, i): Omit<Version, 'changed'> => {
		const method = entry.request?.method;
		const deleted =
			method === 'DELETE' || (!entry.resource && entry.response?.status?.startsWith('204'));
		const versionId =
			entry.resource?.meta?.versionId ??
			/\/_history\/([^/]+)$/.exec(entry.fullUrl ?? entry.request?.url ?? '')?.[1] ??
			String(i + 1);
		return {
			versionId,
			change: deleted ? 'deleted' : method === 'POST' || versionId === '1' ? 'created' : 'updated',
			lastUpdated: entry.resource?.meta?.lastUpdated,
			resource: entry.resource
		};
	});
	versions.sort((a, b) => Number(b.versionId) - Number(a.versionId));
	return versions.map((version, i) => ({
		...version,
		changed: changedFields(versions[i + 1]?.resource, version.resource)
	}));
}
