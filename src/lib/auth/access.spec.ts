import { describe, expect, it } from 'vitest';
import { checkAccess, requiredAccess, safeRedirect } from './access';
import type { SessionUser } from './roles';

const as = (role: SessionUser['role']): SessionUser => ({
	username: role,
	role,
	expiresAt: Date.now() + 60_000
});

describe('checkAccess', () => {
	it('lets anyone open the public pages and assets', () => {
		for (const path of [
			'/',
			'/login',
			'/register/',
			'/logout',
			'/_app/immutable/x.js',
			'/favicon.svg'
		]) {
			expect(checkAccess(path, null), path).toBe('allowed');
		}
	});

	it('sends anyone signed out to sign in, for every other page, new ones included', () => {
		for (const path of ['/dashboard', '/resources/Patient', '/admin/users', '/some/new/page']) {
			expect(checkAccess(path, null), path).toBe('sign-in');
		}
	});

	it('keeps admin pages for admins', () => {
		expect(checkAccess('/admin/users', as('viewer'))).toBe('forbidden');
		expect(checkAccess('/admin/users', as('clinician'))).toBe('forbidden');
		expect(checkAccess('/admin/users', as('admin'))).toBe('allowed');
		// Not fooled by a lookalike.
		expect(requiredAccess('/administrator')).toEqual({ kind: 'signedIn' });
	});

	it('needs create and update for the new and edit pages, and read for the rest', () => {
		expect(checkAccess('/resources/Patient/new', as('viewer'))).toBe('forbidden');
		expect(checkAccess('/resources/Patient/new', as('clinician'))).toBe('allowed');
		expect(checkAccess('/resources/Patient/p1/edit', as('viewer'))).toBe('forbidden');
		expect(checkAccess('/resources/Patient/p1/edit', as('clinician'))).toBe('allowed');
		expect(checkAccess('/resources/Patient/p1', as('viewer'))).toBe('allowed');
		expect(checkAccess('/dashboard', as('viewer'))).toBe('allowed');
	});
});

describe('safeRedirect', () => {
	it('keeps paths on this site', () => {
		expect(safeRedirect('/resources/Patient?gender=female')).toBe(
			'/resources/Patient?gender=female'
		);
	});

	it('refuses anything that could lead to another site', () => {
		for (const target of [
			'https://evil.example',
			'//evil.example',
			'/\\evil.example',
			'javascript:alert(1)',
			'',
			null,
			undefined
		]) {
			expect(safeRedirect(target), String(target)).toBe('/dashboard');
		}
		expect(safeRedirect('//evil.example', '/')).toBe('/');
	});
});
