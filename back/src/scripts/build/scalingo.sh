#!/bin/sh

set -e

npm run build
npm prune --production

# Until we have a proper monorepo, the back folder holds several apps
# Some scripts must only run for the main API
if [ -z "${STARTUP_FILE}" ] || [ "$STARTUP_FILE" = "dist/src/index.js" ]; then
    cd dist
    npm run migrate
fi
