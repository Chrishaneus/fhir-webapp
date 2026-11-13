import { describe, expect, it } from 'vitest';
import { resourceType } from '#lib/fhir/resources.js';
import {
	displayName,
	filtersOf,
	listQuery,
	pageOf,
	patientOf,
	sortOf,
	splitBundle
} from './search';

const url = (query: string) => new URL(`http://app.test/resources/X?${query}`);
const patients = resourceType('Patient')!;
const observations = resourceType('Observation')!;

describe('listQuery', () => {
	it('sends the filters with their prefixes, the sort, the page and the includes', () => {
		const query = listQuery(observations, url('status=final&from=2026-01-01&to=2026-06-30&page=3'));
		expect([...query]).toEqual([
			['status', 'final'],
			['date', 'ge2026-01-01'],
			['date', 'le2026-06-30'],
			['_sort', '-date'],
			['_count', '20'],
			['_offset', '40'],
			['_include', 'Observation:subject']
		]);
	});

	it('limits a list to a patient, for types that have one', () => {
		expect(listQuery(observations, url('patient=p-1')).get('patient')).toBe('Patient/p-1');
		expect(patientOf(patients, url('patient=p-1'))).toBeUndefined();
		expect(patientOf(observations, url('patient=../admin'))).toBeUndefined();
	});
});

describe('reading the address', () => {
	it('keeps only known choices and sortable columns', () => {
		expect(filtersOf(patients, url('gender=female&family=%20Sm%20&given='))).toEqual({
			gender: 'female',
			family: 'Sm'
		});
		expect(filtersOf(patients, url('gender=robot'))).toEqual({});
		expect(sortOf(patients, url('sort=-birthdate'))).toBe('-birthdate');
		expect(sortOf(patients, url('sort=password'))).toBeUndefined();
	});

	it('reads the page, at least 1', () => {
		expect(pageOf(url('page=4'))).toBe(4);
		for (const bad of ['page=0', 'page=-2', 'page=1.5', 'page=x', ''])
			expect(pageOf(url(bad))).toBe(1);
	});
});

describe('splitBundle', () => {
	it('separates the matches from what they included, named', () => {
		const { rows, names } = splitBundle({
			resourceType: 'Bundle',
			type: 'searchset',
			entry: [
				{ resource: { resourceType: 'Observation', id: 'o1' }, search: { mode: 'match' } },
				{
					resource: {
						resourceType: 'Patient',
						id: 'p1',
						name: [{ given: ['Jo'], family: 'Smith' }]
					},
					search: { mode: 'include' }
				},
				{
					resource: { resourceType: 'Organization', id: 'g1', name: 'Clinic' },
					search: { mode: 'include' }
				}
			] as never
		});
		expect(rows.map((r) => r.id)).toEqual(['o1']);
		expect(names).toEqual({ 'Patient/p1': 'Jo Smith', 'Organization/g1': 'Clinic' });
		expect(displayName({ resourceType: 'Device', id: 'd1' })).toBe('Device/d1');
	});
});
