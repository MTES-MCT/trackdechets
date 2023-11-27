#!/usr/bin/env bash

# Disable the Datadog Agent for one-off
# > When starting a one-off container for an application, the platform injects the runtime environment variables plus SCALINGO_USER_ID
# ex:
# CONTAINER=one-off-7652
# SCALINGO_USER_ID=us-1234-567-891-234-5678
if [[ -n "${SCALINGO_USER_ID}" ]] || [[ "${CONTAINER}" == "one-off"* ]]; then
  DISABLE_DATADOG_AGENT="true"
fi

FIRST_NODE="web-1"
POSTGRES_CONF_FILE="${DD_CONF_DIR}/conf.d/postgres.d/conf.yaml"

if [[ -n "${DATABASE_URL}" ]] && [[ "${CONTAINER}" == "${FIRST_NODE}" ]]; then
  POSTGREGEX='^postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.*)\?(.*)$'
  if [[ $DATABASE_URL =~ $POSTGREGEX ]]; then
    sed -i "s/<DD_DATABASE_HOST>/${BASH_REMATCH[3]}/g" "${POSTGRES_CONF_FILE}"
    sed -i "s/<DD_DATABASE_PORT>/${BASH_REMATCH[4]}/g" "${POSTGRES_CONF_FILE}"
    sed -i "s/<DD_DATABASE_DB>/${BASH_REMATCH[5]}/g" "${POSTGRES_CONF_FILE}"
  fi
else 
  # Disable psql integration for every nodes but the first
  # There seems to be no env to disable the psql integration, so we simply remove the config file
  rm "${POSTGRES_CONF_FILE}"
fi

REDIS_CONF_FILE="${DD_CONF_DIR}/conf.d/redisdb.d/conf.yaml"

if [[ -n "${REDIS_URL}" ]] && [[ "${CONTAINER}" == "${FIRST_NODE}" ]]; then
  REDISREGEX='^redis(s?)://([^:]*):([^@]+)@([^:]+):([^/]+)/?(.*)$'
  if [[ $REDIS_URL =~ $REDISREGEX ]]; then
    sed -i "s/<DD_REDIS_HOST>/${BASH_REMATCH[4]}/g" "${REDIS_CONF_FILE}"
    sed -i "s/<DD_REDIS_PORT>/${BASH_REMATCH[5]}/g" "${REDIS_CONF_FILE}"
    sed -i "s/<DD_REDIS_PASSWORD>/${BASH_REMATCH[3]}/g" "${REDIS_CONF_FILE}"
  fi
else 
  # Disable redis integration for every nodes but the first
  # There seems to be no env to disable the redis integration, so we simply remove the config file
  rm "${REDIS_CONF_FILE}"
fi