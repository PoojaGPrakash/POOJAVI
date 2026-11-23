#!/usr/bin/env bash
# Runs every migration against a throw-away local PostgreSQL instance with a
# minimal Supabase emulation layer, then runs the RLS test-suite.
#
# Requirements: PostgreSQL 15+ binaries (initdb, pg_ctl, psql) on PATH or in
# /usr/lib/postgresql/<ver>/bin. Usage: npm run test:db
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
export PATH="$PGBIN:$PATH"
PORT="${PGPORT_TEST:-54329}"
DATA="$(mktemp -d /tmp/poojavi-pg-XXXX)"
RUN_AS=()
if [ "$(id -u)" = "0" ]; then
  chown postgres "$DATA"
  RUN_AS=(sudo -u postgres env "PATH=$PATH")
fi

cleanup() { "${RUN_AS[@]}" pg_ctl -D "$DATA" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT

"${RUN_AS[@]}" initdb -D "$DATA" -U postgres --auth=trust >/dev/null
"${RUN_AS[@]}" pg_ctl -D "$DATA" -o "-p $PORT -k /tmp -c listen_addresses=''" -w start >/dev/null

PSQL=(psql -h /tmp -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)

echo "▸ Supabase emulation layer"
"${PSQL[@]}" -f "$ROOT/supabase/tests/00_supabase_stub.sql"

for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "▸ Migration $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done

echo "▸ RLS test-suite"
"${PSQL[@]}" -o /dev/null -f "$ROOT/supabase/tests/10_rls.test.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: NOTICE:  /  /'
