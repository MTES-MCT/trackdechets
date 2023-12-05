#!/bin/bash
set -e

bold=$(tput bold)
reset=$(tput sgr0)
green=$(tput setaf 2)
red=$(tput setaf 9)

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

USING_ENV_FILE=true

if [ -z "$DATABASE_URL" ]
then
  echo "${bold}! No ${green}\$DATABASE_URL${reset}${bold} env variable found.${reset}"

  read -rp $"${bold}? Do you want to source an env file ${reset} (Y/n) " -e sourceEnv
  sourceEnv=${sourceEnv:-Y}

  if [ "$sourceEnv" == "Y" ]; then
    USING_ENV_FILE=true
    suggestedEnv="$(dirname "$SCRIPT_DIR")/.env.integration"

    while read -rp $"${bold}? Enter local env path [${reset} $suggestedEnv ${bold}] :${reset} " pathToEnv; do
      pathToEnv=${pathToEnv:-$suggestedEnv}
      if [ -f "$pathToEnv" ]; then
          echo "${bold}! Sourcing ${green}$pathToEnv${reset}${bold}...${reset}"
          set -o allexport
          source "$pathToEnv" set
          set +o allexport
          break
      else
          echo -"${red}$pathToEnv is not a valid path.${reset}"
      fi
    done
  else
    echo "${bold}! You need to set the ${green}\$DATABASE_URL${reset}${bold} env variable.${reset}"
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
npm --prefix back run preintegration-tests
