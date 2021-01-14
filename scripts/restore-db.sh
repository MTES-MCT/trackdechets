#!/bin/bash

# Script to restore a DB backup locally
# -------------------------------------

psql_container_id=$(docker ps -qf "name=postgres")
api_container_id=$(docker ps -qf "name=td-api")

while read -erp $'\e[1m? Enter backup path location:\e[m ' backupPath; do
    if [ -f "$backupPath" ]; then
        break
    else
        echo -e "\e[91m$backupPath is not a valid path.\e[m"
    fi 
done

echo -e "\e[1m→ Using backup file \e[36m$backupPath\e[m"

read -rp $'\e[1m? Postgres User:\e[m ' -i "trackdechets" -e psqlUser

echo "Copying backup file to postgres"
docker cp "$backupPath" "$psql_container_id":/tmp/dump.sql

echo -e "\e[1m→ Stopping \e[36mtd-api\e[m"
docker stop "$api_container_id"

echo -e "\e[1m→ Recreating DB \e[36mprisma\e[m"
docker exec -t "$psql_container_id" bash -c "psql -U $psqlUser -c \"DROP DATABASE IF EXISTS prisma;\"";
docker exec -t "$psql_container_id" bash -c "psql -U $psqlUser -c \"CREATE DATABASE prisma;\"";

echo -e "\e[1m→ Restoring dump"
docker exec -t "$psql_container_id" bash -c "pg_restore -U $psqlUser -d prisma --clean /tmp/dump.sql 2>/dev/null";

echo -e "\e[1m→ Restarting \e[36mtd-api\e[m"
docker start "$api_container_id"

echo -e "\e[1m→ Running SQL migrations on \e[36mtd-api\e[m"
docker exec -it "$api_container_id" bash -c "npm run migrate:dev"
