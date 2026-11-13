#!/bin/sh
# Start or stop the FHIR API for the end-to-end tests, from the API repository's own
# docker-compose.yml (FHIR_API_DIR, default ../fhir-rest-api) with e2e/api.compose.yaml on top.
# Each start is a fresh, empty database: the tests create the users and data they need.
#
#   e2e/api.sh up      build and start db, redis and the API, and wait until it's healthy
#   e2e/api.sh down    stop it and delete its data
set -eu
here=$(cd "$(dirname "$0")" && pwd)
api_dir=${FHIR_API_DIR:-$here/../../fhir-rest-api}
if [ ! -f "$api_dir/docker-compose.yml" ]; then
	echo "No fhir-rest-api at $api_dir; set FHIR_API_DIR to its folder." >&2
	exit 1
fi
compose() {
	docker compose -p fhir-webapp-e2e -f "$api_dir/docker-compose.yml" -f "$here/api.compose.yaml" "$@"
}
case "${1:-}" in
	up)
		compose down -v --remove-orphans >/dev/null 2>&1 || true
		compose up -d --build --wait --wait-timeout 180 db redis app
		;;
	down)
		compose down -v --remove-orphans
		;;
	*)
		echo "usage: $0 up|down" >&2
		exit 2
		;;
esac
