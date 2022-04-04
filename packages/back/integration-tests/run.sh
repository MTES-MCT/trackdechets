#!/bin/bash

export COMPOSE_PROJECT_NAME=integration
export MSYS_NO_PATHCONV=1 # needed for windows

ENV_FILE=.integration-tests-env
EXIT_CODE=0

loadenv() {
    if [ -f $ENV_FILE ];then
        export $(grep -v '^#' $ENV_FILE | xargs)
    fi
}

startcontainers(){
    echo "🚀 >> Starting containers..."
    docker-compose up -d
    echo "📑 >> Deploy DB..."
    loadenv
    chmod +x ./db-deploy/deploy-db.sh
    ./db-deploy/deploy-db.sh
    echo "📑 >> Index ES..."
}

stopcontainers(){
    echo ">> Removing containers 🛏️ ..."
    docker-compose rm --stop -v --force
}

runtest(){
    loadenv
    npm run integration-tests "$1"
    EXIT_CODE=$?
}

all(){
    startcontainers
    runtest "$1"
    stopcontainers
}

chunk() {
    startcontainers

    mapfile -t chunk_infos < <(echo "$1" | tr "-" "\n")
    echo "🔢 >> Chunk index: ${chunk_infos[0]}/${chunk_infos[1]}"
    tests_to_run=$(./get-chunk.sh ${chunk_infos[0]} ${chunk_infos[1]})
    chunk_length=$(echo "$tests_to_run" | tr -cd '|' | wc -c)
    echo "📏 >> Chunk length $chunk_length"

    runtest "(${tests_to_run::-1})"
    stopcontainers
}

help="$(basename "$0") [-h] [-u] [-d] [-r] [-p] [-c] -- trackdechets test runner

where:
    -h show this help text
    -u spin up containers and deploy DB
    -d down containers
    -r run integration test(s) matching given path, containers must be up
        ./$(basename "$0") -r /docker-path/to/my/test

    -p spin up containers, run integration test(s) matching given path, down containers
        ./$(basename "$0") -p /docker-path/to/my/test

    -c CI only. Run integration test(s) by chunk
        ./$(basename "$0") \$CHUNK_SIZE \$NB_OF_CHUNKS"

while getopts "hudp:r:c:" OPTION; do
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
        runtest "$OPTARG"
          exit 1
        ;;
    p)
        all "$OPTARG"
        exit 1
        ;;

    c)  chunk "$OPTARG"
        exit $EXIT_CODE
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
