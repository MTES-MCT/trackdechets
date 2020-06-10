#!/bin/sh

# Exit and return error if any command fails
set -e

# Root of the project
GIT_DIR=$(git rev-parse --git-dir)

BACK_DIR=$(realpath $GIT_DIR)/../back
FRONT_DIR=$(realpath $GIT_DIR)/../front

# Run linter on back
echo "Running linter for ./back"
cd $BACK_DIR && npm run lint

# Run prettier on front
echo "Running prettier for ./front"
cd $FRONT_DIR && npx prettier --check src/**/*.tsx