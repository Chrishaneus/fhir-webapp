import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	FHIR_API_URL: {
		description: 'Where the FHIR REST API is, e.g. http://localhost:8000.',
		schema: (value) => (value || 'http://localhost:8000').replace(/\/+$/, '')
	}
});
