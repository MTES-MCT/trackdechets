#!/bin/sh

if [ $# -ne 2 ] ; then
    echo "You must pass 2 arguments - \$1: chunk index, \$2: total number of chunks"
    exit 1
fi

NB_OF_TESTS=$(npx jest --config ./jest.config.js --listTests | wc -l)
CHUNK_SIZE=$(((NB_OF_TESTS + $2 - 1) / $2))

TEST_START_INDEX=$((CHUNK_SIZE * $1))
TEST_FILES=$(npx jest --config ./jest.config.js --listTests | head -n $TEST_START_INDEX | tail -n $CHUNK_SIZE)

echo "$TEST_FILES" | tr '\n' '|' | sed "s|$PWD||g"
