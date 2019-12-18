#!/bin/sh

export NODE_ENV=test
export PRISMA_ENDPOINT=http://localhost:4467/default/staging
export PRISMA_SECRET=any_secret
export JWT_SECRET=any_secret
export BACK_PORT=8383

echo ">> Starting containers..."
docker-compose up --build -d

echo ">> Deploy to prisma..."
cd ../prisma
npx prisma deploy
npx prisma seed -r

echo ">> Run tests..."
cd ..
npx jest --config ./integration-tests/jest.config.js  -i --forceExit --detectOpenHandles

echo ">> Stoping containers..."
cd ./integration-tests
docker-compose stop

