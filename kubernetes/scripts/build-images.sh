#!/bin/bash
set -e

REGISTRY=${REGISTRY:-"your-registry.example.com/trackdechets"}
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
