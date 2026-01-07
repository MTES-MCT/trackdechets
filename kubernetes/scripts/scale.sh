#!/bin/bash
set -e

APP=${1}
REPLICAS=${2}
NAMESPACE=${3:-trackdechets}

if [ -z "$APP" ] || [ -z "$REPLICAS" ]; then
  echo "Usage: ./scale.sh <app-name> <replicas> [namespace]"
  echo ""
  echo "Available apps:"
  echo "  ui, api, notifier, cron"
  echo "  queues-runner, queues-indexation, queues-bulk-indexation"
  echo "  queues-bulk-indexation-master, queues-webhooks, queues-gerico"
  exit 1
fi

echo "🎚️  Scaling $APP to $REPLICAS replicas in namespace $NAMESPACE..."

kubectl scale deployment/$APP -n $NAMESPACE --replicas=$REPLICAS

echo "⏳ Waiting for rollout..."
kubectl rollout status deployment/$APP -n $NAMESPACE --timeout=5m

echo "✅ Scaled successfully!"
kubectl get pods -n $NAMESPACE -l app=$APP
