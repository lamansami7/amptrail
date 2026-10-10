#!/usr/bin/env bash
# Applies the AmpTrail migrations and provisioning tests to a THROWAWAY local PostgreSQL database.
# Usage: PG_SUPERUSER_URL=postgresql://postgres@localhost/postgres tests/db/run-db-tests.sh
# Never point this at a Supabase or production database.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SUPER_URL="${PG_SUPERUSER_URL:?Set PG_SUPERUSER_URL to a LOCAL superuser connection string}"
DB_NAME="${AMPTRAIL_TEST_DB:-amptrail_provisioning_test}"
ADMIN_ROLE="amptrail_sim_admin"
ADMIN_PASSWORD="$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)"

PSQL_SUPER=(psql "$SUPER_URL" -X -v ON_ERROR_STOP=1 -q)
"${PSQL_SUPER[@]}" -c "drop database if exists ${DB_NAME} with (force);" >/dev/null
"${PSQL_SUPER[@]}" -c "do \$\$ begin if not exists (select 1 from pg_roles where rolname = '${ADMIN_ROLE}') then create role ${ADMIN_ROLE} login bypassrls createdb createrole password '${ADMIN_PASSWORD}'; else alter role ${ADMIN_ROLE} with login bypassrls createdb createrole password '${ADMIN_PASSWORD}'; end if; end \$\$;" >/dev/null
"${PSQL_SUPER[@]}" -c "create database ${DB_NAME} owner ${ADMIN_ROLE};" >/dev/null

BASE_URL="$(echo "$SUPER_URL" | sed -E 's#^(postgres(ql)?://)[^/]*@#\1#; s#^(postgres(ql)?://)#\1#')"
HOST_PART="$(echo "$SUPER_URL" | sed -E 's#^postgres(ql)?://[^@]*@##; s#/.*$##')"
ADMIN_URL="postgresql://${ADMIN_ROLE}:${ADMIN_PASSWORD}@${HOST_PART}/${DB_NAME}"

run() { psql "$ADMIN_URL" -X -v ON_ERROR_STOP=1 -q "$@"; }

run -f "$ROOT/tests/db/supabase-stub.sql"
LAST_MIGRATION="${AMPTRAIL_LAST_MIGRATION:-}"
for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "Applying $(basename "$migration")"
  run -f "$migration"
  if [ -n "$LAST_MIGRATION" ] && [ "$(basename "$migration")" = "$LAST_MIGRATION" ]; then break; fi
done

# Idempotency: every migration after the initial schema must be safe to run a second time.
if [ -z "$LAST_MIGRATION" ]; then
  for migration in "$ROOT"/supabase/migrations/*.sql; do
    case "$(basename "$migration")" in
      202610100001_initial_schema.sql) ;;
      *) echo "Re-applying $(basename "$migration") (idempotency check)"; run -f "$migration" ;;
    esac
  done
fi

run -f "$ROOT/tests/db/provisioning.test.sql"
echo "DB provisioning tests passed on ${DB_NAME}"
