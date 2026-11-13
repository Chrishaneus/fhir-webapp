import { fail, redirect } from '@sveltejs/kit';
import { safeRedirect } from '#lib/auth/access.js';
import { ApiError, callApi } from '#lib/server/api.js';
import { readToken, setSession } from '#lib/server/session.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	const redirectTo = safeRedirect(url.searchParams.get('redirectTo'));
	if (locals.user) redirect(303, redirectTo);
	return {
		redirectTo,
		expired: url.searchParams.has('expired'),
		registered: url.searchParams.has('registered')
	};
};

/** What went wrong, in words, for each way the API refuses a sign-in. */
function signInError(error: unknown): string {
	if (!(error instanceof ApiError)) return 'Signing in failed. Try again.';
	switch (error.status) {
		case 401:
			return 'Wrong username or password.';
		case 403:
			return 'This account is deactivated.';
		case 423:
			return 'Too many failed attempts: this account is locked for a while.';
		case 503:
			return error.message.startsWith('Can’t reach')
				? error.message
				: 'This FHIR server has sign-in turned off (it has no JWT_SECRET).';
		default:
			return error.message;
	}
}

export const actions: Actions = {
	default: async ({ request, fetch, cookies, url }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');
		if (!username || !password) {
			return fail(400, { username, error: 'Enter your username and password.' });
		}
		let token: string;
		try {
			({ access_token: token } = await callApi<{ access_token: string }>(fetch, '/auth/login', {
				method: 'POST',
				body: { username, password }
			}));
		} catch (error) {
			return fail(400, { username, error: signInError(error) });
		}
		const user = readToken(token);
		if (!user) return fail(500, { username, error: 'The server sent a token the app can’t read.' });
		setSession(cookies, token, user);
		redirect(303, safeRedirect(url.searchParams.get('redirectTo')));
	}
};
