#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}
VALID_ENVS="dev staging production"

if [[ ! " $VALID_ENVS " =~ " $ENVIRONMENT " ]]; then
  echo "Error: Invalid environment '$ENVIRONMENT'"
  echo "Usage: ./deploy.sh [dev|staging|production]"
  exit 1
fi

echo "🚀 Deploying Trackdéchets to $ENVIRONMENT..."

# Check prerequisites
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl not found"; exit 1; }
command -v kustomize >/dev/null 2>&1 || { echo "❌ kustomize not found"; exit 1; }

# Check cluster connectivity
if ! kubectl cluster-info >/dev/null 2>&1; then
  echo "❌ Cannot connect to Kubernetes cluster"
  exit 1
fi

# Deploy
echo "📦 Applying Kubernetes manifests..."
kubectl apply -k "kubernetes/overlays/$ENVIRONMENT"

# Wait for databases
echo "⏳ Waiting for databases to be ready..."
kubectl wait --for=condition=Ready cluster/postgres -n trackdechets --timeout=5m || true
kubectl wait --for=condition=Ready elasticsearch/elasticsearch -n trackdechets --timeout=5m || true

# Wait for application deployments
echo "⏳ Waiting for applications to be ready..."
kubectl rollout status deployment/api -n trackdechets --timeout=5m
kubectl rollout status deployment/ui -n trackdechets --timeout=5m
kubectl rollout status deployment/notifier -n trackdechets --timeout=5m

echo "✅ Deployment complete!"
echo ""
echo "📊 Current status:"
kubectl get pods -n trackdechets

echo ""
echo "🌐 Access the application:"
if [ "$ENVIRONMENT" = "dev" ]; then
  echo "  UI: http://dev.trackdechets.local"
  echo "  API: http://api-dev.trackdechets.local"
  echo "  Notifier: http://notifier-dev.trackdechets.local"
  echo ""
  echo "💡 Don't forget to update /etc/hosts or use port-forward"
elif [ "$ENVIRONMENT" = "staging" ]; then
  echo "  UI: https://staging.trackdechets.beta.gouv.fr"
  echo "  API: https://api-staging.trackdechets.beta.gouv.fr"
  echo "  Notifier: https://notifier-staging.trackdechets.beta.gouv.fr"
else
  echo "  UI: https://trackdechets.beta.gouv.fr"
  echo "  API: https://api.trackdechets.beta.gouv.fr"
  echo "  Notifier: https://notifier.trackdechets.beta.gouv.fr"
fi
