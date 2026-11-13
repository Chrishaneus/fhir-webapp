import { execFileSync } from 'node:child_process';
import path from 'node:path';

/** Stop the API and delete its data, unless the tests used one you started. */
export default function globalTeardown() {
	if (process.env.E2E_REUSE_API) return;
	execFileSync(path.join(import.meta.dirname, 'api.sh'), ['down'], { stdio: 'inherit' });
}
