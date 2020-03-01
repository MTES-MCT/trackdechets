#!/bin/sh

# Exit and return error if any command fails
set -e

# Root of the project
GIT_DIR=$(git rev-parse --git-dir)

# Run linter
echo "Running linter for ./back"
cd $GIT_DIR/../back && npm run lint