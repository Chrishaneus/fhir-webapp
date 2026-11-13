import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/env';
import { isRole, type SessionUser } from '#lib/auth/roles.js';

/** The httpOnly cookie that holds the API's access token; page scripts can't read it. */
export const SESSION_COOKIE = 'fhir_session';

/**
 * The user an access token is for, read from its payload, or null when it's malformed or expired.
 * The signature isn't checked here (the app doesn't know the API's secret): the API checks it on
 * every request, so a forged token gets nothing from it. The role only decides what the app shows.
 */
export function readToken(token: string, now = Date.now()): SessionUser | null {
	const [, payload] = token.split('.');
	if (!payload) return null;
	try {
		const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
			sub?: unknown;
			role?: unknown;
			exp?: unknown;
		};
		if (typeof claims.sub !== 'string' || !isRole(claims.role) || typeof claims.exp !== 'number') {
			return null;
		}
		const expiresAt = claims.exp * 1000;
		if (expiresAt <= now) return null;
		return { username: claims.sub, role: claims.role, expiresAt };
	} catch {
		return null;
	}
}

export function setSession(cookies: Cookies, token: string, user: SessionUser) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		expires: new Date(user.expiresAt)
	});
}

export function clearSession(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
