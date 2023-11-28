#!/bin/bash
# Get the PID of the PM2 process
pid=$(npx pm2 pid start-queue-tests | tr -d '[:space:]')
# Compare the PID with 0
if [ "$pid" -eq 0 ]; then
    # Start the process if it's not running
    npx pm2 start npm --name start-queue-tests -- run start-queue-tests
else
    echo "Process is already running."
fi
