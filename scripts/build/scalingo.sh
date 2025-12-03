#!/bin/sh

set -e

SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "Building apps for $APP"

if echo "$APP" | grep -o 'api'; then
    npx allow-scripts
    npx nx run-many -t build --projects=api,cron,tag:backend:queues
    echo "Running migrate for $APP"
    npx prisma migrate deploy

    cp "$ROOT_DIR/.slugignore.back" "$ROOT_DIR/.slugignore"

elif echo "$APP" | grep -q 'notifier'; then
    npx allow-scripts
    npx nx run notifier:build
    cp "$ROOT_DIR/.slugignore.back" "$ROOT_DIR/.slugignore"

elif echo "$APP" | grep -q 'front'; then
    npx allow-scripts
    npx nx run ui:build
    cp "$ROOT_DIR/.slugignore.front" "$ROOT_DIR/.slugignore"

elif echo "$APP" | grep -q 'storybook'; then
    npx allow-scripts
    npx nx run front:build-storybook
    cp "$ROOT_DIR/.slugignore.storybook" "$ROOT_DIR/.slugignore"

elif echo "$APP" | grep -q 'doc'; then
    npx allow-scripts
    npx nx run doc:build
    cp "$ROOT_DIR/.slugignore.documentation" "$ROOT_DIR/.slugignore"
fi
