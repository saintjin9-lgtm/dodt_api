#!/usr/bin/env bash
set -euo pipefail

# Initialize Postgres database and apply schema.
# Environment variables used:
#   PGHOST (default: localhost)
#   PGPORT (default: 5432)
#   PGUSER (default: postgres)
#   PGPASSWORD (optional)
#   PGADMIN_USER - the superuser used to create DB (defaults to $PGUSER)
#   DODT_DB - name of database to create (default: dodt_api_db)
#   DODT_DB_OWNER - role that will own the database (default: dodt_api_user)

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGADMIN_USER="${PGADMIN_USER:-$PGUSER}"
DODT_DB="${DODT_DB:-dodt_api_db}"
DODT_DB_OWNER="${DODT_DB_OWNER:-dodt_api_user}"

SCHEMA_FILE="$(dirname "$0")/../db/init_schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Schema file not found: $SCHEMA_FILE"
  exit 1
fi

echo "Connecting to Postgres at $PGHOST:$PGPORT as $PGADMIN_USER"

# Create role and database if not exists, then apply schema
psql "host=$PGHOST port=$PGPORT user=$PGADMIN_USER" -v ON_ERROR_STOP=1 <<-SQL
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DODT_DB_OWNER}') THEN
      CREATE ROLE ${DODT_DB_OWNER} LOGIN PASSWORD 'change_me';
   END IF;
EXCEPTION WHEN others THEN
   RAISE NOTICE 'Role creation skipped or failed';
END$$;

-- Create database only if it does not exist
PERFORM 1 FROM pg_database WHERE datname = '${DODT_DB}';
IF NOT FOUND THEN
   CREATE DATABASE ${DODT_DB} OWNER ${DODT_DB_OWNER};
END IF;
\connect ${DODT_DB}
\i '${SCHEMA_FILE}';
SQL

echo "Database ${DODT_DB} initialized. IMPORTANT: change the password for role ${DODT_DB_OWNER}."

echo "To run: PGHOST=localhost PGPORT=5432 PGADMIN_USER=postgres ./scripts/init_db.sh"
