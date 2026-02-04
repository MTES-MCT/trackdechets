# External Secrets Architecture

## Overview

This setup implements **segregated secrets management** using Scaleway Secret Manager and External Secrets Operator. The goal is to limit the attack surface by ensuring frontend pods cannot access backend secrets.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Scaleway Secret Manager                      │
├──────────────────────────┬──────────────────────────────────────┤
│  Frontend Secrets         │  Backend Secrets                    │
│  (trackdechets-frontend/*)│  (trackdechets-backend/*)           │
│  - api-endpoint           │  - database-url                      │
│  - sentry-dsn (optional)  │  - redis-url                         │
│                          │  - api-token-secret                  │
│                          │  - s3-credentials                    │
│                          │  - ... (all sensitive data)          │
└──────────────────────────┴──────────────────────────────────────┘
                            │
                            │ IAM Authentication
                            │ (Different credentials per store)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  trackdechets-frontend namespace                                │
├──────────────────────────┬──────────────────────────────────────┤
│  Frontend SecretStore     │  Frontend ExternalSecret            │
│  - Uses:                 │  - Creates:                          │
│    scw-frontend-credentials│    frontend-secrets              │
│  - IAM User:             │  - Contains:                         │
│    trackdechets-frontend │    API_ENDPOINT                      │
│    -secrets              │    SENTRY_DSN                        │
└──────────────────────────┴──────────────────────────────────────┘
                            │
                            │ Mounted as env vars
                            ▼
                    ┌───────────────┐
                    │  Frontend Pod │
                    │  - ui         │
                    └───────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  trackdechets-backend namespace                                 │
├──────────────────────────┬──────────────────────────────────────┤
│  Backend SecretStore      │  Backend ExternalSecret             │
│  - Uses:                 │  - Creates:                          │
│    scw-backend-credentials│    backend-secrets                  │
│  - IAM User:             │  - Contains:                         │
│    trackdechets-backend  │    DATABASE_URL                       │
│    -secrets              │    REDIS_URL                          │
│                          │    API_TOKEN_SECRET                   │
│                          │    ... (all backend env vars)        │
└──────────────────────────┴──────────────────────────────────────┘
                            │
                            │ Mounted as env vars
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend Pods                                                  │
│  - api                                                          │
│  - notifier                                                     │
│  - cron                                                         │
│  - queues-runner                                                │
│  - queues-indexation                                            │
│  - ... (all queue workers)                                      │
│  - postgres, redis, mongodb, elasticsearch (databases)         │
└─────────────────────────────────────────────────────────────────┘
```

## Namespace Isolation

The architecture uses **separate Kubernetes namespaces** for additional security:

- **`trackdechets-frontend`**: Contains only UI pods and frontend secrets
- **`trackdechets-backend`**: Contains all backend services, workers, and databases

This provides:

- **Namespace-level RBAC**: Different permissions per namespace
- **Network isolation**: NetworkPolicies can restrict cross-namespace traffic
- **Secret isolation**: Frontend pods cannot access backend secrets even if RBAC allows it
- **Resource quotas**: Separate resource limits per namespace

## Security Model

### Principle of Least Privilege

1. **Separate IAM Users**: Frontend and backend use completely different Scaleway IAM credentials
2. **Path-Based Access Control**: IAM policies restrict access to specific secret paths
3. **No Cross-Access**: Frontend pods cannot access backend secrets even if compromised

### Attack Surface Reduction

**Before (Single Secret):**

- If any pod is compromised → All secrets are accessible
- Frontend pods have access to database credentials, API keys, etc.

**After (Segregated Secrets):**

- If frontend pod is compromised → Only frontend secrets accessible (minimal impact)
- If backend pod is compromised → Only backend secrets accessible (contained)

### Defense in Depth

1. **IAM Level**: Scaleway IAM policies restrict secret access
2. **Kubernetes Level**: Different Kubernetes secrets for frontend/backend
3. **Application Level**: Pods only mount the secrets they need

## Components

### 1. SecretStores

**Purpose**: Define how to authenticate to Scaleway Secret Manager

- `frontend-secretstore`: Uses frontend IAM credentials
- `backend-secretstore`: Uses backend IAM credentials

**Configuration**:

- Region (e.g., `fr-par`)
- Project ID
- Authentication via Kubernetes secret containing access keys

### 2. ExternalSecrets

**Purpose**: Define which secrets to fetch and how to map them

- `frontend-externalsecret`: Fetches frontend secrets → Creates `frontend-secrets` Kubernetes secret
- `backend-externalsecret`: Fetches backend secrets → Creates `backend-secrets` Kubernetes secret

**Features**:

- Automatic refresh (default: 1 hour)
- Maps Scaleway secret names to Kubernetes secret keys
- Supports JSON secrets with gjson syntax

### 3. Kubernetes Secrets

**Purpose**: Store synced secrets for pod consumption

- `frontend-secrets`: Contains only frontend environment variables
- `backend-secrets`: Contains all backend environment variables

**Lifecycle**: Managed by External Secrets Operator (auto-synced)

### 4. Pod Deployments

**Frontend Pods** (`ui.yaml`):

- Mount: `frontend-secrets`
- Access: Only frontend configuration

**Backend Pods** (`api.yaml`, `queue-workers.yaml`, etc.):

- Mount: `backend-secrets`
- Access: All backend secrets

## Secret Organization in Scaleway

### Naming Convention

```
trackdechets-frontend/<secret-name>
trackdechets-backend/<secret-name>
```

### Example Structure

**Frontend:**

- `trackdechets-frontend/api-endpoint`
- `trackdechets-frontend/sentry-dsn`

**Backend:**

- `trackdechets-backend/database-url`
- `trackdechets-backend/redis-url`
- `trackdechets-backend/api-token-secret`
- `trackdechets-backend/s3-access-key-id`
- `trackdechets-backend/s3-secret-access-key`
- ... (all other backend secrets)

## IAM Policy Example

### Frontend IAM User Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretmanager:ReadSecret", "secretmanager:AccessSecret"],
      "Resource": "arn:scw:secretmanager:fr-par:*:secret/trackdechets-frontend/*"
    },
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "arn:scw:secretmanager:fr-par:*:secret/trackdechets-backend/*"
    }
  ]
}
```

### Backend IAM User Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretmanager:ReadSecret", "secretmanager:AccessSecret"],
      "Resource": "arn:scw:secretmanager:fr-par:*:secret/trackdechets-backend/*"
    },
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "arn:scw:secretmanager:fr-par:*:secret/trackdechets-frontend/*"
    }
  ]
}
```

## Benefits

1. **Security**: Reduced attack surface through secret segregation
2. **Compliance**: Better audit trail (know which component accessed which secrets)
3. **Maintainability**: Clear separation of concerns
4. **Scalability**: Easy to add new components with their own secret stores
5. **Flexibility**: Can rotate credentials independently per component

## Limitations & Considerations

1. **Initial Setup Complexity**: Requires creating IAM users and organizing secrets
2. **Secret Refresh**: Secrets are refreshed every hour (configurable)
3. **Scaleway Dependency**: Requires Scaleway Secret Manager service
4. **Credential Storage**: Kubernetes secrets containing Scaleway credentials need protection (consider Sealed Secrets)

## Future Enhancements

1. **Workload Identity**: If Scaleway supports it, use workload identity instead of storing credentials
2. **Secret Rotation**: Automate secret rotation in Scaleway
3. **Audit Logging**: Set up alerts for unusual secret access patterns
4. **Additional Segregation**: Further split backend secrets (e.g., database secrets separate from API keys)

## References

- [External Secrets Operator](https://external-secrets.io/)
- [Scaleway Secret Manager Provider](https://external-secrets.io/latest/provider/scaleway/)
- [Kubernetes Secrets Best Practices](https://kubernetes.io/docs/concepts/security/secrets-good-practices/)
