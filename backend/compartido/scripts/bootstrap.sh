#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[1/6] Installing pnpm dependencies"
cd "$ROOT_DIR"
pnpm install

echo "[2/6] Generating Prisma client"
pnpm exec prisma generate --schema prisma/schema.prisma

echo "[3/6] Starting local PostgreSQL"
pnpm run db:local:start

echo "[4/6] Applying migrations"
pnpm run db:migrate

echo "[5/6] Seeding sandbox users"
pnpm run seed:test-users

echo "[6/6] Running validation"
pnpm run test:matching

cat <<'EOF'

Bootstrap completed.

Next steps:
  pnpm run dev

Sandbox accounts:
  talentoco.usuario@gmail.com / TalentoUser@2026
  talentoco.empresa@gmail.com / TalentoEmpresa@2026
EOF
