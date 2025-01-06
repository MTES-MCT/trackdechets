#!/bin/bash

bold=$(tput bold)
reset=$(tput sgr0)
green=$(tput setaf 2)
red=$(tput setaf 9)
blue=$(tput setaf 4)

if [ -f .env ]
then
  export "$(<.env xargs)"
fi

CURRENT_DIR=$(pwd)
if [ -z "$TD_XSLX2CSV_PATH" ];
then
    echo "${red}Please set \$TD_XSLX2CSV_PATH either as ENV or in .env file (ex: home/you/trackdechets-xslx2csv/src)${reset}"
    exit
fi

while read -erp "${bold}? Enter local XLS path :${reset} " xlsPath; do
    cleanedPath=$(echo "$xlsPath" | sed -e 's/\\ / /g')
    if [ -f "$cleanedPath" ]; then
        break
    else
        echo "${red}$cleanedPath is not a valid path.${reset}"
    fi 
done

echo "${bold}→ Spawning XSLX2CSV CLI...${reset}"
echo "${bold}→ Please use the 'Export csv' action${reset}"
echo "${blue}-------------------------------------------------------${reset}"
cd "$TD_XSLX2CSV_PATH" || exit
pipenv run python xlsx2csv.py "$cleanedPath"
echo "${blue}-------------------------------------------------------${reset}"

cd "$CURRENT_DIR" || exit
OUTPUT_DIR="$TD_XSLX2CSV_PATH/csv"

echo "${bold}→ Listing extracted files${reset}"
ls "$OUTPUT_DIR"

read -erp "${bold}? Proceed with import ${reset} (Y/n) " -n 1 PROCEED
PROCEED=${PROCEED:-Y}

if [[ ! $PROCEED =~ ^[Yy]$ ]]
then
    exit 1
fi

scalingo --region osc-secnum-fr1 --app trackdechets-production-api run --file "$OUTPUT_DIR" bash << EOF
  tar -C /tmp -xvf /tmp/uploads/csv.tar.gz
  npm i
  tsx --tsconfig back/tsconfig.lib.json back/src/users/bulk-creation/index.ts --csvDir=/tmp/
  exit
EOF
