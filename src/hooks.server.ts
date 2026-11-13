import { error, redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { checkAccess } from '#lib/auth/access.js';
import { clearSession, readToken, SESSION_COOKIE } from '#lib/server/session.js';

/**
 * Every request: who's signed in (from the session cookie), then whether they may open the page.
 * Pages need a signed-in user unless listed as public in #lib/auth/access.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE) ?? null;
	const user = token ? readToken(token) : null;
	if (token && !user) clearSession(event.cookies);
	event.locals.user = user;
	event.locals.token = user ? token : null;

	const verdict = checkAccess(event.url.pathname, user);
	if (verdict === 'sign-in') {
		const back = event.url.pathname + event.url.search;
		redirect(303, `/login?redirectTo=${encodeURIComponent(back)}`);
	}
	if (verdict === 'forbidden') {
		error(403, 'Your role doesn’t allow this page.');
	}
	return resolve(event);
};
