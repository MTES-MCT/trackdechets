#!/bin/bash

# Helper to restore a DB backup locally
# -------------------------------------

bold=$(tput bold)
reset=$(tput sgr0)
green=$(tput setaf 2)
red=$(tput setaf 9)

BASEDIR=$(realpath "$0" | sed 's|\(.*\)/.*|\1|')
psql_container_id=$(docker ps -qf name=^/trackdechets.postgres)

echo "${bold}! Before running this script, make sure you closed all open connections to the DB (app, queue, notifier, SQL soft...)${reset}"

read -erp "${bold}? Do you wish to download the latest backup of your chosen database ${reset} (Y/n) " -e downloadBackup
downloadBackup=${downloadBackup:-Y}

if [ "$downloadBackup" != "${downloadBackup#[Yy]}" ]; then
    echo "${reset}"

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
    echo "${reset}"
else
    while read -erp "${bold}? Enter local backup path (pgsql file):${reset} " backupPath; do
        if [ -f "$backupPath" ]; then
            break
        else
            echo "${red}$backupPath is not a valid path.${reset}"
        fi
    done
fi

echo "${bold}→ Using backup file ${green}$backupPath${reset}"

default_user="trackdechets"
echo "${bold}? Postgres User${reset} [$default_user]: "
read psqlUser
psqlUser="${psqlUser:-$default_user}"
# read -rp $'${bold}? Postgres User:${reset} ' -i "trackdechets" -e psqlUser

echo "Copying backup file to postgres"
docker cp "$backupPath" "$psql_container_id":/tmp/dump.sql

echo "${bold}→ Recreating DB ${green}prisma${reset}"
docker exec -t "$psql_container_id" bash -c "psql -U $psqlUser -c \"DROP DATABASE IF EXISTS prisma;\"";
docker exec -t "$psql_container_id" bash -c "psql -U $psqlUser -c \"CREATE DATABASE prisma;\"";
docker exec -t "$psql_container_id" bash -c "psql -U $psqlUser -d prisma -c 'CREATE SCHEMA default\$default;'";

echo "${bold}→ Restoring dump"
docker exec -t "$psql_container_id" bash -c "pg_restore -U $psqlUser -d prisma --clean /tmp/dump.sql 2>/dev/null";

PWD=$(pwd)
if [ "$BASEDIR"  == "$PWD" ]; then
  APP_DIR=$(dirname "$PWD")
  echo "${bold}→ Changing directory to $APP_DIR, as migrate needs to access envs${reset}"
  cd "$APP_DIR" || exit
fi

echo "${bold}→ Running SQL migrations"
npx prisma migrate dev
