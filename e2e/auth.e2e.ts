import { expect, test } from '@playwright/test';
import { PASSWORD, users } from './fixtures';
import { hydrated, open, signIn } from './helpers';

test('the landing page leads to signing in', async ({ page }) => {
	await open(page, '/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(
		'Clinical records, readable at a glance'
	);
	await page.getByRole('main').getByRole('link', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/login$/);
});

test('a page needs signing in, and opens after it', async ({ page }) => {
	await page.goto('/resources/Patient?gender=female');
	await expect(page).toHaveURL(/\/login\?redirectTo=%2Fresources%2FPatient%3Fgender%3Dfemale$/);
	await hydrated(page);
	await page.getByLabel('Username').fill(users.viewer);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/resources\/Patient\?gender=female$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Patients');
});

test('a wrong password is refused with a reason', async ({ page }) => {
	await open(page, '/login');
	await page.getByLabel('Username').fill(users.viewer);
	await page.getByLabel('Password').fill('not-the-password');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('alert')).toHaveText('Wrong username or password.');
});

test('signing up makes a viewer, who can sign in and out', async ({ page }) => {
	const username = `e2e-new-${Date.now()}`;
	await open(page, '/register');
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password', { exact: true }).fill('short');
	await page.getByLabel('Confirm password').fill('short');
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByText('Use at least 8 characters.')).toBeVisible();

	await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
	await page.getByLabel('Confirm password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByText('Account created')).toBeVisible();

	await hydrated(page);
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByTestId('user-role')).toHaveText('Viewer');

	await page.getByTestId('user-menu').click();
	await page.getByRole('menuitem', { name: 'Sign out' }).click();
	await expect(page).toHaveURL(/\/$/);
	await page.goto('/dashboard');
	await expect(page).toHaveURL(/\/login/);
});

test('each role signs in as itself', async ({ page }) => {
	for (const [role, label] of [
		['viewer', 'Viewer'],
		['clinician', 'Clinician'],
		['admin', 'Admin']
	] as const) {
		await page.context().clearCookies();
		await signIn(page, role);
		await expect(page.getByTestId('user-role')).toHaveText(label);
	}
});
