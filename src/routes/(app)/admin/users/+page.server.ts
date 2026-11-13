import { fail } from '@sveltejs/kit';
import { isRole } from '#lib/auth/roles.js';
import { ApiError, userApi } from '#lib/server/api.js';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const role = String(form.get('role') ?? '');
		const values = { username, role };

		const errors: Record<string, string> = {};
		if (!/^[A-Za-z0-9._-]{3,64}$/.test(username)) {
			errors.username = 'Use 3–64 letters, digits, dots, dashes or underscores.';
		}
		if (password.length < 8) errors.password = 'Use at least 8 characters.';
		if (!isRole(role)) errors.role = 'Choose a role.';
		if (Object.keys(errors).length > 0) return fail(400, { ...values, errors });

		try {
			// With the admin's token, the API lets the new user have any role.
			await userApi(event)('/auth/register', {
				method: 'POST',
				body: { username, password, role }
			});
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				return fail(409, { ...values, errors: { username: 'That username is taken.' } });
			}
			const message = error instanceof ApiError ? error.message : 'Adding the user failed.';
			return fail(400, { ...values, errors: { form: message } });
		}
		return { created: { username, role } };
	}
};
