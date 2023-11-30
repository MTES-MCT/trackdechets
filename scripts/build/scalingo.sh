#!/bin/sh

set -e

echo "Building apps"
npx nx run-many -t build

# Some scripts must only run for the main API
if echo "$APP" | grep -o 'api'; then
    echo "Running migrate for $APP"
    npx nx run back:migrate
fi

SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

if echo "$APP" | grep -q 'storybook'; then
    npx nx run front:build-storybook
    cp "$ROOT_DIR/.slugignore.storybook" "$ROOT_DIR/.slugignore"
elif echo "$APP" | grep -q 'front'; then
    cp "$ROOT_DIR/.slugignore.front" "$ROOT_DIR/.slugignore"
else
    cp "$ROOT_DIR/.slugignore.back" "$ROOT_DIR/.slugignore"
fi