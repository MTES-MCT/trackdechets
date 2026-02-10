# Trackdéchets Kubernetes Deployment

This directory contains Kubernetes manifests and Kustomize configurations to deploy the Trackdéchets application suite to a Kubernetes cluster.

## Architecture Overview

The deployment consists of:

### Applications (11 services)

- **UI** (Frontend) - React/Vite application serving the web interface
- **API** (Backend) - GraphQL API server
- **Notifier** - Server-Sent Events (SSE) for real-time notifications
- **Cron** - Scheduled tasks and background jobs
- **Queue Workers** (7 separate deployments for independent scaling):
  - `queues-runner` - General purpose queue (mail, events, geocoding, etc.)
  - `queues-indexation` - Elasticsearch indexing worker
  - `queues-bulk-indexation` - Bulk reindexing worker (high-resource)
  - `queues-bulk-indexation-master` - Bulk indexing orchestrator
  - `queues-webhooks` - Webhook delivery worker
  - `queues-gerico` - Gerico API integration worker

### Databases (Production-grade with HA)

- **PostgreSQL 16.8** - Primary database (CloudNativePG operator, 3-node cluster)
- **Redis 5.0** - Queue management and caching (Redis Operator, 3 master + sentinels)
- **Elasticsearch 7.10.2** - BSD indexing and search (ECK operator, 3-node cluster)
- **MongoDB 6** - Event sourcing and audit logs (Percona operator, 3-node replica set)

### Storage

- **S3-compatible storage** - External service (Scaleway Object Storage) for:
  - Registry imports/exports
  - PDF templates
  - Analysis results
  - Error logs

## Directory Structure

```
kubernetes/
├── base/                    # Base Kubernetes resources
│   ├── namespace.yaml       # Namespace definition
│   ├── configmap.yaml       # Common configuration
│   ├── secrets.yaml         # Secret templates (DO NOT commit actual secrets)
│   ├── resourcequota.yaml   # Resource limits for namespace
│   ├── limitrange.yaml      # Default resource limits for pods
│   └── kustomization.yaml   # Base kustomization
├── databases/               # Database operator configurations
│   ├── postgresql.yaml      # CloudNativePG cluster
│   ├── redis.yaml           # Redis HA cluster
│   ├── elasticsearch.yaml   # ECK Elasticsearch cluster
│   └── mongodb.yaml         # Percona MongoDB replica set
├── apps/                    # Application deployments
│   ├── ui.yaml              # Frontend deployment + HPA
│   ├── api.yaml             # Backend API deployment + HPA + PDB
│   ├── notifier.yaml        # SSE server deployment + HPA + PDB
│   ├── cron.yaml            # Cron jobs deployment (single replica)
│   └── queue-workers.yaml   # All queue worker deployments + HPAs
├── ingress/                 # Networking
│   └── ingress.yaml         # Nginx Ingress + NetworkPolicies
└── overlays/                # Environment-specific configurations
    ├── dev/                 # Development (recette) environment
    ├── staging/             # Staging (sandbox) environment
    └── production/          # Production environment
```

## Prerequisites

### 1. Kubernetes Cluster

- Kubernetes 1.25+ cluster
- `kubectl` configured to access your cluster
- Storage provisioner for PersistentVolumes (e.g., `standard` StorageClass)

### 2. Install Kustomize

```bash
# macOS
brew install kustomize

# Linux
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
```

### 3. Install Required Operators

#### CloudNativePG (PostgreSQL)

```bash
kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.22/releases/cnpg-1.22.0.yaml
```

#### Elastic Cloud on Kubernetes (ECK)

```bash
kubectl create -f https://download.elastic.co/downloads/eck/2.11.0/crds.yaml
kubectl apply -f https://download.elastic.co/downloads/eck/2.11.0/operator.yaml
```

#### Redis Operator (Spotahome)

```bash
kubectl apply -f https://raw.githubusercontent.com/spotahome/redis-operator/master/manifests/databases.spotahome.com_redisfailovers.yaml
kubectl apply -f https://raw.githubusercontent.com/spotahome/redis-operator/master/example/operator.yaml
```

Alternative: Use Bitnami Redis Helm chart (see `databases/redis.yaml` comments)

#### Percona Operator for MongoDB

```bash
kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/main/deploy/bundle.yaml
```

#### Nginx Ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  -n ingress-nginx --create-namespace \
  --set controller.service.type=LoadBalancer
```

#### Optional: Cert-Manager (for TLS certificates)

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

## Deployment Instructions

### Step 1: Configure Secrets

**IMPORTANT**: The `base/secrets.yaml` file contains placeholder values. You MUST update these before deploying.

#### Option A: Edit secrets.yaml directly (NOT RECOMMENDED for production)

```bash
# Edit kubernetes/base/secrets.yaml and replace all "changeme" values
# Then apply with kustomize
```

#### Option B: Create secrets with kubectl (RECOMMENDED)

```bash
# Delete the template secret from kustomization first
# Then create actual secrets:

kubectl create secret generic trackdechets-secrets -n trackdechets \
  --from-literal=DATABASE_URL='postgresql://trackdechets:STRONG_PASSWORD@postgres-rw:5432/trackdechets' \
  --from-literal=REDIS_URL='redis://redis-master:6379' \
  --from-literal=MONGO_URL='mongodb://trackdechets:STRONG_PASSWORD@mongodb:27017' \
  --from-literal=ELASTIC_SEARCH_URL='http://elasticsearch:9200' \
  --from-literal=API_TOKEN_SECRET='generate-with-openssl-rand-base64-32' \
  --from-literal=SESSION_SECRET='generate-with-openssl-rand-base64-32' \
  --from-literal=WEBHOOK_TOKEN_ENCRYPTION_KEY='must-be-exactly-32-characters--' \
  --from-literal=SIB_APIKEY='your-sendinblue-api-key' \
  --from-literal=QUEUE_MONITOR_TOKEN='your-queue-monitor-token' \
  --from-literal=GOTENBERG_TOKEN='your-gotenberg-token' \
  --from-literal=GOTENBERG_URL='http://gotenberg:3000' \
  --from-literal=SENTRY_DSN='your-sentry-dsn' \
  --from-literal=INSEE_CLIENT_ID='your-insee-client-id' \
  --from-literal=INSEE_CLIENT_SECRET='your-insee-client-secret' \
  --from-literal=INSEE_USERNAME='your-insee-username' \
  --from-literal=INSEE_PASSWORD='your-insee-password' \
  --from-literal=S3_ENDPOINT='https://s3.fr-par.scw.cloud' \
  --from-literal=S3_REGION='fr-par' \
  --from-literal=S3_ACCESS_KEY_ID='your-scaleway-access-key' \
  --from-literal=S3_SECRET_ACCESS_KEY='your-scaleway-secret-key' \
  --from-literal=S3_BUCKET='trackdechets' \
  --from-literal=S3_REGISTRY_ERRORS_BUCKET='trackdechets-registry-errors' \
  --from-literal=S3_REGISTRY_IMPORTS_BUCKET='trackdechets-registry-imports' \
  --from-literal=S3_REGISTRY_EXPORTS_BUCKET='trackdechets-registry-exports' \
  --from-literal=S3_TEXS_ANALYSIS_BUCKET='trackdechets-texs-analysis' \
  --from-literal=S3_REGISTRY_MODELS_BUCKET='trackdechets-registry-models' \
  --from-literal=S3_REGISTRY_EXHAUSTIVE_EXPORTS_BUCKET='trackdechets-registry-exhaustive-exports' \
  --from-literal=S3_BSD_TEMPLATES_BUCKET='trackdechets-bsd-templates' \
  --from-literal=TD_COMPANY_ELASTICSEARCH_URL='https://your-company-es.example.com' \
  --from-literal=TD_COMPANY_ELASTICSEARCH_INDEX='stocketablissement-production' \
  --from-literal=TD_COMPANY_ELASTICSEARCH_CACERT='' \
  --from-literal=TD_COMPANY_ELASTICSEARCH_IGNORE_SSL='false'

# Database credentials
kubectl create secret generic postgres-credentials -n trackdechets \
  --from-literal=username=trackdechets \
  --from-literal=password=$(openssl rand -base64 32)

kubectl create secret generic postgres-backup-credentials -n trackdechets \
  --from-literal=ACCESS_KEY_ID='your-backup-s3-key' \
  --from-literal=SECRET_ACCESS_KEY='your-backup-s3-secret'

kubectl create secret generic mongodb-secrets -n trackdechets \
  --from-literal=MONGODB_BACKUP_USER=backup \
  --from-literal=MONGODB_BACKUP_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=MONGODB_CLUSTER_ADMIN_USER=clusterAdmin \
  --from-literal=MONGODB_CLUSTER_ADMIN_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=MONGODB_CLUSTER_MONITOR_USER=clusterMonitor \
  --from-literal=MONGODB_CLUSTER_MONITOR_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=MONGODB_USER_ADMIN_USER=userAdmin \
  --from-literal=MONGODB_USER_ADMIN_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=MONGODB_DATABASE_ADMIN_USER=trackdechets \
  --from-literal=MONGODB_DATABASE_ADMIN_PASSWORD=$(openssl rand -base64 32)

kubectl create secret generic mongodb-backup-credentials -n trackdechets \
  --from-literal=AWS_ACCESS_KEY_ID='your-backup-s3-key' \
  --from-literal=AWS_SECRET_ACCESS_KEY='your-backup-s3-secret'
```

#### Option C: Use External Secrets Operator (RECOMMENDED for production)

```bash
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace

# Then create SecretStore and ExternalSecret resources
# See https://external-secrets.io/ for details
```

### Step 2: Build and Push Docker Images

```bash
# Build all apps using Nx
npx nx run-many --target=build --all

# Build and push Docker images
# Images are hosted on GitHub Container Registry
export REGISTRY="ghcr.io/trackdechets"

# UI
docker build -t $REGISTRY/ui:latest -f apps/ui/Dockerfile .
docker push $REGISTRY/ui:latest

# API
docker build -t $REGISTRY/api:latest -f apps/api/Dockerfile .
docker push $REGISTRY/api:latest

# Notifier
docker build -t $REGISTRY/notifier:latest -f apps/notifier/Dockerfile .
docker push $REGISTRY/notifier:latest

# Cron
docker build -t $REGISTRY/cron:latest -f apps/cron/Dockerfile .
docker push $REGISTRY/cron:latest

# Queue workers
docker build -t $REGISTRY/queues-runner:latest -f apps/queues-runner/Dockerfile .
docker push $REGISTRY/queues-runner:latest

docker build -t $REGISTRY/queues-indexation:latest -f apps/queues-indexation/Dockerfile .
docker push $REGISTRY/queues-indexation:latest

docker build -t $REGISTRY/queues-bulk-indexation:latest -f apps/queues-bulk-indexation/Dockerfile .
docker push $REGISTRY/queues-bulk-indexation:latest

docker build -t $REGISTRY/queues-bulk-indexation-master:latest -f apps/queues-bulk-indexation-master/Dockerfile .
docker push $REGISTRY/queues-bulk-indexation-master:latest

docker build -t $REGISTRY/queues-webhooks:latest -f apps/queues-webhooks/Dockerfile .
docker push $REGISTRY/queues-webhooks:latest

docker build -t $REGISTRY/queues-gerico:latest -f apps/queues-gerico/Dockerfile .
docker push $REGISTRY/queues-gerico:latest
```

### Step 3: Update Image References

The images are configured to use GitHub Container Registry (`ghcr.io/trackdechets`). No changes needed unless you want to use a different registry.

### Step 4: Deploy to Kubernetes

#### Development (Recette) Environment

```bash
kubectl apply -k kubernetes/overlays/dev
```

#### Staging (Sandbox) Environment

```bash
kubectl apply -k kubernetes/overlays/staging
```

#### Production Environment

```bash
kubectl apply -k kubernetes/overlays/production
```

### Step 5: Verify Deployment

```bash
# Check all resources
kubectl get all -n trackdechets

# Check databases
kubectl get clusters.postgresql.cnpg.io -n trackdechets
kubectl get elasticsearch -n trackdechets
kubectl get redisfailover -n trackdechets
kubectl get psmdb -n trackdechets

# Check application pods
kubectl get pods -n trackdechets -l app.kubernetes.io/component=backend
kubectl get pods -n trackdechets -l app.kubernetes.io/component=frontend
kubectl get pods -n trackdechets -l app.kubernetes.io/component=queue-worker

# Check Horizontal Pod Autoscalers
kubectl get hpa -n trackdechets

# View logs
kubectl logs -n trackdechets -l app=api --tail=100
kubectl logs -n trackdechets -l app=queues-indexation --tail=100
```

### Step 6: Run Database Migrations

````bash
# Once PostgreSQL is ready, run Prisma migrations
kubectl exec -n trackdechets deployment/api -- npx prisma migrate deploy

# Or create a Kubernetes Job for migrations (recommended)
Once PostgreSQL is ready, run Prisma migrations using the Kubernetes Job:

```bash
# Create and run the migration job
kubectl apply -f kubernetes/apps/prisma-migrate-job.yaml

# Check job status
kubectl get jobs -n trackdechets prisma-migrate

# View migration logs
kubectl logs -n trackdechets job/prisma-migrate

# Clean up completed job
kubectl delete job prisma-migrate -n trackdechets
````

Alternatively, run migrations directly in an API pod:

````bash
kubectl exec -n trackdechets deployment/api -- npx prisma migrate deploy# Get Ingress IP/Hostname

```bash
kubectl get ingress -n trackdechets
````

#### Configure DNS

Point your domains to the Ingress LoadBalancer IP:

- `app.trackdechets.beta.gouv.fr` → UI (Production)
- `api.trackdechets.beta.gouv.fr` → API
- `notifier.trackdechets.beta.gouv.fr` → Notifier

For dev/staging environments:

- Recette: `recette.trackdechets.fr`, `api.recette.trackdechets.fr`, `notifier.recette.trackdechets.fr`
- Sandbox: `sandbox.trackdechets.beta.gouv.fr`, `api.sandbox.trackdechets.beta.gouv.fr`, `notifier.sandbox.trackdechets.beta.gouv.fr`

#### Access locally (dev environment)

```bash
# Port forward for local testing
kubectl port-forward -n trackdechets-dev service/ui 3000:3000
kubectl port-forward -n trackdechets-dev service/api 4000:4000
kubectl port-forward -n trackdechets-dev service/notifier 82:82

# Then port-forward the ingress
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 80:80
```

## Scaling

app-

### Manual Scaling

Scale specific deployments:

```bash
# Scale API
kubectl scale deployment api -n trackdechets --replicas=5

# Scale bulk indexation workers during reindex
kubectl scale deployment queues-bulk-indexation -n trackdechets --replicas=10
```

### Automatic Scaling (HPA)

Horizontal Pod Autoscalers are configured for:

- **UI**: 2-5 replicas (70% CPU, 80% memory)
- **API**: 2-10 replicas (70% CPU, 80% memory)
- **Notifier**: 2-5 replicas (70% CPU, 80% memory)
- **Queue Workers**: 1-10 replicas each (75% CPU, 80% memory)

Adjust HPA settings:

````bash
kubectl edit hpa api -n trackdechets
```4 replicas (70% CPU, 80% memory)
- **Queue Workers**: 1-5
### Database Scaling

#### PostgreSQL (CloudNativePG)

```bash
# Scale cluster
kubectl patch cluster postgres -n trackdechets --type=merge -p '{"spec":{"instances":5}}'
````

#### Elasticsearch (ECK)

```bash
# Scale nodes
kubectl patch elasticsearch elasticsearch -n trackdechets --type=merge -p '{"spec":{"nodeSets":[{"name":"default","count":5}]}}'
```

## Monitoring

### Database Monitoring

#### PostgreSQL

```bash
# CloudNativePG exposes Prometheus metrics
kubectl get servicemonitor -n trackdechets

# Check cluster status
kubectl describe cluster postgres -n trackdechets
```

#### Elasticsearch

```bash
# Check cluster health
kubectl exec -n trackdechets elasticsearch-es-default-0 -- curl -s http://localhost:9200/_cluster/health | jq
```

#### Redis

```bash
# Check Redis status
kubectl exec -n trackdechets redis-0 -- redis-cli info replication
```

#### MongoDB

```bash
# Check replica set status
kubectl exec -n trackdechets mongodb-rs0-0 -- mongosh --eval "rs.status()"
```

### Application Monitoring

Add Prometheus ServiceMonitors for application metrics:

```bash
# Install Prometheus Operator (if not already installed)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

## Backup and Disaster Recovery

### PostgreSQL Backups

- Automated backups configured via CloudNativePG
- Daily backups to S3 (Scaleway Object Storage)
- 30-day retention policy
- Point-in-time recovery (PITR) supported

```bash
# Trigger manual backup
kubectl create -f - <<EOF
apiVersion: postgresql.cnpg.io/v1
kind: Backup
metadata:
  name: postgres-manual-backup-$(date +%Y%m%d-%H%M%S)
  namespace: trackdechets
spec:
  cluster:
    name: postgres
EOF

# List backups
kubectl get backups -n trackdechets
```

### MongoDB Backups

- Automated backups via Percona Operator
- Daily backups to S3 at 3 AM
- 7-day retention
- Point-in-time recovery enabled

```bash
# List backups
kubectl get psmdb-backup -n trackdechets
```

### Restore Procedures

See operator documentation:

- [CloudNativePG Recovery](https://cloudnative-pg.io/documentation/current/recovery/)
- [Percona MongoDB Restore](https://docs.percona.com/percona-operator-for-mongodb/backups-restore.html)

## Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n trackdechets

# Check logs
kubectl logs <pod-name> -n trackdechets

# Check events
kubectl get events -n trackdechets --sort-by='.lastTimestamp'
```

### Database connection issues

```bash
# Check database service
kubectl get svc -n trackdechets | grep postgres

# Test connection from API pod
kubectl exec -n trackdechets deployment/api -- nc -zv postgres-rw 5432
```

### Queue workers not processing

```bash
# Check Redis connection
kubectl exec -n trackdechets deployment/queues-runner -- nc -zv redis-master 6379

# Check queue logs
kubectl logs -n trackdechets -l app=queues-runner --tail=100 -f
```

### Elasticsearch not healthy

```bash
# Check cluster health
kubectl get elasticsearch -n trackdechets

# Check ES logs
kubectl logs -n trackdechets elasticsearch-es-default-0

# Increase heap size if needed (edit databases/elasticsearch.yaml)
```

## Maintenance

### Update application images

```bash
# Update image tag in kustomization.yaml
# Then apply
kubectl apply -k kubernetes/overlays/production

# Or use kubectl set image
kubectl set image deployment/api api=your-registry/trackdechets-api:v2.0.0 -n trackdechets
```

ghcr.io/mtes-mct/trackdechets/

### Database maintenance

#### PostgreSQL

```bash
# CloudNativePG handles automatic failover and maintenance
# To perform manual switchover:
kubectl cnpg promote postgres 1 -n trackdechets
```

### Cleanup old resources

```bash
# Clean up completed jobs
kubectl delete jobs -n trackdechets --field-selector status.successful=1

# Clean up evicted pods
kubectl delete pods -n trackdechets --field-selector status.phase=Failed
```

## Security Considerations

1. **Secrets Management**: Use External Secrets Operator or Sealed Secrets in production
2. **Network Policies**: NetworkPolicies are configured to restrict traffic
3. **RBAC**: Configure ServiceAccounts with minimal permissions
4. **Pod Security**: Containers run as non-root user (UID 1001)
5. **TLS**: Enable cert-manager and configure TLS in production
6. **Image Security**: Scan images with Trivy or Snyk
7. **Backup Encryption**: Ensure S3 backups are encrypted

## Performance Tuning

### Database Performance

#### PostgreSQL

- Adjust connection pool sizes in `postgresql.yaml`
- Tune PostgreSQL parameters for your workload
- Use PgBouncer for connection pooling (already configured)

#### Elasticsearch

- Increase JVM heap for larger datasets (currently 512MB)
- Add more nodes for better performance
- Adjust refresh interval based on indexing needs

#### Redis

- Monitor memory usage and adjust maxmemory policy
- Consider Redis Cluster for horizontal scaling (requires code changes)

### Application Performance

- Adjust HPA thresholds based on metrics
- Increase resource limits if pods are throttled
- Use Pod Topology Spread Constraints for better distribution

## Cost Optimization

1. **Dev/Staging**: Use single-instance databases (already configured in overlays)
2. **Autoscaling**: HPA automatically scales down during low traffic
3. **Storage**: Use appropriate StorageClasses (standard vs fast SSDs)
4. **Node Pools**: Use appropriate node sizes for different workloads
5. **Spot Instances**: Use for queue workers (they can tolerate interruptions)

## Support and Documentation

- [CloudNativePG Documentation](https://cloudnative-pg.io/documentation/)
- [Elastic Cloud on Kubernetes](https://www.elastic.co/guide/en/cloud-on-k8s/current/index.html)
- [Percona MongoDB Operator](https://docs.percona.com/percona-operator-for-mongodb/)
- [Redis Operator](https://github.com/spotahome/redis-operator)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)

## License

See LICENSE.txt in the root directory.
