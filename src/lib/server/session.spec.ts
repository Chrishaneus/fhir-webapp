import { describe, expect, it } from 'vitest';
import { readToken } from './session';

/** A token shaped like the API's (header.payload.signature); the signature isn't checked here. */
const token = (claims: Record<string, unknown>) =>
	['e30', Buffer.from(JSON.stringify(claims)).toString('base64url'), 'sig'].join('.');

const now = Date.parse('2026-11-13T12:00:00Z');
const later = now / 1000 + 3600;

describe('readToken', () => {
	it('reads the user, role and expiry', () => {
		expect(readToken(token({ sub: 'doc', role: 'clinician', exp: later }), now)).toEqual({
			username: 'doc',
			role: 'clinician',
			expiresAt: later * 1000
		});
	});

	it('refuses expired, unknown-role and malformed tokens', () => {
		expect(
			readToken(token({ sub: 'doc', role: 'clinician', exp: now / 1000 - 1 }), now)
		).toBeNull();
		expect(readToken(token({ sub: 'doc', role: 'superuser', exp: later }), now)).toBeNull();
		expect(readToken(token({ role: 'admin', exp: later }), now)).toBeNull();
		expect(readToken(token({ sub: 'doc', role: 'admin' }), now)).toBeNull();
		expect(readToken('not-a-token', now)).toBeNull();
		expect(readToken('a.%%%.c', now)).toBeNull();
	});
});
