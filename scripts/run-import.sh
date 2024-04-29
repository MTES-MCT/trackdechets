#!/bin/bash

if [ -f .env ]
then
  export "$(<.env xargs)"
fi

CURRENT_DIR=$(pwd)
if [ -z "$TD_XSLX2CSV_PATH" ];
then
    echo -e "\e[91mPlease set \$TD_XSLX2CSV_PATH either as ENV or in .env file (ex: home/you/trackdechets-xslx2csv/src)\e[m"
    exit
fi

while read -erp $'\e[1m? Enter local XLS path :\e[m ' xlsPath; do
    if [ -f "$xlsPath" ]; then
        break
    else
        echo -e "\e[91m$xlsPath is not a valid path.\e[m"
    fi 
done

echo -e "\e[1m→ Spawning XSLX2CSV CLI...\e[m"
echo -e "\e[1m→ Please use the 'Export csv' action\e[m"
echo -e "\e[94m-------------------------------------------------------\e[m"
cd "$TD_XSLX2CSV_PATH" || exit
pipenv run python xlsx2csv.py "$xlsPath"
echo -e "\e[94m-------------------------------------------------------\e[m"

cd "$CURRENT_DIR" || exit
OUTPUT_DIR="$TD_XSLX2CSV_PATH/csv"

echo -e "\e[1m→ Listing extracted files\e[m"
ls "$OUTPUT_DIR"

read -erp $'\e[1m? Proceed with import \e[m (Y/n) ' -n 1 PROCEED
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
