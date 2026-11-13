import { describe, expect, it } from 'vitest';
import { changedFields, versionsOf } from './history';
import type { Bundle } from './types';

const patient = (version: string, extra: Record<string, unknown>) => ({
	resourceType: 'Patient',
	id: 'p1',
	meta: { versionId: version, lastUpdated: `2026-11-0${version}T00:00:00Z` },
	...extra
});

describe('changedFields', () => {
	it('lists the top-level fields that differ, not meta or text', () => {
		expect(
			changedFields(
				patient('1', { gender: 'male', name: [{ family: 'A' }], text: { div: 'a' } }),
				patient('2', { gender: 'male', name: [{ family: 'B' }], telecom: [], text: { div: 'b' } })
			)
		).toEqual(['name', 'telecom']);
		expect(changedFields(undefined, patient('1', {}))).toEqual([]);
	});
});

describe('versionsOf', () => {
	it('lists versions newest first, with what happened and what changed', () => {
		const bundle: Bundle = {
			resourceType: 'Bundle',
			type: 'history',
			entry: [
				{ resource: patient('1', { gender: 'male' }), request: { method: 'POST' } },
				{
					fullUrl: 'Patient/p1/_history/3',
					request: { method: 'DELETE', url: 'Patient/p1' },
					response: { status: '204 No Content' }
				},
				{ resource: patient('2', { gender: 'female' }), request: { method: 'PUT' } }
			]
		};
		expect(versionsOf(bundle).map((v) => [v.versionId, v.change, v.changed])).toEqual([
			['3', 'deleted', []],
			['2', 'updated', ['gender']],
			['1', 'created', []]
		]);
	});
});
