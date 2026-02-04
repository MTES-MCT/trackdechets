# Quick Setup Guide for External Secrets

This is a quick reference guide. For detailed documentation, see [README.md](./README.md).

## Prerequisites Checklist

- [ ] External Secrets Operator installed in cluster
- [ ] Scaleway Secret Manager enabled
- [ ] Two Scaleway IAM application users created (frontend + backend)
- [ ] Secrets created in Scaleway Secret Manager

## Step-by-Step Setup

### 1. Create Scaleway IAM Application Users

In Scaleway Console → IAM → Application Users:

**Frontend User:**

- Name: `trackdechets-frontend-secrets`
- Permissions: `SecretManagerReadOnly`, `SecretManagerSecretAccess`
- IAM Policy (optional but recommended):
  ```json
  {
    "Effect": "Allow",
    "Action": ["secretmanager:ReadSecret", "secretmanager:AccessSecret"],
    "Resource": "arn:scw:secretmanager:fr-par:*:secret/trackdechets-frontend/*"
  }
  ```

**Backend User:**

- Name: `trackdechets-backend-secrets`
- Permissions: `SecretManagerReadOnly`, `SecretManagerSecretAccess`
- IAM Policy (optional but recommended):
  ```json
  {
    "Effect": "Allow",
    "Action": ["secretmanager:ReadSecret", "secretmanager:AccessSecret"],
    "Resource": "arn:scw:secretmanager:fr-par:*:secret/trackdechets-backend/*"
  }
  ```

### 2. Create Secrets in Scaleway Secret Manager

Using Scaleway CLI or Console, create secrets:

```bash
# Frontend secrets (minimal)
scw secret-manager secret create name=trackdechets-frontend/api-endpoint \
  data="http://api:4000" \
  project-id=YOUR_PROJECT_ID

# Backend secrets (all sensitive data)
scw secret-manager secret create name=trackdechets-backend/database-url \
  data="postgresql://user:pass@host:5432/db" \
  project-id=YOUR_PROJECT_ID

scw secret-manager secret create name=trackdechets-backend/redis-url \
  data="redis://host:6379" \
  project-id=YOUR_PROJECT_ID

# ... create all other backend secrets
```

**Important**: Secret names must match exactly what's in `backend-externalsecret.yaml` and `frontend-externalsecret.yaml`.

### 3. Create Kubernetes Secrets with Scaleway Credentials

```bash
# Get access keys from Scaleway IAM application users
# Frontend credentials (in frontend namespace)
kubectl create secret generic scw-frontend-credentials \
  -n trackdechets-frontend \
  --from-literal=access-key='YOUR_FRONTEND_ACCESS_KEY' \
  --from-literal=secret-key='YOUR_FRONTEND_SECRET_KEY'

# Backend credentials (in backend namespace)
kubectl create secret generic scw-backend-credentials \
  -n trackdechets-backend \
  --from-literal=access-key='YOUR_BACKEND_ACCESS_KEY' \
  --from-literal=secret-key='YOUR_BACKEND_SECRET_KEY'
```

**Important**: Secrets must be created in the same namespace as the SecretStore that references them.

### 4. Update SecretStore Configuration

Edit `frontend-secretstore.yaml` and `backend-secretstore.yaml`:

```yaml
spec:
  provider:
    scaleway:
      region: fr-par # Your Scaleway region
      projectId: "YOUR_SCALEWAY_PROJECT_ID" # Update this!
```

### 5. Apply External Secrets Resources

```bash
# Apply all external secrets resources
# Each resource specifies its namespace in the metadata
kubectl apply -f kubernetes/external-secrets/

# Or apply individually if needed:
kubectl apply -f kubernetes/external-secrets/frontend-secretstore.yaml
kubectl apply -f kubernetes/external-secrets/frontend-externalsecret.yaml
kubectl apply -f kubernetes/external-secrets/backend-secretstore.yaml
kubectl apply -f kubernetes/external-secrets/backend-externalsecret.yaml
```

**Note**: Resources are automatically created in their respective namespaces (`trackdechets-frontend` and `trackdechets-backend`) as specified in each file's metadata.

### 6. Verify Secrets Are Synced

```bash
# Check SecretStore status (in respective namespaces)
kubectl get secretstore -n trackdechets-frontend
kubectl get secretstore -n trackdechets-backend
kubectl describe secretstore frontend-secretstore -n trackdechets-frontend
kubectl describe secretstore backend-secretstore -n trackdechets-backend

# Check ExternalSecret status (in respective namespaces)
kubectl get externalsecret -n trackdechets-frontend
kubectl get externalsecret -n trackdechets-backend
kubectl describe externalsecret frontend-secrets -n trackdechets-frontend
kubectl describe externalsecret backend-secrets -n trackdechets-backend

# Check that Kubernetes secrets were created
kubectl get secrets -n trackdechets-frontend frontend-secrets
kubectl get secrets -n trackdechets-backend backend-secrets

# View secret contents (base64 encoded)
kubectl get secret frontend-secrets -n trackdechets-frontend -o yaml
kubectl get secret backend-secrets -n trackdechets-backend -o yaml
```

### 7. Verify Pods Can Access Secrets

```bash
# Check if pods are starting correctly (in respective namespaces)
kubectl get pods -n trackdechets-frontend
kubectl get pods -n trackdechets-backend

# Check pod logs for any secret-related errors
kubectl logs -n trackdechets-frontend deployment/ui
kubectl logs -n trackdechets-backend deployment/api

# Verify environment variables are set
kubectl exec -n trackdechets-frontend deployment/ui -- env | grep API_ENDPOINT
kubectl exec -n trackdechets-backend deployment/api -- env | grep DATABASE_URL
```

## Troubleshooting

### ExternalSecret shows "SecretSyncedError"

1. Check ExternalSecret status:

   ```bash
   kubectl describe externalsecret backend-secrets -n trackdechets-backend
   ```

2. Check External Secrets Operator logs:

   ```bash
   kubectl logs -n external-secrets-system -l app.kubernetes.io/name=external-secrets --tail=100
   ```

3. Verify:
   - Secret exists in Scaleway Secret Manager
   - Secret name matches exactly (case-sensitive)
   - IAM user has permissions
   - Scaleway credentials in Kubernetes secret are correct

### SecretStore shows "InvalidProvider"

1. Check SecretStore status:

   ```bash
   kubectl describe secretstore backend-secretstore -n trackdechets-backend
   ```

2. Verify:
   - Kubernetes secret `scw-backend-credentials` exists
   - Contains `access-key` and `secret-key` keys
   - Credentials are valid
   - Project ID and region are correct

### Pods failing to start

1. Check if secrets exist:

   ```bash
   kubectl get secrets -n trackdechets-frontend frontend-secrets
   kubectl get secrets -n trackdechets-backend backend-secrets
   ```

2. If secrets don't exist, check ExternalSecret sync status (see above)

3. If secrets exist but pods fail, check:
   - Required environment variables are present in the secret
   - Secret keys match what the application expects

## Migration from trackdechets-secrets

Once everything is working:

1. **Test thoroughly** in dev/staging environments
2. **Verify** all pods are running correctly
3. **Monitor** for any errors
4. **Remove** old `trackdechets-secrets` secret (if it exists in the old namespace):
   ```bash
   # Only if you still have the old single namespace setup
   kubectl delete secret trackdechets-secrets -n trackdechets
   ```

## Security Notes

- **Never commit** Scaleway access keys to git
- **Rotate** access keys regularly (every 90 days recommended)
- **Use IAM policies** to restrict secret access by path
- **Monitor** secret access in Scaleway audit logs
- **Consider** using Sealed Secrets for the Kubernetes secrets containing Scaleway credentials
