# Namespace Migration Guide

## Overview

We've restructured the Kubernetes setup to use **separate namespaces** for frontend and backend components. This provides better security isolation and follows Kubernetes best practices.

## New Namespace Structure

- **`trackdechets-frontend`**: UI deployment only
- **`trackdechets-backend`**: API, workers, cron, databases, and all backend services

## Benefits of Separate Namespaces

1. **Security Isolation**: Frontend pods cannot access backend secrets even if compromised
2. **RBAC Boundaries**: Namespace-scoped RBAC policies
3. **Network Policies**: More granular network isolation
4. **Resource Management**: Separate resource quotas and limits
5. **Operational Clarity**: Clear separation of concerns

## Migration Steps

### 1. Update Scaleway Credentials Secrets

The Kubernetes secrets containing Scaleway credentials need to be created in the appropriate namespaces:

```bash
# Frontend credentials in frontend namespace
kubectl create secret generic scw-frontend-credentials \
  -n trackdechets-frontend \
  --from-literal=access-key='YOUR_FRONTEND_ACCESS_KEY' \
  --from-literal=secret-key='YOUR_FRONTEND_SECRET_KEY'

# Backend credentials in backend namespace
kubectl create secret generic scw-backend-credentials \
  -n trackdechets-backend \
  --from-literal=access-key='YOUR_BACKEND_ACCESS_KEY' \
  --from-literal=secret-key='YOUR_BACKEND_SECRET_KEY'
```

### 2. Apply New Namespace Structure

```bash
# Apply frontend resources
kubectl apply -k kubernetes/base/frontend-kustomization.yaml

# Apply backend resources
kubectl apply -k kubernetes/base/backend-kustomization.yaml
```

Or apply individually:

```bash
# Create namespaces
kubectl apply -f kubernetes/base/namespaces.yaml

# Apply frontend resources
kubectl apply -f kubernetes/base/frontend-configmap.yaml
kubectl apply -f kubernetes/base/frontend-resourcequota.yaml
kubectl apply -f kubernetes/base/frontend-limitrange.yaml
kubectl apply -f kubernetes/external-secrets/frontend-secretstore.yaml
kubectl apply -f kubernetes/external-secrets/frontend-externalsecret.yaml
kubectl apply -f kubernetes/apps/ui.yaml
kubectl apply -f kubernetes/ingress/ingress.yaml

# Apply backend resources
kubectl apply -f kubernetes/base/backend-configmap.yaml
kubectl apply -f kubernetes/base/backend-resourcequota.yaml
kubectl apply -f kubernetes/base/backend-limitrange.yaml
kubectl apply -f kubernetes/external-secrets/backend-secretstore.yaml
kubectl apply -f kubernetes/external-secrets/backend-externalsecret.yaml
kubectl apply -f kubernetes/databases/
kubectl apply -f kubernetes/apps/api.yaml
kubectl apply -f kubernetes/apps/notifier.yaml
kubectl apply -f kubernetes/apps/cron.yaml
kubectl apply -f kubernetes/apps/queue-workers.yaml
```

### 3. Verify Cross-Namespace Communication

Frontend pods need to communicate with backend services. Services are accessible across namespaces using FQDN:

```
http://api.trackdechets-backend.svc.cluster.local:4000
```

The UI deployment has been updated to use this format for `API_ENDPOINT`.

### 4. Clean Up Old Namespace

Once everything is verified and working:

```bash
# Delete old resources from trackdechets namespace (if they exist)
kubectl delete namespace trackdechets
```

**Warning**: Only do this after verifying all services are working in the new namespaces!

## Service Discovery Across Namespaces

Services in different namespaces are accessible using the FQDN format:

```
<service-name>.<namespace>.svc.cluster.local
```

Examples:
- `api.trackdechets-backend.svc.cluster.local:4000` - API service
- `notifier.trackdechets-backend.svc.cluster.local:82` - Notifier service
- `postgres-rw.trackdechets-backend.svc.cluster.local:5432` - PostgreSQL service

## Network Policies

New NetworkPolicies have been created:

1. **`allow-ingress-frontend`** (frontend namespace): Allows ingress traffic to UI
2. **`allow-ingress-backend`** (backend namespace): Allows ingress traffic to API/Notifier
3. **`allow-frontend-to-backend`** (backend namespace): Allows frontend pods to reach backend services
4. **`allow-internal-backend`** (backend namespace): Allows internal backend communication

## Troubleshooting

### Services Not Accessible

If frontend can't reach backend:

1. Check NetworkPolicies:
   ```bash
   kubectl get networkpolicies -n trackdechets-backend
   kubectl describe networkpolicy allow-frontend-to-backend -n trackdechets-backend
   ```

2. Test connectivity:
   ```bash
   kubectl run -it --rm debug --image=curlimages/curl --restart=Never \
     -n trackdechets-frontend \
     -- curl http://api.trackdechets-backend.svc.cluster.local:4000/.well-known/apollo/server-health
   ```

### Secrets Not Syncing

1. Verify ExternalSecrets are in correct namespaces:
   ```bash
   kubectl get externalsecret -n trackdechets-frontend
   kubectl get externalsecret -n trackdechets-backend
   ```

2. Check SecretStore status:
   ```bash
   kubectl describe secretstore -n trackdechets-frontend
   kubectl describe secretstore -n trackdechets-backend
   ```

### Ingress Not Working

Ingress can reference services across namespaces. Verify:

```bash
kubectl describe ingress -n trackdechets-frontend
```

The backend services should be referenced with their namespace.

## Rollback Plan

If you need to rollback to the single namespace:

1. Keep the old `trackdechets` namespace resources
2. Update deployments to use `trackdechets` namespace
3. Update service references to not use FQDN
4. Revert NetworkPolicies

## References

- [Kubernetes Namespaces](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)
- [Cross-Namespace Service Discovery](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/#namespaces-of-services)
