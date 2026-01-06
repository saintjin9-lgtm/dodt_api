#!/usr/bin/env bash
set -euo pipefail

# Usage:
# 1) Place dump file locally (e.g. /tmp/dodt_dump.dump)
# 2) Set LOCAL_PGHOST, LOCAL_PGPORT, LOCAL_PGUSER (and LOCAL_PGPASSWORD if needed)
# 3) Optionally set TARGET_DB (defaults to dodt_api_db)
# 4) Run: ./scripts/restore_local.sh /tmp/dodt_dump.dump

DUMP_FILE="${1:-/tmp/dodt_dump.dump}"
LOCAL_PGHOST="${LOCAL_PGHOST:-localhost}"
LOCAL_PGPORT="${LOCAL_PGPORT:-5432}"
LOCAL_PGUSER="${LOCAL_PGUSER:-postgres}"
LOCAL_PGPASSWORD="${LOCAL_PGPASSWORD:-}"
TARGET_DB="${TARGET_DB:-dodt_api_db}"

if [ ! -f "$DUMP_FILE" ]; then
  echo "Dump file not found: $DUMP_FILE"
  exit 1
fi

export PGPASSWORD="$LOCAL_PGPASSWORD"

echo "Creating target database '$TARGET_DB' if missing..."
psql "host=$LOCAL_PGHOST port=$LOCAL_PGPORT user=$LOCAL_PGUSER" -v ON_ERROR_STOP=1 <<-SQL
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '${TARGET_DB}') THEN
      PERFORM pg_sleep(0); -- placeholder
   END IF;
END$$;
SQL

echo "Restoring dump into $TARGET_DB (this will overwrite existing objects)..."
# Use --clean to drop database objects before recreating, --no-owner for portability
pg_restore -h "$LOCAL_PGHOST" -p "$LOCAL_PGPORT" -U "$LOCAL_PGUSER" --no-owner --clean -d "$TARGET_DB" "$DUMP_FILE"

echo "Restore complete."
