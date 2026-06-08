# Talento Co Hardening Plan

## Goals
- Move runtime persistence from SQLite/local disk to PostgreSQL + S3-compatible object storage.
- Replace demo billing/email flows with Stripe + Resend integrations.
- Remove monolithic `getAppState()` reads from request paths.
- Hide security UI that is not implemented.
- Reduce repo/runtime weight below 1.1 GB.

## Sequence
1. Replace infra bindings and config surface.
2. Normalize high-value data models: experiences, structured skills, preferences, billing history.
3. Introduce query-specific server modules and stop loading whole app state in hot paths.
4. Migrate uploads to object storage abstraction with local fallback only for development.
5. Integrate Stripe checkout + webhook reconciliation.
6. Integrate Resend email provider.
7. Remove fake security UI and demo login naming.
8. Prune dependencies and build artifacts, then verify build/tests.

## Constraints
- Keep existing routes working where feasible.
- Preserve development fallback behavior when external env vars are absent.
- Avoid adding more dependencies than needed.
