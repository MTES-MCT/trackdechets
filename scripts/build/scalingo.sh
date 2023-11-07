#!/bin/sh

set -e

echo "Building apps"
npx nx run-many -t build

echo "Pruning dev dependencies (this is only done by Scalingo when NODE_ENV=production)"
npm prune --production

####
# Hacks while we have to run non main entries files
####

# Copy shared/constants output to node_modules so that import works
cp -R dist/shared node_modules/

# The back folder holds several apps.
# Some scripts must only run for the main API
if [[ "$APP" == *api ]]; then
    echo "Running migrate for $APP"
    npx nx run back:migrate
fi
