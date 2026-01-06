How to copy a remote Postgres database (schema + data) to local

Options explained:

1) Logical dump/restore (recommended, portable)
   - Uses `pg_dump` on remote and `pg_restore` locally.
   - Good for cross-version migration and does not require filesystem-level access.

   Steps:
   - On any machine that can reach the remote DB, run:
     ```bash
     # set REMOTE_PGHOST, REMOTE_PGPORT, REMOTE_PGUSER, REMOTE_PGPASSWORD, REMOTE_DB
     ./scripts/remote_dump.sh /tmp/dodt_dump.dump
     ```
   - Transfer the dump file securely to your local machine (scp/sftp).
     ```bash
     scp user@remote:/tmp/dodt_dump.dump ~/
     ```
   - Restore locally:
     ```bash
     # set LOCAL_PGHOST, LOCAL_PGPORT, LOCAL_PGUSER, LOCAL_PGPASSWORD (if needed)
     ./scripts/restore_local.sh ~/dodt_dump.dump
     ```

2) Physical copy / base backup
   - Uses `pg_basebackup` or filesystem-level snapshot.
   - Requires compatible Postgres versions and more careful handling.
   - Useful for very large DBs or when you need an exact binary image.

3) Replication
   - Configure logical or physical replication from remote to new server.
   - More complex; useful for continuous syncing.

Notes and cautions:
- Credentials and network access: you need a user on the remote DB with sufficient privileges to run `pg_dump` (typically any SELECT privileges). For `pg_dump --clean --create` you may need CREATE DATABASE permission if you plan to create DB automatically.
- Sensitive data: dumps may contain secrets/PII. Store and transfer dump files securely and delete them when done.
- Size & time: large DBs take time to dump/transfer/restore. Consider compression and network bandwidth.
- Downtime: `pg_dump` is online-friendly but may give inconsistent results for very active DBs unless `--serializable-deferrable` or consistent snapshot options are used.

If you want, provide remote DB connection details (host, port, user) or a dump file and I can generate the exact commands for your environment or help run them step-by-step.
