import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { resourceType } from '#lib/fhir/resources.js';
import SearchForm from './SearchForm.svelte';

const patients = resourceType('Patient')!;

describe('SearchForm.svelte', () => {
	it('shows the type’s fields with the current filters', async () => {
		render(SearchForm, {
			fields: patients.search,
			values: { family: 'Sm', gender: 'female' },
			sort: '-birthdate',
			fixed: { patient: 'p1' }
		});
		await expect.element(page.getByLabelText('Family name')).toHaveValue('Sm');
		await expect.element(page.getByLabelText('Gender')).toHaveValue('female');
		await expect.element(page.getByLabelText('Born from')).toHaveAttribute('type', 'date');
		// The sort and fixed parameters go along as hidden fields.
		const form = page.getByTestId('search-form').element() as HTMLFormElement;
		expect(new FormData(form).get('sort')).toBe('-birthdate');
		expect(new FormData(form).get('patient')).toBe('p1');
		// Clear drops the filters but keeps the fixed ones.
		const clear = page.getByRole('link', { name: 'Clear' });
		await expect.element(clear).toBeVisible();
		expect(clear.element().getAttribute('href')).toBe('?patient=p1');
	});

	it('offers no Clear without filters', async () => {
		render(SearchForm, { fields: patients.search, values: {}, sort: null });
		await expect.element(page.getByRole('button', { name: 'Search' })).toBeVisible();
		expect(page.getByRole('link', { name: 'Clear' }).all()).toHaveLength(0);
	});
});
