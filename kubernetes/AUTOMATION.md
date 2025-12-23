# Deployment Automation Scripts

## GitHub Actions / CI/CD Integration

### Example: Deploy to Production

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
    paths:
      - "apps/**"
      - "libs/**"
      - "kubernetes/**"

env:
  REGISTRY: ghcr.io/trackdechets

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build applications
        run: npx nx run-many --target=build --all --parallel=3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push Docker images
        run: |
          # Get git SHA for image tagging
          SHORT_SHA=$(git rev-parse --short HEAD)

          # Build and push all images
          for app in ui api notifier cron queues-runner queues-indexation queues-bulk-indexation queues-bulk-indexation-master queues-webhooks queues-gerico; do
            echo "Building $app..."
            docker buildx build \
              --platform linux/amd64 \
              --file apps/$app/Dockerfile \
              --tag $REGISTRY/$app:$SHORT_SHA \
              --tag $REGISTRY/$app:latest \
              --push \
              .
          done

      - name: Install kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: "v1.28.0"

      - name: Install kustomize
        run: |
          curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
          sudo mv kustomize /usr/local/bin/

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG }}" | base64 -d > $HOME/.kube/config

      - name: Update kustomization with new image tags
        run: |
          SHORT_SHA=$(git rev-parse --short HEAD)
          cd kubernetes/overlays/production

          # Update all image tags to new SHA
          kustomize edit set image \
            $REGISTRY/ui:$SHORT_SHA \
            $REGISTRY/api:$SHORT_SHA \
            $REGISTRY/notifier:$SHORT_SHA \
            $REGISTRY/cron:$SHORT_SHA \
            $REGISTRY/queues-runner:$SHORT_SHA \
            $REGISTRY/queues-indexation:$SHORT_SHA \
            $REGISTRY/queues-bulk-indexation:$SHORT_SHA \
            $REGISTRY/queues-bulk-indexation-master:$SHORT_SHA \
            $REGISTRY/queues-webhooks:$SHORT_SHA \
            $REGISTRY/queues-gerico:$SHORT_SHA

      - name: Deploy to production
        run: |
          kubectl apply -k kubernetes/overlays/production

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/api -n trackdechets --timeout=5m
          kubectl rollout status deployment/ui -n trackdechets --timeout=5m
          kubectl rollout status deployment/notifier -n trackdechets --timeout=5m

      - name: Verify deployment
        run: |
          # Check all pods are running
          kubectl get pods -n trackdechets

          # Check API health
          kubectl exec -n trackdechets deployment/api -- curl -f http://localhost:4000/.well-known/apollo/server-health
```

## Local Deployment Scripts

### deploy.sh - Deploy to any environment

```bash
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
  echo "  UI: https://recette.trackdechets.fr"
  echo "  API: https://api.recette.trackdechets.fr"
  echo "  Notifier: https://notifier.recette.trackdechets.fr"
  echo ""
  echo "💡 Recette environment"
elif [ "$ENVIRONMENT" = "staging" ]; then
  echo "  UI: https://sandbox.trackdechets.beta.gouv.fr"
  echo "  API: https://api.sandbox.trackdechets.beta.gouv.fr"
  echo "  Notifier: https://notifier.sandbox.trackdechets.beta.gouv.fr"
else
  echo "  UI: https://app.trackdechets.beta.gouv.fr"
  echo "  API: https://api.trackdechets.beta.gouv.fr"
  echo "  Notifier: https://notifier.trackdechets.beta.gouv.fr"
fi
```

### build-images.sh - Build all Docker images

```bash
#!/bin/bash
set -e

REGISTRY=${REGISTRY:-"ghcr.io/trackdechets"}
TAG=${TAG:-"latest"}

echo "🐳 Building Docker images..."
echo "Registry: $REGISTRY"
echo "Tag: $TAG"

# Build Nx projects first
echo "📦 Building Nx projects..."
npx nx run-many --target=build --all --parallel=3

# Apps to build
APPS=(
  "ui"
  "api"
  "notifier"
  "cron"
  "queues-runner"
  "queues-indexation"
  "queues-bulk-indexation"
  "queues-bulk-indexation-master"
  "queues-webhooks"
  "queues-gerico"
)

# Build and push each app
for app in "${APPS[@]}"; do
  echo ""
  echo "🔨 Building $app..."
  docker build \
    --file apps/$app/Dockerfile \
    --tag $REGISTRY/$app:$TAG \
    --tag $REGISTRY/$app:$(git rev-parse --short HEAD) \
    .

  echo "📤 Pushing $app..."
  docker push $REGISTRY/$app:$TAG
  docker push $REGISTRY/$app:$(git rev-parse --short HEAD)
done

echo ""
echo "✅ All images built and pushed successfully!"
echo ""
echo "📝 Update kubernetes/overlays/*/kustomization.yaml with:"
echo "   Image tag: $TAG or $(git rev-parse --short HEAD)"
```

### scale.sh - Scale applications

```bash
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
```

### logs.sh - View application logs

```bash
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
```

### migrate.sh - Run database migrations

```bash
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
```

### backup.sh - Trigger manual backup

```bash
#!/bin/bash
set -e

NAMESPACE=${1:-trackdechets}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "💾 Triggering manual backup for PostgreSQL..."

cat <<EOF | kubectl apply -f -
apiVersion: postgresql.cnpg.io/v1
kind: Backup
metadata:
  name: postgres-manual-backup-$TIMESTAMP
  namespace: $NAMESPACE
spec:
  cluster:
    name: postgres
EOF

echo "✅ Backup job created: postgres-manual-backup-$TIMESTAMP"
echo ""
echo "📊 Check backup status:"
echo "   kubectl get backup postgres-manual-backup-$TIMESTAMP -n $NAMESPACE"
```

### health-check.sh - Check cluster health

```bash
#!/bin/bash

NAMESPACE=${1:-trackdechets}

echo "🏥 Checking Trackdéchets cluster health..."
echo ""

# Check databases
echo "📊 Database Status:"
echo "PostgreSQL:"
kubectl get cluster postgres -n $NAMESPACE -o jsonpath='{.status.instances}' 2>/dev/null | jq || echo "  ❌ Not ready"

echo "Elasticsearch:"
kubectl get elasticsearch elasticsearch -n $NAMESPACE -o jsonpath='{.status.health}' 2>/dev/null || echo "  ❌ Not ready"

echo "Redis:"
kubectl get redisfailover redis -n $NAMESPACE -o jsonpath='{.status.phase}' 2>/dev/null || echo "  ❌ Not ready"

echo "MongoDB:"
kubectl get psmdb mongodb -n $NAMESPACE -o jsonpath='{.status.state}' 2>/dev/null || echo "  ❌ Not ready"

echo ""
echo "🚀 Application Status:"
kubectl get deployments -n $NAMESPACE -o custom-columns=NAME:.metadata.name,READY:.status.readyReplicas,AVAILABLE:.status.availableReplicas,DESIRED:.spec.replicas

echo ""
echo "📈 Horizontal Pod Autoscalers:"
kubectl get hpa -n $NAMESPACE

echo ""
echo "⚠️  Recent Events:"
kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -10

echo ""
echo "🌐 Ingress Status:"
kubectl get ingress -n $NAMESPACE
```

## Usage

Make scripts executable:

```bash
chmod +x kubernetes/scripts/*.sh
```

Example workflows:

```bash
# Deploy to development
./kubernetes/scripts/deploy.sh dev

# Build and push images
REGISTRY=ghcr.io/trackdechets TAG=v2.0.0 ./kubernetes/scripts/build-images.sh

# Scale bulk indexation during reindex
./kubernetes/scripts/scale.sh queues-bulk-indexation 10

# View API logs
./kubernetes/scripts/logs.sh api

# Run migrations after deployment
./kubernetes/scripts/migrate.sh

# Check cluster health
./kubernetes/scripts/health-check.sh

# Trigger manual backup
./kubernetes/scripts/backup.sh
```
