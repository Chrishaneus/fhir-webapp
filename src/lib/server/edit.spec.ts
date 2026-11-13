import { describe, expect, it } from 'vitest';
import { editableJson, parseResourceJson } from './edit';

describe('editableJson', () => {
	it('leaves meta out, which the server sets', () => {
		expect(
			JSON.parse(
				editableJson({
					resourceType: 'Patient',
					id: 'p1',
					meta: { versionId: '2' },
					gender: 'male'
				})
			)
		).toEqual({ resourceType: 'Patient', id: 'p1', gender: 'male' });
	});
});

describe('parseResourceJson', () => {
	it('accepts a resource of the right type and id', () => {
		expect(parseResourceJson('{"resourceType":"Patient","id":"p1"}', 'Patient', 'p1')).toEqual({
			resource: { resourceType: 'Patient', id: 'p1' }
		});
		expect(parseResourceJson('{"resourceType":"Patient"}', 'Patient')).toEqual({
			resource: { resourceType: 'Patient' }
		});
	});

	it('says what’s wrong otherwise', () => {
		const problem = (text: string, id?: string) =>
			(parseResourceJson(text, 'Patient', id) as { problem: string }).problem;
		expect(problem('{nope')).toMatch(/isn’t valid JSON/);
		expect(problem('[1, 2]')).toMatch(/JSON object/);
		expect(problem('null')).toMatch(/JSON object/);
		expect(problem('{"resourceType":"Observation"}')).toBe('resourceType must be "Patient".');
		expect(problem('{"resourceType":"Patient","id":"other"}', 'p1')).toBe('id must stay "p1".');
	});
});
