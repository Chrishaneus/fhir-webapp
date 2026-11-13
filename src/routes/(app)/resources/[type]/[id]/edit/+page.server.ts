import { error, fail, redirect } from '@sveltejs/kit';
import { can } from '#lib/auth/roles.js';
import { resourceType } from '#lib/fhir/resources.js';
import type { Resource } from '#lib/fhir/types.js';
import { ApiError, userApi } from '#lib/server/api.js';
import { editableJson, parseResourceJson } from '#lib/server/edit.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const config = resourceType(event.params.type);
	if (!config) error(404, `The app doesn’t show ${event.params.type} resources.`);
	try {
		const resource = await userApi(event)<Resource>(
			`/${config.type}/${encodeURIComponent(event.params.id)}`
		);
		return {
			type: config.type,
			id: event.params.id,
			version: resource.meta?.versionId ?? null,
			json: editableJson(resource)
		};
	} catch (e) {
		if (e instanceof ApiError)
			error(e.status === 410 ? 404 : e.status >= 500 ? 503 : e.status, e.message);
		throw e;
	}
};

/** The editor's text and the version it started from, checked; or a failure to show. */
async function read(event: Parameters<Actions[string]>[0]) {
	const config = resourceType(event.params.type);
	if (!config) error(404, 'Unknown resource type.');
	// The hook only lets clinicians and admins open this page; check the action as well.
	if (!can(event.locals.user, 'update')) error(403, 'Your role can’t change records.');
	const form = await event.request.formData();
	const json = String(form.get('json') ?? '');
	const version = String(form.get('version') ?? '');
	const parsed = parseResourceJson(json, config.type, event.params.id);
	return { config, json, version, parsed };
}

export const actions: Actions = {
	validate: async (event) => {
		const { config, json, parsed } = await read(event);
		if ('problem' in parsed) return fail(400, { json, problem: parsed.problem });
		try {
			await userApi(event)(`/${config.type}/$validate`, { method: 'POST', body: parsed.resource });
			return { json, valid: true };
		} catch (e) {
			if (e instanceof ApiError) return fail(e.status, { json, problem: e.message });
			throw e;
		}
	},
	save: async (event) => {
		const { config, json, version, parsed } = await read(event);
		if ('problem' in parsed) return fail(400, { json, problem: parsed.problem });
		try {
			await userApi(event)(`/${config.type}/${encodeURIComponent(event.params.id)}`, {
				method: 'PUT',
				body: parsed.resource,
				// Only if nobody saved a newer version since this one was opened.
				headers: version ? { 'if-match': `W/"${version}"` } : {}
			});
		} catch (e) {
			if (e instanceof ApiError) {
				const problem =
					e.status === 412
						? 'Someone saved a newer version since you opened this. Copy your changes, reload, and apply them again.'
						: e.message;
				return fail(e.status, { json, problem, conflict: e.status === 412 });
			}
			throw e;
		}
		redirect(303, `/resources/${config.type}/${encodeURIComponent(event.params.id)}?saved=1`);
	}
};
