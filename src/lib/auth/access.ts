import { can, type Permission, type SessionUser } from './roles.js';

/** Who may open a page: anyone, anyone signed in, or someone with a permission. */
export type Access =
	{ kind: 'public' } | { kind: 'signedIn' } | { kind: 'permission'; permission: Permission };

const PUBLIC: Access = { kind: 'public' };
const SIGNED_IN: Access = { kind: 'signedIn' };
const needs = (permission: Permission): Access => ({ kind: 'permission', permission });

/**
 * Page access by path, first match wins. Anything not listed needs a signed-in user, so a new
 * page is never public by accident.
 */
const rules: [RegExp, Access][] = [
	[/^\/$/, PUBLIC],
	[/^\/(login|register|logout)\/?$/, PUBLIC],
	// Built assets and files from static/.
	[/^\/_app\//, PUBLIC],
	[/^\/[^/]+\.[a-z0-9]+$/i, PUBLIC],
	[/^\/admin(\/|$)/, needs('manageUsers')],
	[/^\/resources\/[^/]+\/new\/?$/, needs('create')],
	[/^\/resources\/[^/]+\/[^/]+\/edit\/?$/, needs('update')]
];

export function requiredAccess(pathname: string): Access {
	return rules.find(([pattern]) => pattern.test(pathname))?.[1] ?? SIGNED_IN;
}

/** Whether a user may open a page: yes, they need to sign in first, or they may not. */
export function checkAccess(
	pathname: string,
	user: SessionUser | null
): 'allowed' | 'sign-in' | 'forbidden' {
	const access = requiredAccess(pathname);
	if (access.kind === 'public') return 'allowed';
	if (!user) return 'sign-in';
	if (access.kind === 'permission' && !can(user, access.permission)) return 'forbidden';
	return 'allowed';
}

export const FORBIDDEN = 'Your role doesn’t allow this page.';

/** Where to go after signing in: only a path on this site, never another site. */
export function safeRedirect(target: string | null | undefined, fallback = '/dashboard'): string {
	if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
		return fallback;
	}
	return target;
}
