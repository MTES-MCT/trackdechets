# External Secrets Setup with Scaleway Secret Manager

This directory contains the configuration for using Scaleway Secret Manager with the External Secrets Operator to manage secrets in Kubernetes.

## Architecture Overview

We use a **segregated secrets approach** with **separate Kubernetes namespaces** to limit the attack surface:

- **Frontend (UI) pods** in `trackdechets-frontend` namespace → Access only frontend-specific secrets via `frontend-secretstore`
- **Backend (API, workers, cron, etc.) pods** in `trackdechets-backend` namespace → Access only backend-specific secrets via `backend-secretstore`

Each SecretStore uses different Scaleway IAM credentials, and the namespace separation provides an additional security boundary, ensuring that if a frontend pod is compromised, it cannot access backend secrets.

## Prerequisites

1. **Scaleway Secret Manager** with secrets created
2. **External Secrets Operator** installed in your cluster
3. **Two Scaleway IAM Application Users** (one for frontend, one for backend)

## Setup Instructions

### Step 1: Create Scaleway IAM Application Users

Create two separate IAM application users in Scaleway:

1. **Frontend Application User** (`trackdechets-frontend-secrets`)

   - Permissions: `SecretManagerReadOnly` + `SecretManagerSecretAccess`
   - Scope: Only secrets prefixed with `trackdechets-frontend/` or specific frontend secret names

2. **Backend Application User** (`trackdechets-backend-secrets`)
   - Permissions: `SecretManagerReadOnly` + `SecretManagerSecretAccess`
   - Scope: Only secrets prefixed with `trackdechets-backend/` or specific backend secret names

**Best Practice**: Use IAM policies to restrict access:

- Frontend user can only read secrets matching pattern: `trackdechets-frontend/*`
- Backend user can only read secrets matching pattern: `trackdechets-backend/*`

### Step 2: Create Secrets in Scaleway Secret Manager

Organize your secrets in Scaleway Secret Manager:

#### Frontend Secrets (minimal, public-facing config only)

- `trackdechets-frontend/api-endpoint` - API endpoint URL
- `trackdechets-frontend/sentry-dsn` - Sentry DSN (optional, for error tracking)
- Any other frontend-specific non-sensitive configuration

#### Backend Secrets (all sensitive data)

- `trackdechets-backend/database-url` - PostgreSQL connection string
- `trackdechets-backend/redis-url` - Redis connection string
- `trackdechets-backend/mongo-url` - MongoDB connection string
- `trackdechets-backend/elasticsearch-url` - Elasticsearch URL
- `trackdechets-backend/api-token-secret` - API token secret
- `trackdechets-backend/session-secret` - Session secret
- `trackdechets-backend/webhook-token-encryption-key` - Webhook encryption key
- `trackdechets-backend/sib-apikey` - SendInBlue API key
- `trackdechets-backend/insee-*` - INSEE API credentials
- `trackdechets-backend/s3-*` - S3 credentials
- `trackdechets-backend/gotenberg-*` - Gotenberg credentials
- `trackdechets-backend/td-company-elasticsearch-*` - Company search credentials
- And all other backend secrets

**Note**: You can also use JSON secrets in Scaleway and reference specific fields using gjson syntax.

### Step 3: Create Kubernetes Secrets with Scaleway Credentials

Create Kubernetes secrets containing the Scaleway access keys for each application user in their respective namespaces:

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

**Important**: Secrets must be created in the same namespace as the SecretStore that references them.

**Security Note**: These Kubernetes secrets contain the Scaleway credentials. Consider using:

- Sealed Secrets for encrypting these credentials
- Or store them in a separate secret management system
- Or use Scaleway's Workload Identity (if available) to avoid storing credentials

### Step 4: Configure SecretStores

The SecretStores define how to connect to Scaleway Secret Manager:

- `frontend-secretstore.yaml` - Uses `scw-frontend-credentials` Kubernetes secret
- `backend-secretstore.yaml` - Uses `scw-backend-credentials` Kubernetes secret

Update the `projectId` and `region` in each SecretStore to match your Scaleway project.

### Step 5: Configure ExternalSecrets

The ExternalSecrets define which secrets to fetch from Scaleway:

- `frontend-externalsecret.yaml` - Fetches frontend secrets
- `backend-externalsecret.yaml` - Fetches backend secrets

Each ExternalSecret creates a Kubernetes Secret that pods can reference.

### Step 6: Update Deployments

The deployments have already been updated to use the appropriate secrets in their respective namespaces:

- **Frontend pods** (`ui.yaml` in `trackdechets-frontend` namespace) → Use `frontend-secrets` (created by `frontend-externalsecret`)
- **Backend pods** (`api.yaml`, `queue-workers.yaml`, etc. in `trackdechets-backend` namespace) → Use `backend-secrets` (created by `backend-externalsecret`)

**Note**: The namespace separation means frontend pods cannot access backend secrets even if they tried, providing an additional security layer beyond just secret segregation.

## Installation

1. Install External Secrets Operator (if not already installed):

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm install external-secrets \
  external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace \
  --set installCRDs=true
```

2. Create Scaleway credentials secrets (see Step 3 above)

3. Apply the SecretStores and ExternalSecrets:

```bash
# Apply all external secrets resources
# Note: Each resource specifies its namespace in the metadata
kubectl apply -f kubernetes/external-secrets/

# Or apply individually:
kubectl apply -f kubernetes/external-secrets/frontend-secretstore.yaml
kubectl apply -f kubernetes/external-secrets/frontend-externalsecret.yaml
kubectl apply -f kubernetes/external-secrets/backend-secretstore.yaml
kubectl apply -f kubernetes/external-secrets/backend-externalsecret.yaml
```

**Note**: The resources are configured with their respective namespaces (`trackdechets-frontend` and `trackdechets-backend`) in the metadata, so they will be created in the correct namespaces automatically.

4. Verify secrets are synced:

```bash
# Check SecretStore status (in respective namespaces)
kubectl get secretstore -n trackdechets-frontend
kubectl get secretstore -n trackdechets-backend

# Check ExternalSecret status (in respective namespaces)
kubectl get externalsecret -n trackdechets-frontend
kubectl get externalsecret -n trackdechets-backend

# Check that Kubernetes secrets were created
kubectl get secrets -n trackdechets-frontend frontend-secrets
kubectl get secrets -n trackdechets-backend backend-secrets

# View ExternalSecret sync status
kubectl describe externalsecret frontend-secrets -n trackdechets-frontend
kubectl describe externalsecret backend-secrets -n trackdechets-backend
```

5. Update your deployments to reference the new secrets (see deployment files)

## Secret Naming Convention

In Scaleway Secret Manager, use this naming convention:

- Frontend: `trackdechets-frontend/<secret-name>`
- Backend: `trackdechets-backend/<secret-name>`

This makes it easy to:

- Apply IAM policies based on path prefixes
- Organize secrets logically
- Understand which secrets belong to which component

## Troubleshooting

### Secrets not syncing

1. Check ExternalSecret status:

   ```bash
   # For frontend secrets
   kubectl describe externalsecret frontend-secrets -n trackdechets-frontend
   # For backend secrets
   kubectl describe externalsecret backend-secrets -n trackdechets-backend
   ```

2. Check External Secrets Operator logs:

   ```bash
   kubectl logs -n external-secrets-system -l app.kubernetes.io/name=external-secrets
   ```

3. Verify Scaleway credentials:

   ```bash
   kubectl get secret scw-frontend-credentials -n trackdechets-frontend -o yaml
   kubectl get secret scw-backend-credentials -n trackdechets-backend -o yaml
   ```

4. Verify SecretStore configuration:
   ```bash
   kubectl describe secretstore frontend-secretstore -n trackdechets-frontend
   kubectl describe secretstore backend-secretstore -n trackdechets-backend
   ```

### IAM Permission Issues

If you see permission errors:

1. Verify IAM user has `SecretManagerReadOnly` and `SecretManagerSecretAccess` permissions
2. Check IAM policies restrict access to the correct secret paths
3. Verify secret names in Scaleway match those in ExternalSecret resources

### Secret Not Found

If a secret is not found:

1. Verify the secret exists in Scaleway Secret Manager
2. Check the secret name/path matches exactly (case-sensitive)
3. Verify the IAM user has access to that specific secret

## Security Best Practices

1. **Principle of Least Privilege**: Each IAM user should only have access to secrets it needs
2. **Separate Credentials**: Never reuse the same IAM credentials for frontend and backend
3. **Namespace Isolation**: Frontend and backend are in separate namespaces, providing additional security boundaries
4. **Regular Rotation**: Rotate Scaleway access keys regularly
5. **Audit Logging**: Enable audit logs in Scaleway to track secret access
6. **Network Policies**: Use Kubernetes NetworkPolicies to restrict pod-to-pod communication (already configured)
7. **RBAC**: Ensure only authorized users can view/modify SecretStores and ExternalSecrets (namespace-scoped)

## Migration from Existing Secrets

To migrate from existing Kubernetes secrets:

1. **Create namespaces** (if not already created):

   ```bash
   kubectl apply -f kubernetes/base/namespaces.yaml
   ```

2. Create secrets in Scaleway Secret Manager

3. Create SecretStores and ExternalSecrets in their respective namespaces

4. Create Scaleway credential secrets in the correct namespaces (see Step 3)

5. Verify secrets are synced correctly:

   ```bash
   kubectl get externalsecret -n trackdechets-frontend
   kubectl get externalsecret -n trackdechets-backend
   ```

6. Deploy applications to their respective namespaces (already configured)

7. Test thoroughly in dev/staging

8. Roll out to production

9. Remove old Kubernetes secrets from the old namespace (if migrating from single namespace):
   ```bash
   kubectl delete secret trackdechets-secrets -n trackdechets  # Only if old namespace exists
   ```

## References

- [External Secrets Operator Documentation](https://external-secrets.io/)
- [Scaleway Secret Manager Provider](https://external-secrets.io/latest/provider/scaleway/)
- [Scaleway Secret Manager Documentation](https://www.scaleway.com/en/docs/secret-manager/)
