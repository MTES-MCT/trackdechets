#!/bin/sh
set -e

psql_container_id=$(docker ps -qf name=^/integration.postgres)

# Wait for psql to be ready
until PGPASSWORD="no_pass" docker exec -t "$psql_container_id" bash -c "psql -U \"test\" -c '\q' 2>/dev/null"; do
  >&2 echo "⏳ Postgres is unavailable - sleeping"
  sleep 1
done

echo "1/2 - Drop and Create prisma DB";
docker exec -t "$psql_container_id" bash -c "psql -U test -c \"DROP DATABASE IF EXISTS prisma;\"";
docker exec -t "$psql_container_id" bash -c "psql -U test -c \"CREATE DATABASE prisma;\"";

echo "2/2 - Wait for Elastic Search";
until curl -XGET "$ELASTIC_SEARCH_URL" 2> /dev/null; do
  >&2 echo "⏳ Elastic Search is unavailable - sleeping"
  sleep 1
done