import { describe, expect, it } from 'vitest';
import { resourceGroups, resourceType, resourceTypes } from './resources';
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
	},
	Immunization: {
		resourceType: 'Immunization',
		id: 'i1',
		status: 'completed',
		vaccineCode: { coding: [{ code: '140', display: 'Influenza, seasonal' }] },
		patient: { reference: 'Patient/p1' },
		occurrenceDateTime: '2026-03-04'
	},
	MedicationAdministration: {
		resourceType: 'MedicationAdministration',
		id: 'ma1',
		status: 'completed',
		medication: { concept: { coding: [{ display: 'Lisinopril 10 MG' }] } },
		subject: { reference: 'Patient/p1' },
		occurenceDateTime: '2026-03-05',
		dosage: { dose: { value: 10, unit: 'mg' } }
	},
	Appointment: {
		resourceType: 'Appointment',
		id: 'a1',
		status: 'booked',
		description: 'Routine follow-up',
		start: '2026-06-01',
		participant: [
			{ actor: { reference: 'Practitioner/d1' }, status: 'accepted' },
			{ actor: { reference: 'Patient/p1' }, status: 'accepted' }
		]
	},
	Composition: {
		resourceType: 'Composition',
		id: 'c1',
		status: 'final',
		title: 'Discharge Summary',
		subject: [{ reference: 'Patient/p1' }]
	},
	Claim: {
		resourceType: 'Claim',
		id: 'cl1',
		status: 'active',
		patient: { reference: 'Patient/p1' },
		item: [{ sequence: 1, net: { value: 125.5, currency: 'USD' } }]
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
		expect(cells('Immunization')).toMatchObject({
			Patient: { reference: { reference: 'Patient/p1' } },
			Vaccine: 'Influenza, seasonal',
			Given: 'Mar 4, 2026'
		});
		// R5 spells occurenceDateTime with one "r".
		expect(cells('MedicationAdministration')).toMatchObject({
			Medication: 'Lisinopril 10 MG',
			Dose: '10 mg',
			Given: 'Mar 5, 2026'
		});
		// The participant who is a patient, not the first one.
		expect(cells('Appointment')).toMatchObject({
			Patient: { reference: { reference: 'Patient/p1' } },
			Description: 'Routine follow-up'
		});
		expect(cells('Composition')).toMatchObject({
			Patient: { reference: { reference: 'Patient/p1' } },
			Title: 'Discharge Summary'
		});
		expect(cells('Claim')).toMatchObject({ Total: '125.5 USD' });
	});

	it('belong to a kind of record, and link new ones to a patient', () => {
		const groups: string[] = resourceGroups.map((g) => g.id);
		for (const config of resourceTypes) expect(groups, config.type).toContain(config.group);
		expect(new Set(resourceTypes.map((t) => t.type)).size).toBe(resourceTypes.length);
		const patient = { reference: 'Patient/p1' };
		expect(resourceType('AllergyIntolerance')!.forPatient!(patient)).toEqual({ patient });
		expect(resourceType('Composition')!.forPatient!(patient)).toEqual({ subject: [patient] });
		expect(resourceType('Coverage')!.forPatient!(patient)).toEqual({ beneficiary: patient });
		expect(resourceType('Observation')!.forPatient).toBeUndefined();
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
