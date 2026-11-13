import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Pager from './Pager.svelte';

describe('Pager.svelte', () => {
	it('says which rows are shown, and links to the pages around', async () => {
		render(Pager, { page: 2, pageSize: 20, total: 45 });
		await expect.element(page.getByTestId('page-range')).toHaveTextContent('21–40 of 45');
		await expect.element(page.getByText('Page 2 of 3')).toBeVisible();
		const previous = page.getByRole('link', { name: 'Previous page' });
		const next = page.getByRole('link', { name: 'Next page' });
		await expect.element(next).toBeVisible();
		// Page 1 has no page number; the rest of the address is kept.
		expect(previous.element().getAttribute('href')).toBe('?');
		expect(next.element().getAttribute('href')).toBe('?page=3');
	});

	it('can’t go past the first or last page', async () => {
		render(Pager, { page: 1, pageSize: 20, total: 5 });
		await expect.element(page.getByTestId('page-range')).toHaveTextContent('1–5 of 5');
		await expect.element(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
	});
});
