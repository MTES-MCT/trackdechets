# Deployment Checklist

Use this checklist when deploying Trackdéchets to a new Kubernetes cluster.

## Pre-Deployment

### Cluster Setup

- [ ] Kubernetes cluster is running (v1.25+)
- [ ] `kubectl` is configured and can access the cluster
- [ ] Sufficient resources available (see OVERVIEW.md for requirements)
- [ ] StorageClass is available (e.g., `standard`)
- [ ] LoadBalancer service type is supported (for Ingress)

### Tools Installed

- [ ] `kubectl` installed and configured
- [ ] `kustomize` installed (or use `kubectl apply -k`)
- [ ] `helm` installed (for operators)
- [ ] Docker installed (for building images)
- [ ] `git` installed

### External Services

- [ ] S3-compatible storage configured (Scaleway Object Storage)
- [ ] S3 buckets created:
  - [ ] `trackdechets` (main bucket)
  - [ ] `trackdechets-registry-errors`
  - [ ] `trackdechets-registry-imports`
  - [ ] `trackdechets-registry-exports`
  - [ ] `trackdechets-texs-analysis`
  - [ ] `trackdechets-registry-models`
  - [ ] `trackdechets-registry-exhaustive-exports`
  - [ ] `trackdechets-bsd-templates`
  - [ ] `trackdechets-postgres-backups` (for database backups)
  - [ ] `trackdechets-mongodb-backups` (for MongoDB backups)
- [ ] S3 access keys generated
- [ ] Domain names registered and DNS configured
- [ ] Sendinblue account configured (for emails)
- [ ] INSEE API credentials obtained
- [ ] Sentry DSN configured (optional, for error tracking)
- [ ] Gotenberg service available (for PDF generation)

## Operator Installation

- [ ] CloudNativePG operator installed
  ```bash
  kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.22/releases/cnpg-1.22.0.yaml
  ```
- [ ] ECK operator installed
  ```bash
  kubectl create -f https://download.elastic.co/downloads/eck/2.11.0/crds.yaml
  kubectl apply -f https://download.elastic.co/downloads/eck/2.11.0/operator.yaml
  ```
- [ ] Redis operator installed
  ```bash
  kubectl apply -f https://raw.githubusercontent.com/spotahome/redis-operator/master/manifests/databases.spotahome.com_redisfailovers.yaml
  kubectl apply -f https://raw.githubusercontent.com/spotahome/redis-operator/master/example/operator.yaml
  ```
- [ ] Percona MongoDB operator installed
  ```bash
  kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/main/deploy/bundle.yaml
  ```
- [ ] Nginx Ingress Controller installed
  ```bash
  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
  helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace
  ```
- [ ] Cert-Manager installed (optional, for TLS)
  ```bash
  kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
  ```

## Configuration

### Secrets

- [ ] Generated strong passwords for:
  - [ ] `API_TOKEN_SECRET` (use `openssl rand -base64 32`)
  - [ ] `SESSION_SECRET` (use `openssl rand -base64 32`)
  - [ ] `WEBHOOK_TOKEN_ENCRYPTION_KEY` (exactly 32 characters)
  - [ ] PostgreSQL user password
  - [ ] MongoDB user password
- [ ] Configured external service credentials:
  - [ ] Sendinblue API key
  - [ ] INSEE API credentials (client ID, secret, username, password)
  - [ ] S3 access key and secret
  - [ ] Gotenberg token
  - [ ] Sentry DSN
  - [ ] Queue monitor token
- [ ] Created Kubernetes secrets (see README.md Step 1)
- [ ] Verified secrets are NOT committed to git

### Configuration Files

- [ ] Updated `kubernetes/overlays/*/kustomization.yaml`:
  - [ ] Image registry URLs (replace `your-registry`)
  - [ ] Image tags (replace `latest` with specific versions in production)
  - [ ] Domain names (if different from beta.gouv.fr)
- [ ] Updated `kubernetes/base/configmap.yaml` (if needed)
- [ ] Reviewed `kubernetes/base/resourcequota.yaml` (adjust if needed)
- [ ] Reviewed `kubernetes/base/limitrange.yaml` (adjust if needed)

### Database Backups

- [ ] Updated PostgreSQL backup S3 credentials
- [ ] Updated MongoDB backup S3 credentials
- [ ] Verified backup buckets exist
- [ ] Configured backup retention policies

## Image Build and Push

- [ ] Built all Nx projects: `npx nx run-many --target=build --all`
- [ ] Set registry environment variable: `export REGISTRY=your-registry.example.com/trackdechets`
- [ ] Built and pushed all Docker images:
  - [ ] ui
  - [ ] api
  - [ ] notifier
  - [ ] cron
  - [ ] queues-runner
  - [ ] queues-indexation
  - [ ] queues-bulk-indexation
  - [ ] queues-bulk-indexation-master
  - [ ] queues-webhooks
  - [ ] queues-gerico
- [ ] Verified images are accessible from Kubernetes cluster

## Deployment

### Choose Environment

- [ ] Development (Recette): `kubectl apply -k kubernetes/overlays/dev`
- [ ] Staging (Sandbox): `kubectl apply -k kubernetes/overlays/staging`
- [ ] Production: `kubectl apply -k kubernetes/overlays/production`

### Verify Deployment

- [ ] Namespace created: `kubectl get namespace trackdechets`
- [ ] ConfigMaps created: `kubectl get configmap -n trackdechets`
- [ ] Secrets created: `kubectl get secret -n trackdechets`
- [ ] Databases are ready:
  - [ ] PostgreSQL: `kubectl get cluster postgres -n trackdechets`
  - [ ] Elasticsearch: `kubectl get elasticsearch -n trackdechets`
  - [ ] Redis: `kubectl get redisfailover redis -n trackdechets`
  - [ ] MongoDB: `kubectl get psmdb mongodb -n trackdechets`
- [ ] All pods are running: `kubectl get pods -n trackdechets`
- [ ] Deployments are ready: `kubectl get deployments -n trackdechets`
- [ ] HPAs are active: `kubectl get hpa -n trackdechets`
- [ ] Services are created: `kubectl get svc -n trackdechets`
- [ ] Ingress is configured: `kubectl get ingress -n trackdechets`

## Post-Deployment

### Database Initialization

- [ ] Waited for PostgreSQL to be fully ready (3/3 instances)
- [ ] Ran Prisma migrations: `./kubernetes/scripts/migrate.sh`
- [ ] Verified migrations succeeded
- [ ] Elasticsearch index created (bsds alias)
- [ ] MongoDB replica set initialized

### Verification

- [ ] UI is accessible via browser
- [ ] API health check passes: `curl https://api.example.com/.well-known/apollo/server-health`
- [ ] Notifier SSE endpoint works
- [ ] Database connections work (check API logs)
- [ ] Queue workers are processing jobs (check logs)
- [ ] Cron jobs are scheduled

### DNS and TLS

- [ ] DNS records point to LoadBalancer IP
- [ ] TLS certificates issued (if using cert-manager)
- [ ] HTTPS redirects work
- [ ] All domains resolve correctly:
  - [ ] UI domain
  - [ ] API domain
  - [ ] Notifier domain

### Monitoring

- [ ] Prometheus is scraping metrics (if installed)
- [ ] Grafana dashboards configured (if installed)
- [ ] Logs are being collected
- [ ] Alerts are configured (if applicable)

### Backup Verification

- [ ] PostgreSQL backup job ran successfully
- [ ] MongoDB backup job ran successfully
- [ ] Backups are visible in S3 buckets
- [ ] Backup retention policies are working

### Performance Testing

- [ ] Load test performed (optional)
- [ ] Autoscaling tested (increase load, verify pods scale up)
- [ ] Database performance acceptable
- [ ] Queue processing performance acceptable

## Security Review

- [ ] All secrets are properly configured (no `changeme` values)
- [ ] NetworkPolicies are in place
- [ ] Pods run as non-root
- [ ] TLS is enabled for production
- [ ] RBAC is configured (if applicable)
- [ ] Image vulnerability scanning performed
- [ ] Database backups are encrypted
- [ ] S3 buckets have proper access controls

## Documentation

- [ ] Deployment date recorded
- [ ] Configuration documented
- [ ] Access credentials stored securely (password manager)
- [ ] Runbook created for common operations
- [ ] Team members trained on deployment

## Rollback Plan

- [ ] Previous version images tagged and available
- [ ] Database backup taken before deployment
- [ ] Rollback procedure documented
- [ ] Tested rollback in staging environment

## Production-Specific

Only for production deployments:

- [ ] Change management ticket created
- [ ] Deployment window scheduled
- [ ] Stakeholders notified
- [ ] Maintenance page ready (if needed)
- [ ] Monitoring team alerted
- [ ] 24/7 on-call support arranged
- [ ] Disaster recovery plan reviewed
- [ ] SLA requirements documented
- [ ] Compliance requirements met (GDPR, etc.)

## Post-Deployment Monitoring (First 24 Hours)

- [ ] Monitor pod health every hour
- [ ] Check error logs regularly
- [ ] Verify queue processing rates
- [ ] Monitor database performance
- [ ] Check autoscaling behavior
- [ ] Verify backup jobs run successfully
- [ ] Monitor resource usage (CPU, memory, storage)
- [ ] Check for any error alerts

## Sign-Off

- [ ] Deployment completed successfully
- [ ] All verification steps passed
- [ ] No critical errors in logs
- [ ] Performance meets expectations
- [ ] Deployment documented

**Deployed by:** **\*\*\*\***\_**\*\*\*\***  
**Date:** **\*\*\*\***\_**\*\*\*\***  
**Environment:** [ ] Dev [ ] Staging [ ] Production  
**Version/Tag:** **\*\*\*\***\_**\*\*\*\***  
**Notes:** **\*\*\*\***\_**\*\*\*\***
