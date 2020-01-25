#!/bin/sh

export NODE_ENV=test
export API_HOST=api-td.local
export PRISMA_ENDPOINT=http://prisma:4467/default/staging
export PRISMA_SECRET=any_secret
export COMPOSE_PROJECT_NAME=integration
export MSYS_NO_PATHCONV=1 # needed for windows

echo ">> Running integration test 🚀..."
echo ">> Starting containers..."
docker-compose up --build -d

echo ">> Deploy to prisma..."
api_container_id=$(docker ps -qf "name=integration_td-api")

docker exec -t $api_container_id bash integration-tests/wait-for-prisma.sh
docker exec -t $api_container_id npx prisma deploy
docker exec -t $api_container_id npx prisma reset --force

echo ">> Run tests..."
docker exec -t $api_container_id npx jest --config ./integration-tests/jest.config.js -i --forceExit

echo ">> Stopping containers 🛏️ ..."

docker-compose stop

