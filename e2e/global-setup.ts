import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { API_URL, heartRates, PASSWORD, patients, users } from './fixtures';

const here = import.meta.dirname;

async function api(
	pathname: string,
	init: { method?: string; body?: unknown; token?: string } = {}
) {
	const res = await fetch(`${API_URL}${pathname}`, {
		method: init.method ?? 'GET',
		headers: {
			'content-type': 'application/json',
			...(init.token ? { authorization: `Bearer ${init.token}` } : {})
		},
		body: init.body === undefined ? undefined : JSON.stringify(init.body)
	});
	const text = await res.text();
	if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${pathname}: ${res.status} ${text}`);
	return text ? JSON.parse(text) : null;
}

const login = async (username: string) =>
	(await api('/auth/login', { method: 'POST', body: { username, password: PASSWORD } }))
		.access_token as string;

/**
 * Start the API on a fresh database (unless E2E_REUSE_API is set, for a stack you started with
 * `e2e/api.sh up`), then create the users and data the tests rely on.
 */
export default async function globalSetup() {
	if (!process.env.E2E_REUSE_API) {
		execFileSync(path.join(here, 'api.sh'), ['up'], { stdio: 'inherit' });
	}

	// The first user of an empty server may be an admin; that admin adds the others.
	await api('/auth/register', {
		method: 'POST',
		body: { username: users.admin, password: PASSWORD, role: 'admin' }
	});
	const admin = await login(users.admin);
	for (const role of ['clinician', 'viewer'] as const) {
		await api('/auth/register', {
			method: 'POST',
			token: admin,
			body: { username: users[role], password: PASSWORD, role }
		});
	}

	for (const p of patients) {
		await api(`/Patient/${p.id}`, {
			method: 'PUT',
			token: admin,
			body: {
				resourceType: 'Patient',
				id: p.id,
				active: true,
				name: [{ use: 'official', family: p.family, given: [p.given] }],
				gender: p.gender,
				birthDate: p.birthDate
			}
		});
	}
	for (const hr of heartRates) {
		await api(`/Observation/${hr.id}`, {
			method: 'PUT',
			token: admin,
			body: {
				resourceType: 'Observation',
				id: hr.id,
				status: 'final',
				category: [{ coding: [{ code: 'vital-signs', display: 'Vital Signs' }] }],
				code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
				subject: { reference: 'Patient/e2e-ada' },
				effectiveDateTime: hr.when,
				valueQuantity: { value: hr.value, unit: '/min' }
			}
		});
	}
}
