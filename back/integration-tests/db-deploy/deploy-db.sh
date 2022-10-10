#!/bin/sh
set -e

psql_container_id=$(docker ps -qf name=^/integration.postgres)
api_container_id=$(docker ps -qf name=^/integration.td-api)

# Wait for psql to be ready
until PGPASSWORD="no_pass" docker exec -t $psql_container_id bash -c "psql -U \"test\" -c '\q' 2>/dev/null"; do
  >&2 echo "⏳ Postgres is unavailable - sleeping"
  sleep 1
done

echo "1/3 - Drop and Create prisma DB";
docker exec -t $psql_container_id bash -c "psql -U test -c \"DROP DATABASE IF EXISTS prisma;\"";
docker exec -t $psql_container_id bash -c "psql -U test -c \"CREATE DATABASE prisma;\"";

echo "2/3 - Wait for Elastic Search";
until docker exec -t $api_container_id bash -c "curl -XGET http://elasticsearch:9200 2> /dev/null"; do
  >&2 echo "⏳ Elastic Search is unavailable - sleeping"
  sleep 1
done

echo "3/3 - Init for Elastic Search";
curl -XPUT http://elasticsearch:9200/bsds_test_index
curl -XPUT http://elasticsearch:9200/bsds_test_index/_alias/bsds
