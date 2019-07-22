#!/bin/bash

container=$(docker ps -aqf "name=td-etl")

docker exec -it $container bash