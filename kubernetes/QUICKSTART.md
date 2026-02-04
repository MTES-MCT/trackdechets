# Quick Start Guide - Trackdéchets Kubernetes

## Prerequisites Checklist

- [ ] Kubernetes 1.25+ cluster running
- [ ] `kubectl` configured
- [ ] `kustomize` installed
- [ ] Container registry accessible
- [ ] S3-compatible storage (Scaleway) configured
- [ ] Domain names configured (or /etc/hosts for dev)

## Installation Steps (5 minutes)

### 1. Install Operators

```bash
# PostgreSQL
kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.22/releases/cnpg-1.22.0.yaml

# Elasticsearch
kubectl create -f https://download.elastic.co/downloads/eck/2.11.0/crds.yaml
kubectl apply -f https://download.elastic.co/downloads/eck/2.11.0/operator.yaml

# Redis (OT-Container-Kit)
kubectl apply -f https://raw.githubusercontent.com/OT-CONTAINER-KIT/redis-operator/master/config/crd/bases/redis.redis.opstreelabs.in_redises.yaml
kubectl apply -f https://raw.githubusercontent.com/OT-CONTAINER-KIT/redis-operator/master/config/rbac/service_account.yaml
kubectl apply -f https://raw.githubusercontent.com/OT-CONTAINER-KIT/redis-operator/master/config/rbac/role.yaml
kubectl apply -f https://raw.githubusercontent.com/OT-CONTAINER-KIT/redis-operator/master/config/rbac/role_binding.yaml
kubectl apply -f https://raw.githubusercontent.com/OT-CONTAINER-KIT/redis-operator/master/config/manager/manager.yaml

# External Secrets
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace

# MongoDB (use Helm to avoid CRD annotation issues)
helm repo add percona https://percona.github.io/percona-helm-charts/
helm install psmdb-operator percona/psmdb-operator --namespace mongodb-system --create-namespace

# Nginx Ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace
```

### 2. Configure Secrets and Project ID

```bash
# Create Scaleway credentials secrets
kubectl create secret generic scw-frontend-credentials \
  --namespace=trackdechets-frontend \
  --from-literal=access-key=YOUR_SCALEWAY_ACCESS_KEY \
  --from-literal=secret-key=YOUR_SCALEWAY_SECRET_KEY

kubectl create secret generic scw-backend-credentials \
  --namespace=trackdechets-backend \
  --from-literal=access-key=YOUR_SCALEWAY_ACCESS_KEY \
  --from-literal=secret-key=YOUR_SCALEWAY_SECRET_KEY

# Set Scaleway project ID (replace YOUR_PROJECT_ID)
kubectl patch secretstore backend-secretstore \
  --namespace trackdechets-backend \
  --type merge \
  -p '{"spec":{"provider":{"scaleway":{"projectId":"YOUR_PROJECT_ID"}}}}'

kubectl patch secretstore frontend-secretstore \
  --namespace trackdechets-frontend \
  --type merge \
  -p '{"spec":{"provider":{"scaleway":{"projectId":"YOUR_PROJECT_ID"}}}}'
```

### 3. Update Configuration

```bash
cd kubernetes/overlays/dev  # or staging/production (recette/sandbox/production)

# Edit kustomization.yaml - update:
# - Image registry URLs (replace "your-registry")
# - Domain names (if using custom domains)
```

### 4. Deploy

```bash
# For development (recette)
kubectl apply -k kubernetes/overlays/dev

# For staging (sandbox)
kubectl apply -k kubernetes/overlays/staging

# For production
kubectl apply -k kubernetes/overlays/production
```

### 4. Verify

```bash
# Check all pods are running
kubectl get pods -n trackdechets
# Should see: ui, api, notifier, cron, 7 queue workers, 4 databases

# Check databases are ready
kubectl get clusters.postgresql.cnpg.io -n trackdechets  # PostgreSQL
kubectl get elasticsearch -n trackdechets                # Elasticsearch
kubectl get redisfailover -n trackdechets                # Redis
kubectl get psmdb -n trackdechets                        # MongoDB

# Get ingress address
kubectl get ingress -n trackdechets
```

### 5. Run Migrations

```bash
# Wait for PostgreSQL to be ready, then:
kubectl exec -n trackdechets deployment/api -- npx prisma migrate deploy
```

### 6. Access

```bash
# Get LoadBalancer IP
kubectl get svc -n ingress-nginx ingress-nginx-controller

# Point your domains to this IP or update /etc/hosts
# Recette: https://recette.trackdechets.fr
# Sandbox: https://sandbox.trackdechets.beta.gouv.fr
# Production: https://app.trackdechets.beta.gouv.fr
```

## Quick Commands

### View Logs

```bash
kubectl logs -n trackdechets -l app=api --tail=100 -f
kubectl logs -n trackdechets -l app=queues-indexation --tail=100 -f
```

### Scale Applications

```bash
kubectl scale deployment api -n trackdechets --replicas=5
kubectl scale deployment queues-bulk-indexation -n trackdechets --replicas=10
```

### Update Application

```bash
# Build and push new image
docker build -t your-registry/trackdechets-api:v2.0.0 -f apps/api/Dockerfile .
docker push your-registry/trackdechets-api:v2.0.0

# Update deployment
kubectl set image deployment/api api=your-registry/trackdechets-api:v2.0.0 -n trackdechets

# Or update kustomization.yaml and reapply
kubectl apply -k kubernetes/overlays/production
```

### Database Operations

```bash
# PostgreSQL: Connect to database
kubectl exec -it -n trackdechets postgres-1 -- psql -U trackdechets

# Elasticsearch: Check cluster health
kubectl exec -n trackdechets elasticsearch-es-default-0 -- curl localhost:9200/_cluster/health

# Redis: Connect to Redis CLI
kubectl exec -it -n trackdechets redis-0 -- redis-cli

# MongoDB: Connect to Mongo shell
kubectl exec -it -n trackdechets mongodb-rs0-0 -- mongosh
```

### Troubleshooting

```bash
# Pod not starting?
kubectl describe pod <pod-name> -n trackdechets

# Check events
kubectl get events -n trackdechets --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n trackdechets
kubectl top nodes

# Restart deployment
kubectl rollout restart deployment/api -n trackdechets
```

## Architecture Summary

**Frontend:** UI (React/Vite) → Nginx Ingress → Port 3000  
**Backend:** API (GraphQL) → Nginx Ingress → Port 4000  
**Realtime:** Notifier (SSE) → Nginx Ingress → Port 82  
**Background:** Cron (1 replica) + 7 Queue Workers (scalable)  
**Databases:** PostgreSQL (3 nodes) + Redis (3 nodes) + Elasticsearch (3 nodes) + MongoDB (3 nodes)  
**Storage:** External S3 (Scaleway)

## Environment Differences

| Resource      | Recette    | Sandbox     | Production       |
| ------------- | ---------- | ----------- | ---------------- |
| Databases     | 1 instance | 2 instances | 3 instances (HA) |
| API replicas  | 1          | 2           | 2-10 (HPA)       |
| UI replicas   | 1          | 2           | 2-5 (HPA)        |
| Queue workers | 1          | 2           | 2-10 (HPA)       |
| HPA           | Disabled   | Enabled     | Enabled          |
| TLS           | No         | Yes         | Yes              |
| Backups       | Optional   | Yes         | Yes + PITR       |

## Important Notes

⚠️ **NEVER commit actual secrets to git** - Use kubectl or External Secrets Operator  
⚠️ **Cron must stay at 1 replica** - Multiple instances will cause duplicate job execution  
⚠️ **Notifier needs session affinity** - Already configured for SSE connections  
⚠️ **Timezone must be Europe/Paris** - French data compliance requirement  
⚠️ **Update image tags in production** - Don't use `:latest` in production

## Need Help?

See [kubernetes/README.md](README.md) for detailed documentation.
