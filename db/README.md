DB initialization for dodt_api

1) Start a Postgres instance (quick via Docker Compose):

   docker run --name dodt-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

2) Run the init script (from repo root):

   # optional: set PGADMIN_USER if your local superuser is different
   PGHOST=localhost PGPORT=5432 PGADMIN_USER=postgres ./scripts/init_db.sh

3) After first run, change the generated password for the role `dodt_api_user`.

Note: The script creates the role `dodt_api_user` with password `change_me` if missing and creates database `dodt_api_db`.
Adjust env vars or the script for production use. Do NOT use these defaults in production.
