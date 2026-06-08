#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/db/migrations"

psql -d talentoco <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

if psql -d talentoco -tAc "SELECT to_regclass('public.\"User\"') IS NOT NULL" | grep -q t; then
  psql -d talentoco <<'SQL'
INSERT INTO schema_migrations (filename)
VALUES ('0001_init.sql')
ON CONFLICT (filename) DO NOTHING;
SQL
fi

for migration in "$MIGRATIONS_DIR"/*.sql; do
  filename="$(basename "$migration")"

  if psql -d talentoco -tAc "SELECT 1 FROM schema_migrations WHERE filename = '$filename' LIMIT 1" | grep -q 1; then
    continue
  fi

  psql -v ON_ERROR_STOP=1 -d talentoco -f "$migration"
  psql -d talentoco -c "INSERT INTO schema_migrations (filename) VALUES ('$filename')"
done
