import { describe, expect, it, vi } from 'vitest';
import { ApiError, callApi, errorMessage } from './api';

const json = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/fhir+json' }
	});

describe('errorMessage', () => {
	it('reads an OperationOutcome, else a detail, else the status', () => {
		expect(
			errorMessage(
				{
					resourceType: 'OperationOutcome',
					issue: [{ diagnostics: 'First.' }, { details: { text: 'Second.' } }]
				},
				422
			)
		).toBe('First. Second.');
		expect(errorMessage({ detail: 'Not Found' }, 404)).toBe('Not Found');
		expect(errorMessage('boom', 500)).toBe('The FHIR server answered 500.');
	});
});

describe('callApi', () => {
	it('sends JSON with the token and returns the response', async () => {
		const fetch = vi.fn(async () => json(200, { resourceType: 'Patient', id: 'p1' }));
		const patient = await callApi(fetch, '/Patient', {
			method: 'POST',
			body: { resourceType: 'Patient' },
			token: 't0k'
		});
		expect(patient).toEqual({ resourceType: 'Patient', id: 'p1' });
		const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('http://localhost:8000/Patient');
		expect(init.method).toBe('POST');
		expect(init.body).toBe('{"resourceType":"Patient"}');
		expect(init.headers).toMatchObject({
			authorization: 'Bearer t0k',
			'content-type': 'application/json'
		});
	});

	it('throws the API’s error with its status and message', async () => {
		const fetch = vi.fn(async () =>
			json(412, {
				resourceType: 'OperationOutcome',
				issue: [{ diagnostics: 'If-Match did not match the current resource version' }]
			})
		);
		await expect(callApi(fetch, '/Patient/p1', { method: 'PUT', body: {} })).rejects.toMatchObject({
			status: 412,
			message: 'If-Match did not match the current resource version'
		});
	});

	it('says so when the server can’t be reached', async () => {
		const fetch = vi.fn(async () => {
			throw new TypeError('fetch failed');
		});
		const error = (await callApi(fetch, '/metadata').catch((e: unknown) => e)) as ApiError;
		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ status: 503 });
		expect(error.message).toMatch(/Can’t reach the FHIR server/);
	});
});
