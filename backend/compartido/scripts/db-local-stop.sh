#!/usr/bin/env bash
set -euo pipefail

PG_BIN="/usr/lib/postgresql/18/bin"
PGDATA="/tmp/talentoco-pgdata"

if [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "No local PostgreSQL cluster found"
  exit 0
fi

"$PG_BIN/pg_ctl" -D "$PGDATA" stop -m fast
echo "PostgreSQL local stopped"
