#!/bin/bash
set -e

NAMESPACE=${1:-trackdechets}

echo "🗄️  Running Prisma migrations in namespace $NAMESPACE..."

# Check if API pod is ready
if ! kubectl get deployment api -n $NAMESPACE >/dev/null 2>&1; then
  echo "❌ API deployment not found"
  exit 1
fi

# Run migrations
kubectl exec -n $NAMESPACE deployment/api -- npx prisma migrate deploy

echo "✅ Migrations completed successfully!"
