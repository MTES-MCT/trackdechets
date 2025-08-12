#!/bin/bash
set -e

bold=$(tput bold)
reset=$(tput sgr0)
green=$(tput setaf 2)
red=$(tput setaf 9)

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

if [ -z "$DATABASE_URL" ]
then
  echo "${bold}! No ${green}\$DATABASE_URL${reset}${bold} env variable found.${reset}"
  integrationEnvPath="$(dirname "$SCRIPT_DIR")/.env.integration"

  if [ -f "$integrationEnvPath" ]; then
    echo "${bold}! Sourcing ${green}$integrationEnvPath${reset}${bold}...${reset}"
    set -o allexport
    source "$integrationEnvPath" set
    set +o allexport
  else
    echo -"${red}$integrationEnvPath is not a valid path.${reset}"
    exit 1
  fi
fi

echo "--------------"
echo "${bold}Using \$DATABASE_URL : ${green}$DATABASE_URL${reset}"
echo "${bold}Using \$ELASTIC_SEARCH_URL : ${green}$ELASTIC_SEARCH_URL${reset}"
echo "${bold}Using \$ELASTICSEARCH_BSDS_ALIAS_NAME : ${green}$ELASTICSEARCH_BSDS_ALIAS_NAME${reset}"
echo "--------------"

# Use regex to extract the database name
regex="postgresql:\/\/[a-zA-Z0-9_]+:[a-zA-Z0-9_]+@([a-zA-Z0-9.-]+):[0-9]+\/([a-zA-Z0-9_]+)\?.*"

if echo "$DATABASE_URL" | grep -E "$regex" > /dev/null; then
    # Extracted database name
    database=$(echo "$DATABASE_URL" | sed -nE "s/$regex/\2/p")
    echo "Database name: $database"
else
    echo "Error: Unable to extract the database name from the DATABASE_URL env."
    echo "may be you need to run this : export DATABASE_URL='postgresql://trackdechets:password@postgres:5432/prisma_test?schema=default$default'"
    echo "don't forget the simple quote to be sure that 'default$default' schema name is right"
    exit 1
fi

psql_container_id=$(docker ps -qf name=^/trackdechets.postgres)

# Wait for psql to be ready
until PGPASSWORD="password" docker exec -t "$psql_container_id" bash -c "psql -U \"trackdechets\" -d postgres -c '\q' 2>/dev/null"; do
  >&2 echo "⏳ Postgres is unavailable - sleeping"
  sleep 1
done

echo "1/3 - Drop and Create prisma DB";
docker exec -t "$psql_container_id" bash -c "psql -U trackdechets -d postgres -c \"DROP DATABASE IF EXISTS $database;\"";
docker exec -t "$psql_container_id" bash -c "psql -U trackdechets -d postgres -c \"CREATE DATABASE $database;\"";

echo "2/3 - Wait for Elastic Search";
until curl -XGET "$ELASTIC_SEARCH_URL" 2> /dev/null; do
  >&2 echo "⏳ Elastic Search is unavailable - sleeping"
  sleep 1
done

echo "3/3 - Create tables & index";

npx prisma db push --config ../prisma.config.ts
npx nx run back:reindex-all-bsds-bulk --configuration=integration 
