#!/usr/bin/env bash
# End-to-end test run:
#   1. throw-away PostgreSQL + our real migrations
#   2. test-only Supabase API gateway (tests/e2e/shim) enforcing RLS in Postgres
#   3. production build of the app pointed at it
#   4. Playwright tests (desktop + mobile)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
export PATH="$PGBIN:$PATH"
PGPORT_E2E="${PGPORT_E2E:-54330}"
DATA="$(mktemp -d /tmp/poojavi-e2e-pg-XXXX)"
export SHIM_STORAGE_DIR="$(mktemp -d /tmp/poojavi-e2e-storage-XXXX)"
export SHIM_DATABASE_URL="postgres://postgres@127.0.0.1:${PGPORT_E2E}/postgres"
export SHIM_PORT="${SHIM_PORT:-54321}"
RUN_AS=()
if [ "$(id -u)" = "0" ]; then chown postgres "$DATA"; RUN_AS=(sudo -u postgres env "PATH=$PATH"); fi

PIDS=()
cleanup() {
  # Processes are started in their own session (setsid) so the whole group is stopped.
  for p in "${PIDS[@]:-}"; do [ -n "$p" ] && kill -- -"$p" 2>/dev/null || true; done
  "${RUN_AS[@]}" pg_ctl -D "$DATA" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$DATA" "$SHIM_STORAGE_DIR"
}
trap cleanup EXIT

if curl -s -o /dev/null http://localhost:3100 || curl -s -o /dev/null "http://127.0.0.1:${SHIM_PORT}/health"; then
  echo "Ports 3100/${SHIM_PORT} are already in use — stop the other process first." >&2
  exit 1
fi

"${RUN_AS[@]}" initdb -D "$DATA" -U postgres --auth=trust >/dev/null
"${RUN_AS[@]}" pg_ctl -D "$DATA" -o "-p $PGPORT_E2E -k /tmp -c listen_addresses=127.0.0.1" -w start >/dev/null
PSQL=(psql -h 127.0.0.1 -p "$PGPORT_E2E" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f supabase/tests/00_supabase_stub.sql
for f in supabase/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done

ANON_KEY="$(node tests/e2e/shim/setup.mjs)"
setsid node tests/e2e/shim/server.mjs > /tmp/poojavi-shim.log 2>&1 &
PIDS+=($!)
for _ in $(seq 1 50); do curl -sf "http://127.0.0.1:${SHIM_PORT}/health" >/dev/null && break; sleep 0.2; done

export NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:${SHIM_PORT}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export NEXT_PUBLIC_SITE_URL="http://localhost:3100"
export NEXT_ALLOW_LOCAL_IMAGES=1   # test-only: let next/image optimise images from 127.0.0.1
export NEXT_DIST_DIR=".next-e2e"

npx next build >/tmp/poojavi-e2e-build.log 2>&1 || { tail -50 /tmp/poojavi-e2e-build.log; exit 1; }
setsid npx next start -p 3100 >/tmp/poojavi-next.log 2>&1 &
PIDS+=($!)
for _ in $(seq 1 100); do curl -sf http://localhost:3100/robots.txt >/dev/null && break; sleep 0.3; done

E2E_BASE_URL="http://localhost:3100" npx playwright test "$@"
