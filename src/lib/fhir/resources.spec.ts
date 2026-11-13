import { describe, expect, it } from 'vitest';
import { resourceType, resourceTypes } from './resources';
import { displayTitle } from './title';
import type { Resource } from './types';

/** Resources shaped like the API's seeded data. */
const samples: Record<string, Resource> = {
	Patient: {
		resourceType: 'Patient',
		id: 'p1',
		name: [{ use: 'official', given: ['Tiffany'], family: 'Walker' }],
		gender: 'other',
		birthDate: '1990-02-21',
		active: true
	},
	Observation: {
		resourceType: 'Observation',
		id: 'o1',
		status: 'final',
		code: { coding: [{ code: '8867-4', display: 'Heart rate' }] },
		subject: { reference: 'Patient/p1' },
		valueQuantity: { value: 72, unit: '/min' },
		effectiveDateTime: '2026-05-26'
	},
	MedicationRequest: {
		resourceType: 'MedicationRequest',
		id: 'm1',
		status: 'stopped',
		intent: 'order',
		subject: { reference: 'Patient/p1' },
		requester: { reference: 'Practitioner/d1' },
		medication: { concept: { coding: [{ display: 'Hydrochlorothiazide' }] } }
	}
};

const cells = (type: string) =>
	Object.fromEntries(resourceType(type)!.columns.map((c) => [c.label, c.value(samples[type])]));

describe('resource types', () => {
	it('read the fields each type shows', () => {
		expect(cells('Patient')).toMatchObject({
			Name: 'Tiffany Walker',
			Gender: 'other',
			'Birth date': 'Feb 21, 1990',
			Active: 'Yes'
		});
		expect(cells('Observation')).toMatchObject({
			Patient: { reference: { reference: 'Patient/p1' } },
			Observation: 'Heart rate',
			Value: '72 /min',
			When: 'May 26, 2026'
		});
		expect(cells('MedicationRequest')).toMatchObject({
			Medication: 'Hydrochlorothiazide',
			Prescriber: { reference: { reference: 'Practitioner/d1' } }
		});
	});

	it('cope with resources missing every field', () => {
		for (const config of resourceTypes) {
			const empty = { resourceType: config.type, id: 'x' };
			for (const column of config.columns) {
				expect(() => column.value(empty), `${config.type} ${column.label}`).not.toThrow();
			}
		}
	});

	it('are configured consistently', () => {
		for (const config of resourceTypes) {
			const keys = config.search.map((f) => f.key);
			expect(new Set(keys).size, `${config.type} search keys`).toBe(keys.length);
			// The default sort is one of the sortable columns.
			if (config.defaultSort) {
				const sorts = config.columns.flatMap((c) => (c.sort ? [c.sort, `-${c.sort}`] : []));
				expect(sorts, config.type).toContain(config.defaultSort);
			}
			for (const field of config.search) {
				if (field.kind === 'select') expect(field.options?.length, field.key).toBeGreaterThan(0);
			}
		}
		expect(resourceType('Bundle')).toBeUndefined();
	});

	it('give a resource a heading', () => {
		expect(displayTitle(resourceType('Patient')!, samples.Patient)).toBe('Tiffany Walker');
		expect(displayTitle(resourceType('Observation')!, samples.Observation)).toBe('Heart rate');
		expect(
			displayTitle(resourceType('Organization')!, { resourceType: 'Organization', id: 'o9' })
		).toBe('Organization o9');
		// Not a later column, even one with text.
		expect(
			displayTitle(resourceType('Organization')!, {
				resourceType: 'Organization',
				id: 'o9',
				active: true
			})
		).toBe('Organization o9');
	});
});
