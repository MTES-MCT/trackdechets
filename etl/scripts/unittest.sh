#!/bin/bash

container=$(docker ps -aqf "name=td-etl")

# create test database
docker exec $container python -m tests.setup_db

# run the tests
docker exec -e AIRFLOW__CORE__LOGGING_LEVEL=INFO $container python -m unittest $1

# drop test database
docker exec $container python -m tests.teardown_db