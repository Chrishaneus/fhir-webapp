import { describe, expect, it } from 'vitest';
import type { SessionUser } from '#lib/auth/roles.js';
import { resourceGroups, resourceTypes } from '#lib/fhir/resources.js';
import { isActive, navFor } from './navigation';

const as = (role: SessionUser['role']): SessionUser => ({ username: role, role, expiresAt: 0 });
const sectionLabels = (user: SessionUser | null) => navFor(user).map((s) => s.label);
const recordSections: string[] = resourceGroups.map((g) => g.label);

describe('navFor', () => {
	it('shows each role only what it may open', () => {
		expect(sectionLabels(as('viewer'))).toEqual(['Overview', ...recordSections]);
		expect(sectionLabels(as('clinician'))).toEqual(['Overview', ...recordSections]);
		expect(sectionLabels(as('admin'))).toEqual(['Overview', ...recordSections, 'Admin']);
		expect(navFor(null)).toEqual([]);
	});

	it('lists every record type once, under its kind', () => {
		const sections = navFor(as('viewer')).filter((s) => recordSections.includes(s.label));
		const paths = sections.flatMap((s) => s.items.map((i) => i.path));
		expect(paths).toHaveLength(resourceTypes.length);
		expect(new Set(paths).size).toBe(paths.length);
		expect(
			sections.find((s) => s.label === 'People and places')!.items.map((i) => i.path)
		).toContain('/resources/Patient');
		expect(sections.find((s) => s.label === 'Medications')!.items.map((i) => i.path)).toContain(
			'/resources/MedicationRequest'
		);
		for (const section of sections) expect(section.items.length, section.label).toBeGreaterThan(0);
	});
});

describe('isActive', () => {
	it('matches the page and its sub-pages, not lookalikes', () => {
		expect(isActive('/resources/Patient', '/resources/Patient')).toBe(true);
		expect(isActive('/resources/Patient', '/resources/Patient/p1')).toBe(true);
		expect(isActive('/resources/Patient', '/resources/PatientX')).toBe(false);
	});
});
