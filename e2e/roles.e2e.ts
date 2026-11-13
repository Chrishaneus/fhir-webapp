import { expect, test, type Page } from '@playwright/test';
import { signIn } from './helpers';

const patientPage = '/resources/Patient/e2e-ada';

/** What a role can see and open, from the navigation to each kind of page. */
async function expectAccess(
	page: Page,
	can: { manageUsers: boolean; create: boolean; update: boolean; delete: boolean }
) {
	const nav = page.locator('[data-sidebar="sidebar"]');
	await expect(nav.getByRole('link', { name: 'Users' })).toHaveCount(can.manageUsers ? 1 : 0);
	expect((await page.goto('/admin/users'))!.status()).toBe(can.manageUsers ? 200 : 403);

	await page.goto('/resources/Patient');
	await expect(page.getByRole('link', { name: 'New patient' })).toHaveCount(can.create ? 1 : 0);
	expect((await page.goto('/resources/Patient/new'))!.status()).toBe(can.create ? 200 : 403);

	await page.goto(patientPage);
	await expect(page.getByRole('link', { name: 'Edit' })).toHaveCount(can.update ? 1 : 0);
	await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(can.delete ? 1 : 0);
	expect((await page.goto(`${patientPage}/edit`))!.status()).toBe(can.update ? 200 : 403);
}

test('viewers read, and see nothing that changes records', async ({ page }) => {
	await signIn(page, 'viewer');
	await expectAccess(page, { manageUsers: false, create: false, update: false, delete: false });
	await page.goto('/admin/users');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Not for your role');
});

test('clinicians also create and edit, but don’t delete or manage users', async ({ page }) => {
	await signIn(page, 'clinician');
	await expectAccess(page, { manageUsers: false, create: true, update: true, delete: false });
});

test('admins can do everything', async ({ page }) => {
	await signIn(page, 'admin');
	await expectAccess(page, { manageUsers: true, create: true, update: true, delete: true });
});

test('a role can’t get around the pages by posting to their actions', async ({ page }) => {
	await signIn(page, 'viewer');
	const post = (path: string, form: Record<string, string>) =>
		page.request.post(path, {
			headers: { origin: 'http://localhost:4173', 'x-sveltekit-action': 'true' },
			form
		});
	expect(
		(
			await post('/admin/users', { username: 'sneaky', password: 'x'.repeat(10), role: 'admin' })
		).status()
	).toBe(403);
	expect((await post(`${patientPage}/edit?/save`, { json: '{}' })).status()).toBe(403);
	expect((await post(`${patientPage}?/delete`, {})).status()).toBe(403);
});
