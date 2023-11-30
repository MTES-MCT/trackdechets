#!/bin/sh

set -e

echo "Building apps"
npx nx run-many -t build

echo "Pruning dev dependencies (this is only done by Scalingo when NODE_ENV=production)"
npm prune --production

# Some scripts must only run for the main API
if [[ "$APP" == *api ]]; then
    echo "Running migrate for $APP"
    npx nx run back:migrate
fi

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
ROOT_DIR="$(dirname $(dirname "$SCRIPT_DIR"))"
if [[ "$APP" == *storybook ]]; then
    cp "$ROOT_DIR/.slugignore.storybook" "$ROOT_DIR/.slugignore"
elif [[ "$APP" == *front ]]; then
    cp "$ROOT_DIR/.slugignore.front" "$ROOT_DIR/.slugignore"
else
    cp "$ROOT_DIR/.slugignore.back" "$ROOT_DIR/.slugignore"
fi