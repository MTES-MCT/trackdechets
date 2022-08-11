#!/bin/bash

# Helper to restore a DB backup locally
# -------------------------------------

psql_container_id=$(docker ps -qf name=^/trackdechets.postgres)
api_container_id=$(docker ps -qf name=^/trackdechets.td-api)
psqlUser=trackdechets
 
 

 
echo -e "\e[1m→ Stopping \e[36mtd-api\e[m"
docker stop "$api_container_id"

echo -e "\e[1m→ Recreating DB \e[36mprisma\e[m"
docker exec -t "$psql_container_id" bash -c "psql -U $psqlUser -c \"DROP DATABASE IF EXISTS prisma;\"";
docker exec -t "$psql_container_id" bash -c "psql -U $psqlUser -c \"CREATE DATABASE prisma;\"";
docker exec -t "$psql_container_id" bash -c "psql -U $psqlUser -d prisma -c 'CREATE SCHEMA default\$default;'";

 
echo -e "\e[1m→ Restarting \e[36mtd-api\e[m"
docker start "$api_container_id"
 
