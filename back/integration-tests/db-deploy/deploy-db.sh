#!/bin/sh
set -e

# Wait for psql to be ready

until PGPASSWORD="no_pass" psql -U "test" -c '\q'; do
  >&2 echo "⏳ Postgres is unavailable - sleeping"
  sleep 1
done

echo "1/3 - Create prisma DB";
psql -U test -c "DROP DATABASE IF EXISTS prisma;";
psql -U test -c "CREATE DATABASE prisma;";

echo "2/3 - Restore DB model dump";
pg_restore -U test --dbname prisma --no-owner /tmp/db_model.dump;

echo "3/3 - Create truncating function";
psql -U test prisma -f /tmp/truncate.sql;
