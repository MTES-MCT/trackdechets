#!/bin/sh

export NODE_ENV=test
export PRISMA_ENDPOINT=http://localhost:4467/default/staging
export PRISMA_SECRET=any_secret
export JWT_SECRET=any_secret
export BACK_PORT=8383

echo ">> Starting containers..."
docker-compose up -d

echo ">> Waiting 20sec for Prisma to be ready..."
sleep 20

echo ">> Deploy to prisma..."
cd ../prisma
npx prisma deploy
npx prisma seed -r

echo ">> Run tests..."
cd ../integration-tests
npx jest integration-tests -i --forceExit --detectOpenHandles

echo ">> Stoping containers..."
docker-compose stop

