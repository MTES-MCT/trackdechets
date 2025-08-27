#!/bin/bash

bold=$(tput bold)
reset=$(tput sgr0)
green=$(tput setaf 2)
red=$(tput setaf 9)

echo "${bold}→ This utility will automatically restore the sandbox database from a dump,"
echo "pull everything from the branch you specify"
echo "You can then run npx prisma migrate dev to test your migrations, or npx nx run @td/scripts:migrate to run scripts${reset}"

echo "${bold}→ Checking disk space${reset}"
lsblk -o NAME,MOUNTPOINT,SIZE,FSUSED,FSAVAIL,FSUSE%
echo ""
echo ""
echo "Resetting repository"
cd /root/trackdechets/
git add .
git reset --hard
git fetch
echo ""
echo ""
# Get current branch name
current_branch=$(git branch --show-current)
echo "${bold}→ Current branch: ${green}$current_branch${reset}"
echo "${bold}→ Enter new branch name (or press Enter to keep current branch):${reset}"
read -r branch

# If user entered a branch name, checkout that branch
if [ -n "$branch" ] && [ "$branch" != "$current_branch" ]; then
    echo "${bold}→ Switching to branch: ${green}$branch${reset}"
    git checkout "$branch"
else
    echo "${bold}→ Staying on branch: ${green}$current_branch${reset}"
fi

git pull
echo "${bold}→ Installing dependencies${reset}"
npm i

cd /root/
echo ""
echo ""
echo "${bold}→ Do you want to restore a sandbox or production database ?"
echo "${red}This will drop and re-create the database, so Cancel if you're using an already populated database.${reset}"
options=("Sandbox" "Production" "Cancel")
select opt in "${options[@]}"
do
    case $opt in
        "Sandbox")
            echo "Preparing for sandbox tests..."
            instance_type="sandbox"
            break
            ;;
        "Production")
            echo "Preparing for production test..."
            instance_type="production"
            break
            ;;
        "Cancel")
            echo "Cancelled."
            echo "${bold}${green}→ You probably already have a database, so you can now run:${reset}"
            echo "${bold}${green}cd /root/trackdechets${reset}"
            echo "${bold}${green}npx prisma migrate dev${reset}"
            echo "${bold}${green}# or${reset}"
            echo "${bold}${green}npx nx run @td/scripts:migrate${reset}"
            exit 0
            ;;
        *) echo "Invalid option $REPLY";;
    esac
done

backupName="dump.sql"
backupPath="/root/backup/$backupName"
backupTarName="db_backup.tar.gz"
backupTarPath="/root/backup/$backupTarName"

# Create backup directory if it doesn't exist
mkdir -p "/root/backup"
rm -f "/root/backup"/*

cd /root/trackdechets/scripts/
url=$(node get-db-backup-link.js $instance_type)
wget -O "$backupTarPath" "$url"
tar xvf "$backupTarPath" -C "/root/backup/"

# Find and rename the .pgsql file
for name in "/root/backup"/*.pgsql
do
  if [ -f "$name" ]; then  # Check if file exists (handles case where no .pgsql files found)
    mv "$name" "/root/backup/$backupName"
    break  # Exit after first file (in case there are multiple)
  fi
done
rm $backupTarPath

echo "${bold}→ Recreating DB ${green}prisma${reset}"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS prisma;"
sudo -u postgres psql -c "CREATE DATABASE prisma;"
echo "${bold}→ Restoring dump${reset}"
echo "the progress bar is not representative of the whole process, don't panic if it keeps going after it reaches 100%"
pv "/root/backup/$backupName" | sudo -u postgres pg_restore -d prisma --no-owner --no-privileges --clean --if-exists
rm "/root/backup/$backupName"
echo ""
echo ""
echo "${bold}${green}→ Database restore complete! You can now run:${reset}"
echo "${bold}${green}cd /root/trackdechets${reset}"
echo "${bold}${green}npx prisma migrate dev${reset}"
echo "${bold}${green}# or${reset}"
echo "${bold}${green}npx nx run @td/scripts:migrate${reset}"