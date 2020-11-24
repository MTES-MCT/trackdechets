#!/bin/sh

export NODE_ENV=test
export API_HOST=api-td.local
export PRISMA_ENDPOINT=http://prisma:4467/default/staging
export PRISMA_SECRET=any_secret
export COMPOSE_PROJECT_NAME=integration
export MSYS_NO_PATHCONV=1 # needed for windows

EXIT_CODE=0

startcontainers(){
    echo "🚀 >> Starting containers..."
    docker-compose up --build -d
    echo "📑 >> Deploy DB..."
    psql_container_id=$(docker ps -qf "name=integration_postgres")
    docker cp ./db-deploy/. $psql_container_id:/tmp
    docker exec -t $psql_container_id bash /tmp/deploy-db.sh
    echo "🔮 >> Initialize @prisma/client "
    api_container_id=$(docker ps -qf "name=integration_td-api")
    docker exec -t $api_container_id npx prisma generate
}

stopcontainers(){
    echo ">> Removing containers 🛏️ ..."
    docker-compose rm --stop -v --force
}

runtest(){
    api_container_id=$(docker ps -qf "name=integration_td-api")
    docker exec -e NODE_OPTIONS=--max_old_space_size=4096 -t $api_container_id npx jest --config ./integration-tests/jest.config.js -i --forceExit $1
    EXIT_CODE=$?
}

all(){
    startcontainers
    runtest $1
    stopcontainers
}

generatemodel(){
    root_psql_container_id=$(docker ps -qf "name=trackdechets_postgres")
    docker exec -t $root_psql_container_id bash -c "pg_dump -U trackdechets -s -Fc -n 'default\$default' prisma > /tmp/db_model.dump"
    docker cp $root_psql_container_id:/tmp/db_model.dump ./db-deploy
}

help="$(basename "$0") [-h] [-u] [-d] [-r] [-p] [-g] -- trackdechets test runner

where:
    -h show this help text
    -u spin up containers and run prisma deploy
    -d down containers
    -r run integration test(s) matching given path, containers must be up
        ./$(basename "$0") -r /docker-path/to/my/test

    -p spin up containers, run integration test(s) matching given path, down containers
        ./$(basename "$0") -p /docker-path/to/my/test
        
    -g generate new db_model.dump from current trackdechets DB"

while getopts "hudgp:r:" OPTION; do
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
    g)
        generatemodel
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
