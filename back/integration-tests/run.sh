#!/bin/sh

export NODE_ENV=test
export API_HOST=api-td.local
export PRISMA_ENDPOINT=http://prisma:4467/default/staging
export PRISMA_SECRET=any_secret
export COMPOSE_PROJECT_NAME=integration
export MSYS_NO_PATHCONV=1 # needed for windows
export ELASTIC_SEARCH_URL=http://elasticsearch:9200

EXIT_CODE=0

startcontainers(){
    echo "🚀 >> Starting containers..."
    docker-compose up --build -d
    echo "📑 >> Deploy DB..."
    chmod +x ./db-deploy/deploy-db.sh
    ./db-deploy/deploy-db.sh
}

stopcontainers(){
    echo ">> Removing containers 🛏️ ..."
    docker-compose rm --stop -v --force
}

runtest(){
    api_container_id=$(docker ps -qf name=^/integration.td-api)
    docker exec -e NODE_OPTIONS=--max_old_space_size=4096 -t $api_container_id npm run integration-tests $1
    EXIT_CODE=$?
}

all(){
    startcontainers
    runtest $1
    stopcontainers
}

help="$(basename "$0") [-h] [-u] [-d] [-r] [-p] -- trackdechets test runner

where:
    -h show this help text
    -u spin up containers and deploy DB
    -d down containers
    -r run integration test(s) matching given path, containers must be up
        ./$(basename "$0") -r /docker-path/to/my/test

    -p spin up containers, run integration test(s) matching given path, down containers
        ./$(basename "$0") -p /docker-path/to/my/test"

while getopts "hudp:r:" OPTION; do
    case $OPTION in
    h)
        echo "$help"
        exit 1
        ;;
    u)
        startcontainers
        exit 1
        ;;
    d)
        echo "down"
        stopcontainers
        exit 1
        ;;
    r)
        runtest $OPTARG
          exit 1
        ;;
    p)
        all $OPTARG
        exit 1
        ;;
    *)
        echo -e "\e[31mIncorrect options provided\e[0m"
        exit 1
        ;;
    esac
done

# no args, run everything
all

exit $EXIT_CODE;
