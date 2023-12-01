#!/bin/bash
set -e

green=$(tput setaf 2)
reset=$(tput sgr0)

# Start docker containers + api, front, notifiers & queues
TASK="npx nx run-many -t serve --configuration=integration --projects=api,front,tag:backend:background --parallel=6"
PID=$(ps aux | grep "$TASK" | grep -v grep | awk '{print $2}')

if [ "$1" == "-s" ]
then
  if [ ! -z "$PID" ]
  then
    kill -9 $PID
    echo "Killed process ${green}$PID${reset}"
  else
    echo "Task ${green}$TASK${reset} is not running, there is nothing to stop."
  fi
  exit 0
fi

if [ -z "$PID" ]
then
  nohup $TASK > /dev/null 2>&1 &
  echo "Started task ${green}$TASK${reset}"
else
  echo "Task is already running as ${green}$PID${reset}"
fi