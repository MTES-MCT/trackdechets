#!/bin/bash

bold=$(tput bold)
reset=$(tput sgr0)
red=$(tput setaf 1)
blue=$(tput setaf 4)

# Change the current directory to the script's directory
cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1

env_file="../.env"
if [[ -f "$env_file" ]]
then
  line=$(grep -E "^TD_XSLX2CSV_PATH=" "$env_file" | head -n 1)
  if [[ -n "$line" ]]; then
      eval "export $line"
  fi
fi

CURRENT_DIR=$(pwd)
if [ -z "$TD_XSLX2CSV_PATH" ];
then
    echo "${red}Please set \$TD_XSLX2CSV_PATH either as ENV or in the root .env file (ex: home/you/trackdechets-xslx2csv/src)${reset}"
    exit 1
fi
if [[ ! -d "$TD_XSLX2CSV_PATH" ]]; then
    echo "${red}Invalid directory: '$TD_XSLX2CSV_PATH'. The directory must be absolute or relative to the script file${reset}"
    exit 1
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
cd "$TD_XSLX2CSV_PATH" || exit 1
pipenv run python xlsx2csv.py "$cleanedPath"
echo "${blue}-------------------------------------------------------${reset}"

cd "$CURRENT_DIR" || exit 1
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
