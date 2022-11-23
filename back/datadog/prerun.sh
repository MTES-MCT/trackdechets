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
if [[ "${CONTAINER}" != *"$FIRST_NODE" ]]; then
  rm ./conf.d/postgres.yaml
fi