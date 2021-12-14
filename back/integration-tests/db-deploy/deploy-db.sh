#!/bin/sh
set -e

psql_container_id=$(docker ps -qf name=^/integration.postgres)
api_container_id=$(docker ps -qf name=^/integration.td-api)

# Wait for psql to be ready
until PGPASSWORD="no_pass" docker exec -t $psql_container_id bash -c "psql -U \"test\" -c '\q' 2>/dev/null"; do
  >&2 echo "⏳ Postgres is unavailable - sleeping"
  sleep 1
done

echo "Wait for Elastic Search";
until docker exec -t $api_container_id bash -c "curl -XGET http://elasticsearch:9200 2> /dev/null"; do
  >&2 echo "⏳ Elastic Search is unavailable - sleeping"
  sleep 1
done
