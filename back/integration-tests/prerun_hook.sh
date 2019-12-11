#!/bin/sh
set -e

until PGPASSWORD="no_pass" psql -h postgres -U "test" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
