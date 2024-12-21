#!/bin/bash

# Helper to restore a DB backup locally
# -------------------------------------

BASEDIR=$(realpath "$0" | sed 's|\(.*\)/.*|\1|')
psql_container_id=$(docker ps -qf name=^/trackdechets.postgres)

printf "\e[1m! Before running this script, make sure you closed all open connections to the DB (app, queue, notifier, SQL soft...)\e[m\n"

read -erp $'\e[1m? Do you wish to download the latest backup of your chosen database \e[m (Y/n) ' -e downloadBackup
downloadBackup=${downloadBackup:-Y}

if [ "$downloadBackup" != "${downloadBackup#[Yy]}" ]; then
    printf "\e[90m"

    backupName="db_backup.pgsql"
    backupPath="$BASEDIR/$backupName"
    backupTarName="db_backup.tar.gz"
    backupTarPath="$BASEDIR/$backupTarName"

    node ./get-db-backup-link.js | xargs wget -O "$backupTarPath"
    tar xvf "$backupTarPath"
    for name in *pgsql
    do
      mv "$name" $backupName
    done
    rm $backupTarName
    printf "\e[m"
else
    while read -erp $'\e[1m? Enter local backup path (pgsql file):\e[m ' backupPath; do
        if [ -f "$backupPath" ]; then
            break
        else
            printf "\e[91m$backupPath is not a valid path.\e[m\n"
        fi
    done
fi

printf "\e[1m→ Using backup file \e[36m$backupPath\e[m\n"

default_user="trackdechets"
printf "\e[1m? Postgres User\e[m [$default_user]: "
read psqlUser
psqlUser="${psqlUser:-$default_user}"
# read -rp $'\e[1m? Postgres User:\e[m ' -i "trackdechets" -e psqlUser

echo "Copying backup file to postgres"
docker cp "$backupPath" "$psql_container_id":/tmp/dump.sql

printf "\e[1m→ Recreating DB \e[36mprisma\e[m\n"
docker exec -t "$psql_container_id" bash -c "psql -U $psqlUser -c \"DROP DATABASE IF EXISTS prisma;\"";
docker exec -t "$psql_container_id" bash -c "psql -U $psqlUser -c \"CREATE DATABASE prisma;\"";
docker exec -t "$psql_container_id" bash -c "psql -U $psqlUser -d prisma -c 'CREATE SCHEMA default\$default;'";

printf "\e[1m→ Restoring dump\n"
docker exec -t "$psql_container_id" bash -c "pg_restore -U $psqlUser -d prisma --clean /tmp/dump.sql 2>/dev/null";

PWD=$(pwd)
if [ "$BASEDIR"  == "$PWD" ]; then
  APP_DIR=$(dirname "$PWD")
  printf "\e[1m→ Changing directory to $APP_DIR, as migrate needs to access envs\e[m\n"
  cd "$APP_DIR" || exit
fi

printf "\e[1m→ Running SQL migrations\n"
npx prisma migrate dev
