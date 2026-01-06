#!/usr/bin/env bash
set -euo pipefail

# Usage:
# 1) Create a secure environment file or export these variables:
#    REMOTE_PGHOST REMOTE_PGPORT REMOTE_PGUSER REMOTE_PGPASSWORD REMOTE_DB
# 2) Run: ./scripts/remote_dump.sh /tmp/dodt_dump.dump

OUT_FILE="${1:-/tmp/dodt_dump.dump}"

PGHOST="${REMOTE_PGHOST:-}" || true
PGPORT="${REMOTE_PGPORT:-5432}"
PGUSER="${REMOTE_PGUSER:-}"
PGPASSWORD="${REMOTE_PGPASSWORD:-}"
DBNAME="${REMOTE_DB:-}"

if [ -z "$PGHOST" ] || [ -z "$PGUSER" ] || [ -z "$DBNAME" ]; then
  echo "Please set REMOTE_PGHOST, REMOTE_PGUSER and REMOTE_DB (and REMOTE_PGPASSWORD if needed)."
  exit 1
fi

export PGPASSWORD="$PGPASSWORD"

echo "Dumping remote database '$DBNAME' from $PGHOST:$PGPORT to $OUT_FILE"

# Use custom-format compressed dump for portability
pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -Fc -Z9 -f "$OUT_FILE" "$DBNAME"

echo "Dump complete: $OUT_FILE"
echo "You can copy the file locally with scp or other secure transfer and then run scripts/restore_local.sh"
