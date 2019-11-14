#!/bin/sh

# Exit and return error if any command fails
set -e

# Run backend tests
echo "Running td-api tests"
docker exec $(docker ps -aqf "name=td-api") npm test
echo "......................"


# Run frontend tests
echo "Running td-front tests"
docker exec -e CI=true $(docker ps -aqf "name=td-ui") npm test
echo "......................."