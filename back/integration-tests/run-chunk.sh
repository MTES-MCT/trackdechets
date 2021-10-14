#!/bin/sh

if [ $# -ne 2 ] ; then
    echo "You must pass 2 arguments - \$1: chunk index, \$2: total number of chunks"
    exit 1
fi

NB_OF_TESTS=$(npx jest --listTests | wc -l)
CHUNK_SIZE=$(((NB_OF_TESTS + $2 - 1) / $2))

echo "Number of tests: $NB_OF_TESTS | Chunk size: $CHUNK_SIZE | Chunk index: $1/$2"

TEST_START_INDEX=$((CHUNK_SIZE * $1))
TEST_FILES=$(npx jest --listTests | head -n $TEST_START_INDEX | tail -n $CHUNK_SIZE)

./run.sh "$TEST_FILES"