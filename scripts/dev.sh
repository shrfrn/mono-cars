#!/usr/bin/env bash
# Start Docker (infra + main-app backend), then Vite on the host.
# Ctrl+C stops only the frontend; run `docker compose down` to stop containers.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

INFRA_SERVICES=(mongo1 mongo2 mongo3 mongo-init redis-cache redis-queue)

function wait_for_replica_set() {
	echo 'Waiting for MongoDB replica set...'
	local tries=0

	while [ "$tries" -lt 60 ]; do
		if docker compose exec -T mongo1 mongosh --port 27117 --quiet --eval \
			'try { const s = rs.status(); print(s.ok === 1 ? 1 : 0) } catch (e) { print(0) }' \
			2>/dev/null | grep -q '^1$'
		then
			echo 'MongoDB replica set ready'
			return 0
		fi

		tries=$((tries + 1))
		sleep 2
	done

	echo 'MongoDB replica set did not become ready in time' >&2
	return 1
}

function wait_for_main_app() {
	echo 'Waiting for main-app on :3030...'
	local tries=0

	while [ "$tries" -lt 60 ]; do
		if nc -z 127.0.0.1 3030 2>/dev/null; then
			echo 'main-app ready'
			return 0
		fi

		tries=$((tries + 1))
		sleep 2
	done

	echo 'main-app did not become ready in time' >&2
	return 1
}

echo 'Starting Docker infra...'
docker compose up -d "${INFRA_SERVICES[@]}"
wait_for_replica_set

echo 'Starting main-app...'
docker compose up -d main-app
wait_for_main_app

echo 'Starting frontend dev server (backend is in Docker on :3030)...'
exec npm run frontend:dev
