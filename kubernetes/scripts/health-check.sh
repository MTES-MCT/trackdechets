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
