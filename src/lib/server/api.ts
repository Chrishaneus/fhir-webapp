import { redirect, type RequestEvent } from '@sveltejs/kit';
import { FHIR_API_URL } from '$app/env/private';
import { clearSession } from './session.js';

/** The FHIR API's address; FHIR_API_URL in the environment. */
export const apiUrl = () => FHIR_API_URL;

/** An error from the API, with the message of its OperationOutcome when it sent one. */
export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
	}
}

interface OperationOutcome {
	resourceType: 'OperationOutcome';
	issue?: { diagnostics?: string; details?: { text?: string } }[];
}

/** The readable part of an error response, preferring an OperationOutcome's diagnostics. */
export function errorMessage(body: unknown, status: number): string {
	const outcome = body as OperationOutcome | null;
	if (outcome?.resourceType === 'OperationOutcome') {
		const text = outcome.issue
			?.map((issue) => issue.diagnostics ?? issue.details?.text)
			.filter(Boolean)
			.join(' ');
		if (text) return text;
	}
	const detail = (body as { detail?: unknown } | null)?.detail;
	if (typeof detail === 'string') return detail;
	return `The FHIR server answered ${status}.`;
}

/**
 * Call the API from the server. JSON in and out; a failed response throws ApiError, and the
 * server being unreachable throws ApiError 503.
 */
export async function callApi<T>(
	fetch: typeof globalThis.fetch,
	path: string,
	init: {
		method?: string;
		body?: unknown;
		token?: string | null;
		headers?: Record<string, string>;
	} = {}
): Promise<T> {
	let res: Response;
	try {
		res = await fetch(`${apiUrl()}${path}`, {
			method: init.method ?? 'GET',
			headers: {
				accept: 'application/fhir+json, application/json',
				...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
				...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
				...init.headers
			},
			body: init.body !== undefined ? JSON.stringify(init.body) : undefined
		});
	} catch {
		throw new ApiError(503, 'Can’t reach the FHIR server. Is it running?');
	}
	const text = await res.text();
	let body: unknown;
	try {
		body = text ? JSON.parse(text) : null;
	} catch {
		body = text;
	}
	if (!res.ok) throw new ApiError(res.status, errorMessage(body, res.status));
	return body as T;
}

/**
 * The signed-in user's API: their token on every call. When the API no longer accepts the token
 * (expired or revoked), the session ends and they're sent to sign in again.
 */
export function userApi(event: RequestEvent) {
	return async <T>(path: string, init: Omit<Parameters<typeof callApi>[2], 'token'> = {}) => {
		try {
			return await callApi<T>(event.fetch, path, { ...init, token: event.locals.token });
		} catch (error) {
			if (error instanceof ApiError && error.status === 401) {
				clearSession(event.cookies);
				const back = event.url.pathname + event.url.search;
				redirect(303, `/login?expired=1&redirectTo=${encodeURIComponent(back)}`);
			}
			throw error;
		}
	};
}
