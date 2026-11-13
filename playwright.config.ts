import { defineConfig, devices } from '@playwright/test';
import { API_URL, APP_URL } from './e2e/fixtures';

/**
 * End-to-end tests: the built app (`node build`) against the real FHIR API, which global setup
 * starts from the API repository's docker-compose.yml on a fresh database (see e2e/api.sh).
 */
export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	globalSetup: './e2e/global-setup.ts',
	globalTeardown: './e2e/global-teardown.ts',
	// The tests share one API and change its data; one at a time keeps them independent.
	workers: 1,
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: APP_URL,
		trace: 'retain-on-failure'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'npm run build && node build',
		url: APP_URL,
		env: { PORT: '4173', ORIGIN: APP_URL, FHIR_API_URL: API_URL },
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
});
