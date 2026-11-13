import { describe, expect, it } from 'vitest';
import type { SessionUser } from '#lib/auth/roles.js';
import { isActive, navFor } from './navigation';

const as = (role: SessionUser['role']): SessionUser => ({ username: role, role, expiresAt: 0 });
const labels = (user: SessionUser | null) =>
	navFor(user).map((s) => `${s.label}: ${s.items.map((i) => i.label).join(', ')}`);

describe('navFor', () => {
	it('shows each role only what it may open', () => {
		expect(labels(as('viewer')).map((l) => l.split(':')[0])).toEqual(['Overview', 'Records']);
		expect(labels(as('clinician')).map((l) => l.split(':')[0])).toEqual(['Overview', 'Records']);
		expect(labels(as('admin')).map((l) => l.split(':')[0])).toEqual([
			'Overview',
			'Records',
			'Admin'
		]);
		expect(navFor(null)).toEqual([]);
	});

	it('lists every record type', () => {
		const records = navFor(as('viewer')).find((s) => s.label === 'Records')!;
		expect(records.items.map((i) => i.path)).toContain('/resources/Patient');
		expect(records.items).toHaveLength(10);
	});
});

describe('isActive', () => {
	it('matches the page and its sub-pages, not lookalikes', () => {
		expect(isActive('/resources/Patient', '/resources/Patient')).toBe(true);
		expect(isActive('/resources/Patient', '/resources/Patient/p1')).toBe(true);
		expect(isActive('/resources/Patient', '/resources/PatientX')).toBe(false);
	});
});
