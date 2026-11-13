import { describe, expect, it } from 'vitest';
import {
	ageFrom,
	formatConcept,
	formatDate,
	formatName,
	formatPeriod,
	formatQuantity,
	formatReference,
	parseReference,
	timeAgo
} from './format';

describe('formatName', () => {
	it('prefers the official name, then text, then its parts', () => {
		expect(
			formatName([
				{ use: 'usual', given: ['Al'] },
				{ use: 'official', family: 'Smith', given: ['Jo', 'Ann'], prefix: ['Dr'] }
			])
		).toBe('Dr Jo Ann Smith');
		expect(formatName([{ text: 'Jo Smith', family: 'Ignored' }])).toBe('Jo Smith');
		expect(formatName([])).toBe('');
		expect(formatName(undefined)).toBe('');
	});
});

describe('formatConcept', () => {
	it('uses the text, else the first display, else the code', () => {
		expect(formatConcept({ text: 'Heart rate', coding: [{ code: '8867-4' }] })).toBe('Heart rate');
		expect(formatConcept({ coding: [{ code: 'x' }, { code: 'y', display: 'Why' }] })).toBe('Why');
		expect(formatConcept({ coding: [{ code: 'HH' }] })).toBe('HH');
		expect(formatConcept([{ text: 'first' }, { text: 'second' }])).toBe('first');
		expect(formatConcept(undefined)).toBe('');
	});
});

describe('references', () => {
	it('shows a display or the reference', () => {
		expect(formatReference({ reference: 'Patient/1', display: 'Jo' })).toBe('Jo');
		expect(formatReference({ reference: 'Patient/1' })).toBe('Patient/1');
	});

	it('reads relative references only', () => {
		expect(parseReference('Patient/bulk-patient-000001')).toEqual({
			type: 'Patient',
			id: 'bulk-patient-000001'
		});
		expect(parseReference('https://example.org/fhir/Patient/1')).toBeNull();
		expect(parseReference('#contained')).toBeNull();
		expect(parseReference('Patient/../admin')).toBeNull();
		expect(parseReference(undefined)).toBeNull();
	});
});

describe('formatQuantity', () => {
	it('joins the value and its unit', () => {
		expect(formatQuantity({ value: 72, unit: '/min' })).toBe('72 /min');
		expect(formatQuantity({ value: 37.3, code: 'Cel' })).toBe('37.3 Cel');
		expect(formatQuantity({ value: 0 })).toBe('0');
		expect(formatQuantity({ unit: 'kg' })).toBe('');
	});
});

describe('dates', () => {
	it('keeps partial dates, and never moves a plain date to another day', () => {
		expect(formatDate('2024')).toBe('2024');
		expect(formatDate('2024-05')).toBe('2024-05');
		expect(formatDate('2024-05-03')).toBe('May 3, 2024');
		expect(formatDate('2024-01-01')).toBe('Jan 1, 2024');
		expect(formatDate('not a date')).toBe('not a date');
		expect(formatDate(undefined)).toBe('');
	});

	it('shows a period from either end', () => {
		expect(formatPeriod({ start: '2024-05-03', end: '2024-05-04' })).toBe(
			'May 3, 2024 – May 4, 2024'
		);
		expect(formatPeriod({ start: '2024-05-03' })).toBe('from May 3, 2024');
		expect(formatPeriod({ end: '2024-05-04' })).toBe('until May 4, 2024');
		expect(formatPeriod({})).toBe('');
	});

	it('counts age in whole years, the birthday included', () => {
		const today = new Date('2026-11-13T12:00:00Z');
		expect(ageFrom('2000-11-13', today)).toBe(26);
		expect(ageFrom('2000-11-14', today)).toBe(25);
		expect(ageFrom('2026-12-01', today)).toBeNull();
		expect(ageFrom('2000', today)).toBeNull();
	});

	it('says how long ago', () => {
		const now = Date.parse('2026-11-13T12:00:00Z');
		expect(timeAgo('2026-11-10T12:00:00Z', now)).toBe('3 days ago');
		expect(timeAgo('2026-11-13T11:58:00Z', now)).toBe('2 minutes ago');
		expect(timeAgo('2026-11-13T12:00:00Z', now)).toBe('now');
		expect(timeAgo(undefined, now)).toBe('');
	});
});
