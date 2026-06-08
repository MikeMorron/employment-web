#!/usr/bin/env bash
set -euo pipefail

PG_BIN="/usr/lib/postgresql/18/bin"
PGDATA="/tmp/talentoco-pgdata"
PGSOCK="/tmp/talentoco-pg-run"

if [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "No local PostgreSQL cluster found"
  exit 1
fi

"$PG_BIN/pg_ctl" -D "$PGDATA" status
PGHOST="$PGSOCK" psql -U postgres -d postgres -c '\l'
PGHOST="$PGSOCK" psql -U postgres -d talentoco -c 'show timezone'
