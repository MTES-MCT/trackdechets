#!/bin/sh

export NODE_ENV=test
export PRISMA_ENDPOINT=http://prisma:4467/default/staging
export PRISMA_SECRET=any_secret
export COMPOSE_PROJECT_NAME=integration

echo ">> Running integration test 🚀..."
echo ">> Starting containers..."
docker-compose up --build -d

# We curl prisma on exposed port 4466
if [ "$(curl -sL -w '%{http_code}' http://prisma:4466 -o /dev/null)" = "200" ]; then
    echo ">> Prisma is up 👍"
else
    echo ">> Waiting for Prisma to wake up ⌚..."
    sleep 5
fi

echo ">> Deploy to prisma..."

docker exec -it $(docker ps -qf "name=td-api") npx prisma deploy
docker exec -it $(docker ps -qf "name=td-api") npx prisma seed -r
echo ">> Run tests..."

docker exec -it $(docker ps -qf "name=td-api") npx jest --config integration.jest.config.js  -i --forceExit --detectOpenHandles

echo ">> Stopping containers 🛏️ ..."

docker-compose stop

