#!/bin/sh
set -e

psql_container_id=$(docker ps -qf name=^/integration.postgres)
api_container_id=$(docker ps -qf name=^/integration.td-api)

# Wait for psql to be ready
until PGPASSWORD="no_pass" docker exec -t $psql_container_id bash -c "psql -U \"test\" -c '\q' 2>/dev/null"; do
  >&2 echo "⏳ Postgres is unavailable - sleeping"
  sleep 1
done

echo "1/4 - Create prisma DB";
docker exec -t $psql_container_id bash -c "psql -U test -c \"DROP DATABASE IF EXISTS prisma;\"";
docker exec -t $psql_container_id bash -c "psql -U test -c \"CREATE DATABASE prisma;\"";

echo "2/4 - Restore DB model";
docker exec -t $api_container_id bash -c "npx prisma db push"

echo "3/4 - Create truncating function";
docker cp ./db-deploy/truncate.sql $psql_container_id:/tmp
docker exec -t $psql_container_id bash -c "psql -U test prisma -f /tmp/truncate.sql;"

echo "4/4 - Create Elastic Search index and alias";
until docker exec -t $api_container_id bash -c "curl -XGET http://elasticsearch:9200 2> /dev/null"; do
  >&2 echo "⏳ Elastic Search is unavailable - sleeping"
  sleep 1
done
docker exec -t $api_container_id bash -c "npx ts-node src/scripts/bin/indexElasticSearch.ts -f"