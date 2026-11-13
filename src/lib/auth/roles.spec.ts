import { describe, expect, it } from 'vitest';
import { can, isRole, type Permission, type SessionUser } from './roles';

const user = (role: SessionUser['role']): SessionUser => ({
	username: 'u',
	role,
	expiresAt: Date.now() + 60_000
});

describe('can', () => {
	it('matches what the API lets each role do', () => {
		const table: Record<SessionUser['role'], Permission[]> = {
			viewer: ['read'],
			clinician: ['read', 'create', 'update'],
			admin: ['read', 'create', 'update', 'delete', 'manageUsers']
		};
		const all: Permission[] = ['read', 'create', 'update', 'delete', 'manageUsers'];
		for (const [role, allowed] of Object.entries(table)) {
			for (const permission of all) {
				expect(can(user(role as SessionUser['role']), permission), `${role} ${permission}`).toBe(
					allowed.includes(permission)
				);
			}
		}
	});

	it('gives nobody signed out anything', () => {
		expect(can(null, 'read')).toBe(false);
		expect(can(undefined, 'read')).toBe(false);
	});

	it('knows the roles', () => {
		expect(isRole('clinician')).toBe(true);
		expect(isRole('superuser')).toBe(false);
		expect(isRole(undefined)).toBe(false);
	});
});
