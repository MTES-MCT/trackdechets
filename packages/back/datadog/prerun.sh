#!/usr/bin/env bash

# Disable the Datadog Agent based on dyno type
if [ "$DYNOTYPE" == "one-off" ]; then
  DISABLE_DATADOG_AGENT="true"
fi