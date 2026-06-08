#!/usr/bin/env bash
set -euo pipefail

PG_BIN="/usr/lib/postgresql/18/bin"
PGDATA="/tmp/talentoco-pgdata"
PGSOCK="/tmp/talentoco-pg-run"
PGLOG="/tmp/talentoco-pg.log"

mkdir -p "$PGDATA" "$PGSOCK"

if [ ! -f "$PGDATA/PG_VERSION" ]; then
  "$PG_BIN/initdb" -D "$PGDATA" -A trust -U postgres >/dev/null
fi

if [ -f "$PGDATA/postmaster.pid" ] && "$PG_BIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
  echo "PostgreSQL local already running"
  exit 0
fi

rm -f "$PGDATA/postmaster.pid"
"$PG_BIN/pg_ctl" -D "$PGDATA" -l "$PGLOG" -o "-k $PGSOCK -c listen_addresses='' -c timezone=UTC" start
PGHOST="$PGSOCK" createdb -U postgres talentoco >/dev/null 2>&1 || true
echo "PostgreSQL local started with socket $PGSOCK"
