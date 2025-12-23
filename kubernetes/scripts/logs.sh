#!/bin/bash

APP=${1}
NAMESPACE=${2:-trackdechets}
FOLLOW=${3:--f}

if [ -z "$APP" ]; then
  echo "Usage: ./logs.sh <app-name> [namespace] [--follow|-f]"
  echo ""
  echo "Available apps:"
  echo "  ui, api, notifier, cron"
  echo "  queues-runner, queues-indexation, queues-bulk-indexation"
  echo "  queues-bulk-indexation-master, queues-webhooks, queues-gerico"
  exit 1
fi

echo "📋 Showing logs for $APP in namespace $NAMESPACE..."
kubectl logs -n $NAMESPACE -l app=$APP --tail=100 $FOLLOW
