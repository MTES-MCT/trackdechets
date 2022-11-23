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

echo "Print DD_CONF_DIR"
echo $DD_CONF_DIR

if [[ -n "${DATABASE_URL}" ]] && [[ "${CONTAINER}" == "${FIRST_NODE}" ]]; then
  echo 'Container N°1 detected : activating datadog agent postgres monitoring'
  POSTGREGEX='^postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.*)\?(.*)$'
  if [[ $DATABASE_URL =~ $POSTGREGEX ]]; then
    sed -i "s/<DD_DATABASE_HOST>/${BASH_REMATCH[3]}/g" "${DD_CONF_DIR}/conf.d/postgres.yaml"
    sed -i "s/<DD_DATABASE_USER>/${BASH_REMATCH[1]}/g" "${DD_CONF_DIR}/conf.d/postgres.yaml"
    sed -i "s/<DD_DATABASE_PWD>/${BASH_REMATCH[2]}/g" "${DD_CONF_DIR}/conf.d/postgres.yaml"
    sed -i "s/<DD_DATABASE_PORT>/${BASH_REMATCH[4]}/g" "${DD_CONF_DIR}/conf.d/postgres.yaml"
    sed -i "s/<DD_DATABASE_DB>/${BASH_REMATCH[5]}/g" "${DD_CONF_DIR}/conf.d/postgres.yaml"
  fi
  cat "${DD_CONF_DIR}/conf.d/postgres.yaml"
else 
  # Disable psql integration for every nodes but the first
  # There seems to be no env to disable the psql integration, so we simply remove the config file
  echo 'Container N° > 1 detected : de-activating datadog agent postgres monitoring'
  rm "${DD_CONF_DIR}/conf.d/postgres.yaml"
fi