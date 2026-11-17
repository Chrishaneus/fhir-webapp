import { fail, redirect } from '@sveltejs/kit';
import { ApiError, callApi } from '#lib/server/api.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/dashboard');
};

/** At least this long; the API itself takes any password. */
const MIN_PASSWORD_LENGTH = 8;

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const confirm = String(form.get('confirm') ?? '');
		const values = { username, email };

		const errors: Record<string, string> = {};
		if (!/^[A-Za-z0-9._-]{3,64}$/.test(username)) {
			errors.username = 'Use 3–64 letters, digits, dots, dashes or underscores.';
		}
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			errors.email = 'That doesn’t look like an email address.';
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
		} else if (password !== confirm) {
			errors.confirm = 'The passwords don’t match.';
		}
		if (Object.keys(errors).length > 0) return fail(400, { ...values, errors });

		try {
			// Always the viewer role, which an admin can raise later. Leaving it out isn't enough:
			// the API's default is clinician.
			await callApi(fetch, '/auth/register', {
				method: 'POST',
				body: { username, password, role: 'viewer', ...(email ? { email } : {}) }
			});
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				const field = /email/i.test(error.message) ? 'email' : 'username';
				return fail(409, {
					...values,
					errors: {
						[field]:
							field === 'email' ? 'That email is already registered.' : 'That username is taken.'
					}
				});
			}
			return fail(400, {
				...values,
				errors: { form: error instanceof ApiError ? error.message : 'Creating the account failed.' }
			});
		}
		redirect(303, '/login?registered=1');
	}
};
