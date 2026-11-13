# FHIR web app

A web frontend for [fhir-rest-api](https://github.com/Chrishaneus/fhir-rest-api): sign in, browse
and search FHIR R5 resources, see a dashboard of the clinical data, and (depending on your role)
create, edit and delete records. Built with SvelteKit and shadcn-svelte.

It only ever holds synthetic data from the API's seeder: the API isn't meant for real patient
data.

## What it does

- **Sign in, sign up, sign out.** Signing up makes a viewer; an admin adds users with other roles
  under **Admin → Users**.
- **Dashboard:** counts of the main resource types, patients by gender, the latest encounters and
  the latest changes across the server.
- **Records:** a page for each of the ten types the API indexes (patients, practitioners,
  organizations, encounters, observations, conditions, allergies, medication requests,
  diagnostic reports, procedures), with search fields, sorting and paging. A resource's page has
  a summary, its FHIR JSON and its version history; a patient's page also has their records.
- **Changes by role:** clinicians and admins create and edit resources as FHIR JSON, checked by
  the API's `$validate` and saved with `If-Match`, so a newer save by someone else isn't
  overwritten. Admins delete.

| Role      | Reads | Creates and edits | Deletes | Adds users |
| --------- | ----- | ----------------- | ------- | ---------- |
| Viewer    | ✓     |                   |         |            |
| Clinician | ✓     | ✓                 |         |            |
| Admin     | ✓     | ✓                 | ✓       | ✓          |

## How it works

- The app runs as a Node server (adapter-node) and talks to the API from the server. The API's
  token lives in an httpOnly cookie, so page scripts never see it.
- Every request goes through `src/hooks.server.ts`: who's signed in (from the token), then
  whether they may open the page (`src/lib/auth/access.ts`). Pages need a signed-in user unless
  listed as public, so a new page is never public by accident. Form actions that change records
  check the role again.
- The app reads the role from the token without checking its signature (it doesn't know the
  API's secret); the API checks it on every call. So the role only decides what the app shows;
  the API decides what anyone can do.
- The resource types are described as data in `src/lib/fhir/resources.ts` (columns, search
  fields, sorting); the list and resource pages are generic over it.

## Running it

You need Node 22.12 or later, Docker, and the API repository next to this one
(`../fhir-rest-api`, or set `FHIR_API_DIR`).

The quickest API is the one the end-to-end tests use. `e2e/api.sh up` starts its database,
Redis and the API from the API's own `docker-compose.yml`, on `http://localhost:58000` with an
empty database; `e2e/api.sh down` stops it and deletes the data. (The API's full compose stack
only answers through nginx on HTTPS with a self-signed certificate, which the app's server
won't trust.)

```sh
e2e/api.sh up
# The first user of an empty server may pick a role: make them an admin.
curl -X POST http://localhost:58000/auth/register -H 'content-type: application/json' \
  -d '{"username": "admin", "password": "choose-a-password", "role": "admin"}'

npm install
echo 'FHIR_API_URL=http://localhost:58000' > .env
npm run dev
```

Sign in as that admin, then add other users under **Admin → Users**, and records under
**Records**. For a lot of synthetic data, run the API's seeder (`python -m scripts.seed`, see
its README) against a database it can reach.

### In Docker

The image builds the app and runs it with `node build` (`FHIR_API_URL`, `ORIGIN` and `PORT` set
it up). To run it with the API, put this repository and `fhir-rest-api` side by side with a
`docker-compose.yml` that builds both, like the one in the folder that holds them:
`docker compose up -d --build` starts Postgres, Redis, the API on `localhost:8000` and the app on
`localhost:3000`.

The session cookie is `Secure` in production builds. Browsers accept that over plain HTTP on
`localhost` only, so anywhere else, serve the app over HTTPS.

## Checks and tests

```sh
npm run check        # svelte-check (TypeScript)
npm run lint         # Prettier and ESLint
npm run test:unit    # Vitest: logic in Node, components in headless Chromium
npm run test:e2e     # Playwright against the real API
npm test             # unit, then end-to-end
```

- **Unit tests** cover the access rules, the FHIR display helpers, the server helpers (sessions,
  API calls, search queries, the JSON editor) and the main components.
- **End-to-end tests** start the API from its own `docker-compose.yml`
  (`FHIR_API_DIR`, default `../fhir-rest-api`) with `e2e/api.compose.yaml` on top: their own
  project and network, a fresh database each run, and the API on `localhost:58000`. Global setup
  creates one user per role (the first user registers as admin, which adds the others) and
  known patients and observations with fixed ids, then the tests sign in through the app. Docker
  is needed. To reuse a stack you started with `e2e/api.sh up`, set `E2E_REUSE_API=1`.

| Variable            | Meaning                                                       |
| ------------------- | ------------------------------------------------------------- |
| `FHIR_API_URL`      | Where the API is (default `http://localhost:8000`)            |
| `FHIR_API_DIR`      | The API repository, for end-to-end tests (`../fhir-rest-api`) |
| `FHIR_E2E_API_PORT` | The API's port in end-to-end tests (default `58000`)          |
| `E2E_REUSE_API`     | Use an API already started with `e2e/api.sh up`               |
