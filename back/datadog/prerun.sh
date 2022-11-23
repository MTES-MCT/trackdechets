#!/usr/bin/env bash

# Disable the Datadog Agent for one-off
# > When starting a one-off container for an application, the platform injects the runtime environment variables plus SCALINGO_USER_ID
# ex:
# CONTAINER=one-off-7652
# SCALINGO_USER_ID=us-1234-567-891-234-5678
if [[ -n "${SCALINGO_USER_ID}" ]] || [[ "${CONTAINER}" == "one-off"* ]]; then
  DISABLE_DATADOG_AGENT="true"
fi

# Disable psql integration for every nodes but the first
# There seems to be no env to disable the psql integration, so we simply remove the config file
FIRST_NODE="web-1"

if [[ -n "$DATABASE_URL" ]] && [[ "${CONTAINER}" == "$FIRST_NODE" ]]; then
  POSTGREGEX='^postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.*)\?(.*)$'
  if [[ $DATABASE_URL =~ $POSTGREGEX ]]; then
    sed -i "s/<DD_DATABASE_HOST>/${BASH_REMATCH[3]}/g" ./datadog/conf.d/postgres.yaml
    sed -i "s/<DD_DATABASE_USER>/${BASH_REMATCH[1]}/g" ./datadog/conf.d/postgres.yaml
    sed -i "s/<DD_DATABASE_PWD>/${BASH_REMATCH[2]}/g" ./datadog/conf.d/postgres.yaml
    sed -i "s/<DD_DATABASE_PORT>/${BASH_REMATCH[4]}/g" ./datadog/conf.d/postgres.yaml
    sed -i "s/<DD_DATABASE_DB>/${BASH_REMATCH[5]}/g" ./datadog/conf.d/postgres.yaml
  fi
else 
  rm ./datadog/conf.d/postgres.yaml
fi

