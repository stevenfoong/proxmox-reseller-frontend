# Proxmox Cloud Reseller Platform – Technical Specification

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Microservices Architecture](#4-backend-microservices-architecture)
5. [API Gateway (Kong)](#5-api-gateway-kong)
6. [Authentication & OIDC SSO](#6-authentication--oidc-sso)
7. [Caching & Queueing (Redis)](#7-caching--queueing-redis)
8. [Data Models](#8-data-models)
9. [API Specification](#9-api-specification)
10. [Infrastructure & Deployment](#10-infrastructure--deployment)
11. [Security Considerations](#11-security-considerations)
12. [Scalability & Performance](#12-scalability--performance)

---

## 1. Overview

The **Proxmox Cloud Reseller Platform** is a self-service cloud management portal—analogous to AWS Console—built on top of a Proxmox Virtual Environment (PVE) cluster. It exposes cloud-like infrastructure services (VMs, containers, storage, networking) to end users through a polished web UI, while giving administrators full control over resource allocation, billing, and user management.

### Goals

| Goal | Description |
|------|-------------|
| Self-service portal | End users can provision, manage, and monitor their own VMs/containers |
| Admin control plane | Administrators manage users, quotas, billing plans, and Proxmox nodes |
| Multi-tenancy | Strict resource isolation between tenants |
| OIDC SSO | Single sign-on via any standards-compliant identity provider |
| High availability | Horizontally scalable microservices, API gateway, and caching layer |
| Extensibility | Microservice architecture lets individual functions scale independently |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser / Mobile                            │
│              ┌──────────────┐     ┌──────────────┐                  │
│              │  Admin SPA   │     │   User SPA   │                  │
│              │ (React + TS) │     │ (React + TS) │                  │
│              └──────┬───────┘     └──────┬───────┘                  │
└─────────────────────┼────────────────────┼──────────────────────────┘
                       │  HTTPS             │  HTTPS
┌─────────────────────▼────────────────────▼──────────────────────────┐
│                    Kong API Gateway                                  │
│   • Route matching          • JWT / OIDC token validation            │
│   • Rate limiting           • Request/response transformation        │
│   • Plugin ecosystem        • Load balancing                         │
└──────┬──────────┬───────────┬────────────┬────────────┬─────────────┘
       │          │           │            │            │
  ┌────▼───┐ ┌───▼────┐ ┌────▼───┐ ┌─────▼──┐ ┌──────▼─────┐
  │ Auth   │ │  VM    │ │ Billing│ │Monitor-│ │ Notify-    │
  │Service │ │Service │ │Service │ │ ing    │ │ ication    │
  │(Go)    │ │(Go)    │ │(Go)    │ │Service │ │ Service    │
  └────┬───┘ └───┬────┘ └────┬───┘ └─────┬──┘ └──────┬─────┘
       │          │           │            │            │
  ┌────▼──────────▼───────────▼────────────▼────────────▼─────────────┐
  │                    Internal Message Bus (Redis Streams)             │
  └────────────────────────────────────┬──────────────────────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │  Proxmox VE API    │
                              │  (REST + WebSocket)│
                              └─────────┬──────────┘
                                        │
                              ┌─────────▼─────────┐
                              │  Proxmox Cluster   │
                              │  (PVE nodes)       │
                              └───────────────────┘
```

### Technology Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript 5, Vite, pnpm monorepo, Turborepo |
| State management | Zustand + React Query (TanStack Query) |
| UI library | Ant Design / Tailwind CSS |
| Authentication | OIDC / OAuth 2.0 (oidc-client-ts) |
| API Gateway | Kong Gateway (OSS) |
| Backend language | Go 1.22 |
| Backend framework | Fiber v2 / Chi router |
| Service mesh | Docker Compose (dev) / Kubernetes (prod) |
| Cache | Redis 7 (cache + pub/sub + streams) |
| Database | PostgreSQL 16 (primary), Redis (ephemeral) |
| Message bus | Redis Streams |
| Proxmox API | Proxmox VE REST API v2 |
| Container runtime | Docker / containerd |
| Observability | Prometheus + Grafana, OpenTelemetry |

---

## 3. Frontend Architecture

### 3.1 Monorepo Structure

```
proxmox-reseller-frontend/
├── apps/
│   ├── admin/                  # Admin control-plane SPA
│   │   ├── src/
│   │   │   ├── app/            # App entry, router, providers
│   │   │   ├── features/       # Feature-based modules
│   │   │   │   ├── dashboard/
│   │   │   │   ├── users/
│   │   │   │   ├── nodes/
│   │   │   │   ├── billing/
│   │   │   │   └── settings/
│   │   │   ├── layouts/
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── user/                   # End-user self-service SPA
│       ├── src/
│       │   ├── app/
│       │   ├── features/
│       │   │   ├── dashboard/
│       │   │   ├── instances/  # VM / container management
│       │   │   ├── storage/
│       │   │   ├── network/
│       │   │   └── billing/
│       │   ├── layouts/
│       │   └── main.tsx
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── ui/                     # Shared React component library
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── auth/                   # OIDC authentication utilities
│   │   ├── src/
│   │   │   ├── OidcProvider.tsx
│   │   │   ├── useAuth.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── api-client/             # Generated API client (Kong → services)
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── tsconfig/               # Shared TypeScript configurations
│       ├── base.json
│       ├── react.json
│       └── package.json
│
├── infra/
│   ├── kong/
│   │   ├── kong.yml             # Kong declarative config
│   │   └── plugins/
│   ├── docker/
│   │   └── docker-compose.yml
│   └── k8s/                    # Kubernetes manifests
│
├── package.json                # Root workspace package.json
├── pnpm-workspace.yaml
├── turbo.json
└── SPEC.md
```

### 3.2 Admin Application Features

| Feature | Description |
|---------|-------------|
| Dashboard | Cluster health, resource utilization, active users, revenue metrics |
| User Management | Create/update/deactivate users, assign billing plans, impersonate |
| Node Management | Proxmox node status, resource allocation, maintenance mode |
| VM / Container Oversight | List all instances across tenants, live console access |
| Billing Plans | Define CPU/RAM/disk quotas and pricing tiers |
| Audit Logs | Immutable activity log with filtering and export |
| Settings | OIDC configuration, Kong plugin settings, notification channels |

### 3.3 User Application Features

| Feature | Description |
|---------|-------------|
| Dashboard | Resource overview, spend summary, recent activity |
| Instances | Create/start/stop/delete VMs and LXC containers, VNC/SPICE console |
| Storage | Manage disks, snapshots, backups, ISO images |
| Networking | Manage virtual networks, firewalls, floating IPs |
| Billing | Current usage, invoices, payment methods |
| API Keys | Generate personal API tokens for automation |
| Profile | Account settings, SSH keys, 2FA enrollment |

### 3.4 State Management

```
┌──────────────────────────────────────────────────────┐
│ React Query (server state)                           │
│   • API data fetching, caching, background refresh   │
│   • Optimistic updates for VM operations             │
│   • WebSocket subscriptions for live metrics         │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│ Zustand (client state)                               │
│   • Auth session (user, roles, tokens)               │
│   • UI preferences (theme, sidebar collapsed)        │
│   • Notification queue                               │
└──────────────────────────────────────────────────────┘
```

### 3.5 OIDC SSO Integration

The frontend uses **oidc-client-ts** to implement the Authorization Code + PKCE flow:

```
Browser                    Kong                   Identity Provider
   │                         │                           │
   │  GET /auth/login         │                           │
   ├────────────────────────►│                           │
   │  302 → IdP /authorize   │                           │
   │◄────────────────────────┤                           │
   │                         │                           │
   │  Redirect to IdP login  │                           │
   ├────────────────────────────────────────────────────►│
   │  id_token + auth code   │                           │
   │◄────────────────────────────────────────────────────┤
   │                         │                           │
   │  POST /auth/callback    │                           │
   ├────────────────────────►│ Kong validates token      │
   │  JWT (access_token)     │                           │
   │◄────────────────────────┤                           │
   │                         │                           │
   │  Subsequent API calls with Bearer <access_token>    │
   ├────────────────────────►│ Kong verifies JWT         │
```

#### Supported Identity Providers

- Keycloak (recommended, self-hosted)
- Auth0
- Azure AD / Microsoft Entra ID
- Google Workspace
- Any OIDC-compliant provider

#### OIDC Configuration (per app)

```typescript
// packages/auth/src/config.ts
export interface OidcConfig {
  authority: string;          // IdP well-known endpoint base URL
  client_id: string;          // Registered client ID
  redirect_uri: string;       // Post-login callback URL
  post_logout_redirect_uri: string;
  scope: string;              // "openid profile email"
  response_type: 'code';
  // PKCE is enabled by default in oidc-client-ts
}
```

---

## 4. Backend Microservices Architecture

Each service is an independent Go binary with its own database schema (if needed) and communicates via:
- **Synchronous**: REST over HTTP (internal) / gRPC (for performance-critical paths)
- **Asynchronous**: Redis Streams for event-driven workflows

### 4.1 Services

#### Auth Service (`/services/auth`)

| Responsibility | Detail |
|----------------|--------|
| OIDC token validation | Introspect/verify tokens from IdP |
| Session management | Issue and revoke internal JWTs |
| Role-based access | Map OIDC claims to internal roles (`admin`, `user`) |
| API key management | Create, hash, and validate personal API keys |

**Endpoints**

```
POST   /auth/token/verify
POST   /auth/token/refresh
POST   /auth/apikeys
DELETE /auth/apikeys/{key_id}
GET    /auth/apikeys
```

#### VM Service (`/services/vm`)

| Responsibility | Detail |
|----------------|--------|
| VM lifecycle | Create, start, stop, reboot, delete VMs (QEMU) |
| LXC lifecycle | Create and manage Linux containers |
| Console proxy | WebSocket proxy to Proxmox VNC/SPICE |
| Templates | Manage VM templates and cloud-init images |
| Snapshots | Create, restore, delete snapshots |

**Endpoints**

```
GET    /vms
POST   /vms
GET    /vms/{id}
PUT    /vms/{id}
DELETE /vms/{id}
POST   /vms/{id}/start
POST   /vms/{id}/stop
POST   /vms/{id}/reboot
GET    /vms/{id}/console  (WebSocket upgrade)
GET    /vms/{id}/metrics
POST   /vms/{id}/snapshots
GET    /vms/{id}/snapshots
DELETE /vms/{id}/snapshots/{snap}
```

#### Billing Service (`/services/billing`)

| Responsibility | Detail |
|----------------|--------|
| Plans | Define resource quotas and pricing tiers |
| Metering | Track per-tenant resource usage (hourly) |
| Invoicing | Generate and store monthly invoices |
| Quotas | Enforce resource limits before provisioning |

**Endpoints**

```
GET    /billing/plans
POST   /billing/plans          (admin)
GET    /billing/usage
GET    /billing/invoices
GET    /billing/invoices/{id}
```

#### Monitoring Service (`/services/monitoring`)

| Responsibility | Detail |
|----------------|--------|
| Metrics proxy | Aggregate Proxmox node and VM metrics |
| Alerts | Define and evaluate alert rules |
| Websocket push | Push real-time metrics to frontend |

**Endpoints**

```
GET    /monitoring/nodes
GET    /monitoring/nodes/{id}/metrics  (WebSocket)
GET    /monitoring/vms/{id}/metrics    (WebSocket)
GET    /monitoring/alerts
POST   /monitoring/alerts
```

#### Notification Service (`/services/notification`)

| Responsibility | Detail |
|----------------|--------|
| Email | Send transactional emails via SMTP/SendGrid |
| Webhooks | Deliver events to user-defined HTTP endpoints |
| In-app | Store and serve in-app notification feed |

**Endpoints**

```
GET    /notifications
PUT    /notifications/{id}/read
DELETE /notifications/{id}
POST   /notifications/webhooks
```

#### Storage Service (`/services/storage`)

| Responsibility | Detail |
|----------------|--------|
| Disk management | Attach/detach/resize disks |
| ISO management | Upload and manage ISO images |
| Backup | Schedule and restore backups |

**Endpoints**

```
GET    /storage/disks
POST   /storage/disks
DELETE /storage/disks/{id}
GET    /storage/isos
POST   /storage/isos/upload
GET    /storage/backups
POST   /storage/backups
POST   /storage/backups/{id}/restore
```

### 4.2 Inter-Service Events (Redis Streams)

| Stream | Publisher | Consumers |
|--------|-----------|-----------|
| `vm.created` | VM Service | Billing, Monitoring, Notification |
| `vm.deleted` | VM Service | Billing, Monitoring |
| `vm.state_changed` | VM Service | Monitoring, Notification |
| `user.created` | Auth Service | Billing, Notification |
| `invoice.generated` | Billing Service | Notification |
| `alert.fired` | Monitoring Service | Notification |

---

## 5. API Gateway (Kong)

Kong Gateway OSS is deployed as the single entry point for all API traffic.

### 5.1 Route Configuration

```yaml
# infra/kong/kong.yml (declarative config)

_format_version: "3.0"

services:
  - name: auth-service
    url: http://auth-service:8080
    routes:
      - name: auth-routes
        paths: ["/auth"]
        strip_path: false

  - name: vm-service
    url: http://vm-service:8080
    routes:
      - name: vm-routes
        paths: ["/vms", "/containers"]
        strip_path: false

  - name: billing-service
    url: http://billing-service:8080
    routes:
      - name: billing-routes
        paths: ["/billing"]
        strip_path: false

  - name: monitoring-service
    url: http://monitoring-service:8080
    routes:
      - name: monitoring-routes
        paths: ["/monitoring"]
        strip_path: false

  - name: notification-service
    url: http://notification-service:8080
    routes:
      - name: notification-routes
        paths: ["/notifications"]
        strip_path: false

  - name: storage-service
    url: http://storage-service:8080
    routes:
      - name: storage-routes
        paths: ["/storage"]
        strip_path: false

plugins:
  - name: jwt                   # JWT verification on all routes
    config:
      secret_is_base64: false
      key_claim_name: sub

  - name: rate-limiting
    config:
      minute: 300
      policy: redis
      redis_host: redis
      redis_port: 6379

  - name: cors
    config:
      origins:
        - "https://admin.example.com"
        - "https://cloud.example.com"
      methods: [GET, POST, PUT, PATCH, DELETE, OPTIONS]
      headers: [Authorization, Content-Type, X-Request-ID]

  - name: request-id
    config:
      header_name: X-Request-ID
      echo_downstream: true

  - name: prometheus            # Metrics endpoint for Prometheus scraping
```

### 5.2 Kong Plugins Used

| Plugin | Purpose |
|--------|---------|
| `jwt` | Validate OIDC access tokens (RS256) |
| `oidc` (community) | Full OIDC flow including token introspection |
| `rate-limiting` | Per-user rate limits stored in Redis |
| `cors` | Cross-origin request handling |
| `request-id` | Inject correlation IDs for tracing |
| `prometheus` | Export metrics for Prometheus |
| `response-transformer` | Standardize error response format |
| `acl` | Role-based access at gateway level |

---

## 6. Authentication & OIDC SSO

### 6.1 Token Flow

1. User visits Admin/User SPA → redirected to IdP login page
2. IdP returns `id_token` (user info) and `access_token` (API authorization)
3. Frontend stores tokens in memory (not localStorage) using **oidc-client-ts**
4. Every API request includes `Authorization: Bearer <access_token>`
5. Kong verifies the JWT signature against the IdP's JWKS endpoint
6. Kong forwards the request with added headers (`X-User-ID`, `X-User-Roles`)
7. Microservices trust Kong-injected headers (no re-validation needed)

### 6.2 Roles & Claims

| Role | OIDC Claim Value | Access |
|------|-----------------|--------|
| `admin` | `roles: ["admin"]` | Full access to all services + admin endpoints |
| `user` | `roles: ["user"]` | Scoped to own tenant resources |
| `billing-admin` | `roles: ["billing-admin"]` | Billing plan management |

### 6.3 Token Refresh

- **Silent refresh** via hidden iframe (oidc-client-ts built-in)
- Access token lifetime: **15 minutes**
- Refresh token lifetime: **7 days** (configurable in IdP)
- On 401 from API: automatic token refresh, then retry original request

### 6.4 Session Security

- Tokens stored in **memory only** (not persisted to localStorage/sessionStorage)
- PKCE (Proof Key for Code Exchange) mandatory
- `state` and `nonce` parameters validated on callback
- CSRF protection via SameSite cookies for session cookies

---

## 7. Caching & Queueing (Redis)

Redis serves three distinct purposes in this architecture.

### 7.1 Cache (Redis)

| Cache Key Pattern | TTL | Description |
|-------------------|-----|-------------|
| `node:metrics:{node_id}` | 15s | Proxmox node CPU/RAM/disk metrics |
| `vm:list:{tenant_id}` | 30s | Tenant VM list |
| `vm:status:{vm_id}` | 10s | Individual VM status |
| `billing:usage:{tenant_id}:{month}` | 5m | Aggregated usage for billing period |
| `user:{user_id}` | 5m | User profile data |
| `plan:{plan_id}` | 10m | Billing plan details |

Kong's rate-limiting plugin also uses Redis to track per-user request counts with sliding-window counters.

### 7.2 Message Queue / Event Bus (Redis Streams)

Each service group consumes from its relevant streams using **consumer groups** to ensure at-least-once delivery:

```
Stream: vm.events
  ├── Consumer group: billing-service
  ├── Consumer group: monitoring-service
  └── Consumer group: notification-service

Stream: user.events
  ├── Consumer group: billing-service
  └── Consumer group: notification-service
```

### 7.3 Real-time Push (Redis Pub/Sub)

The Monitoring Service publishes VM/node metrics to Redis channels. The WebSocket handler subscribes and forwards to connected browser clients:

```
Publisher: monitoring-service → PUBLISH vm.metrics.{vm_id} <json_payload>
Subscriber: websocket-handler → forwards to browser via WebSocket
```

---

## 8. Data Models

### 8.1 User

```typescript
interface User {
  id: string;           // UUID
  email: string;
  name: string;
  roles: Role[];        // ["admin"] | ["user"]
  tenantId: string;
  planId: string;
  oidcSub: string;      // Subject claim from IdP
  createdAt: string;    // ISO 8601
  updatedAt: string;
  deletedAt?: string;
}
```

### 8.2 VirtualMachine

```typescript
interface VirtualMachine {
  id: string;           // UUID (internal)
  vmId: number;         // Proxmox VMID
  name: string;
  tenantId: string;
  nodeId: string;       // Proxmox node name
  status: 'running' | 'stopped' | 'paused' | 'error';
  type: 'qemu' | 'lxc';
  config: {
    cores: number;
    memory: number;     // MiB
    disk: number;       // GiB
    os: string;
    template: string;
    sshKeys?: string[];
    cloudInitUser?: string;
  };
  ipAddresses: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 8.3 BillingPlan

```typescript
interface BillingPlan {
  id: string;
  name: string;
  description: string;
  pricing: {
    cpuPerCore: number;       // $ per vCPU per hour
    memoryPerGib: number;     // $ per GiB per hour
    storagePerGib: number;    // $ per GiB per hour
    networkPerGib: number;    // $ per GiB egress
  };
  limits: {
    maxVMs: number;
    maxCores: number;
    maxMemoryGib: number;
    maxStorageGib: number;
  };
  createdAt: string;
}
```

### 8.4 Invoice

```typescript
interface Invoice {
  id: string;
  tenantId: string;
  period: string;       // "2024-01" (YYYY-MM)
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;     // "USD"
  status: 'draft' | 'issued' | 'paid' | 'overdue';
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
}
```

---

## 9. API Specification

### 9.1 Standard Response Envelope

All API responses follow a consistent JSON envelope:

**Success**
```json
{
  "data": { ... },
  "meta": {
    "requestId": "01J...",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

**Paginated list**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 142,
    "totalPages": 8
  },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

**Error**
```json
{
  "error": {
    "code": "VM_NOT_FOUND",
    "message": "Virtual machine with ID 'abc123' was not found.",
    "details": {}
  },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

### 9.2 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET / PUT / PATCH |
| 201 | Successful POST (resource created) |
| 202 | Accepted (async operation started) |
| 204 | Successful DELETE |
| 400 | Validation error |
| 401 | Missing or invalid token |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (resource already exists) |
| 422 | Business rule violation (e.g., quota exceeded) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Proxmox API unavailable |

### 9.3 Versioning

APIs are versioned via URL path prefix: `/v1/vms`, `/v2/vms`.

Kong routes include the version prefix and strips it before forwarding to services.

### 9.4 OpenAPI Specification Location

Each service maintains its own OpenAPI 3.1 spec at:
```
/services/{service-name}/api/openapi.yaml
```

A merged spec for the Kong gateway is generated at build time:
```
/infra/kong/openapi-merged.yaml
```

---

## 10. Infrastructure & Deployment

### 10.1 Local Development (Docker Compose)

```yaml
# infra/docker/docker-compose.yml

services:
  kong:
    image: kong:3.6
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /etc/kong/kong.yml
      KONG_PROXY_LISTEN: "0.0.0.0:8000"
      KONG_ADMIN_LISTEN: "0.0.0.0:8001"
    ports: ["8000:8000", "8001:8001"]
    volumes:
      - ../kong/kong.yml:/etc/kong/kong.yml

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --appendonly yes

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: proxmox_reseller
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports: ["5432:5432"]
    volumes:
      - postgres_data:/var/lib/postgresql/data

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    command: start-dev
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: app
      KC_DB_PASSWORD: ${DB_PASSWORD}
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    ports: ["8080:8080"]
    depends_on: [postgres]

  auth-service:
    build: ../../services/auth
    ports: ["8180:8080"]
    depends_on: [redis, postgres]

  vm-service:
    build: ../../services/vm
    ports: ["8181:8080"]
    depends_on: [redis, auth-service]

  billing-service:
    build: ../../services/billing
    ports: ["8182:8080"]
    depends_on: [redis, postgres]

  monitoring-service:
    build: ../../services/monitoring
    ports: ["8183:8080"]
    depends_on: [redis]

  notification-service:
    build: ../../services/notification
    ports: ["8184:8080"]
    depends_on: [redis]

  storage-service:
    build: ../../services/storage
    ports: ["8185:8080"]
    depends_on: [redis]

volumes:
  postgres_data:
```

### 10.2 Production Kubernetes (High-Level)

Each service is deployed as a Kubernetes `Deployment` with:
- **HorizontalPodAutoscaler** (CPU + custom Prometheus metrics)
- **PodDisruptionBudget** for zero-downtime upgrades
- **ConfigMap** / **Secret** for configuration
- **NetworkPolicy** for inter-service traffic control

Kong is deployed using the **Kong Ingress Controller** on Kubernetes.

### 10.3 CI/CD Pipeline

```
Developer push → GitHub Actions
  ├── Lint & type-check (frontend)
  ├── Unit tests (frontend + backend)
  ├── Integration tests (docker-compose up)
  ├── Build Docker images
  ├── Push to registry
  └── Deploy to staging (kubectl apply)
        └── Smoke tests → Deploy to production
```

---

## 11. Security Considerations

### 11.1 Network Security

- All external traffic must go through Kong (no direct service exposure)
- Internal services communicate over a private Docker/Kubernetes network
- mTLS between services in production (via Kubernetes service mesh, e.g., Linkerd)
- Kong enforces HTTPS-only; HTTP redirects to HTTPS

### 11.2 Token Security

- Access tokens stored in memory only (never in localStorage)
- HttpOnly, Secure, SameSite=Strict cookies for session binding
- PKCE enforced for all OIDC flows
- Token introspection endpoint called on first request, then cached

### 11.3 Data Security

- All database connections use TLS
- Passwords and secrets managed via Kubernetes Secrets / HashiCorp Vault
- Proxmox API credentials stored encrypted in Vault, injected at runtime
- Database columns containing sensitive data (e.g., API keys) stored as bcrypt hashes

### 11.4 Tenant Isolation

- Every API call includes `tenant_id` extracted from validated JWT
- Services filter all queries by `tenant_id`
- Proxmox resources tagged with tenant ID; VM Service enforces ownership checks
- Admin endpoints protected by `role: admin` ACL in Kong

### 11.5 Rate Limiting

- Global rate limit: 300 req/min per user (Kong)
- Proxmox API calls rate-limited internally to prevent cluster overload
- Redis-backed counters ensure limits are enforced across multiple Kong replicas

---

## 12. Scalability & Performance

### 12.1 Frontend

- Code-split per route (Vite dynamic imports)
- CDN delivery (Cloudflare / AWS CloudFront) for static assets
- React Query caches API responses, minimizing redundant requests
- Optimistic UI updates for common operations (start/stop VM)

### 12.2 Backend

| Service | Scaling Trigger |
|---------|----------------|
| VM Service | Proxmox API call latency > 500ms, or queue depth |
| Billing Service | Background job queue depth |
| Monitoring Service | WebSocket connection count |
| Notification Service | Email/webhook delivery queue depth |
| Auth Service | Token validation latency |

### 12.3 Redis

- Redis Cluster (3 primaries + 3 replicas) in production
- Separate Redis instances for cache and streams (different eviction policies)
- Cache: `allkeys-lru` eviction; Streams: `noeviction`

### 12.4 Database

- PostgreSQL with read replicas for reporting queries (billing, audit logs)
- Connection pooling via PgBouncer
- Partitioned tables for time-series data (usage metrics, audit logs)

---

## Appendix A: Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_OIDC_AUTHORITY` | IdP authority URL | `https://keycloak.example.com/realms/cloud` |
| `VITE_OIDC_CLIENT_ID` | OIDC client ID | `proxmox-admin` |
| `VITE_API_BASE_URL` | Kong gateway URL | `https://api.example.com/v1` |
| `KONG_DB` | Kong DB mode | `off` (declarative) |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `DATABASE_URL` | PostgreSQL DSN | `postgres://app:pass@postgres/proxmox_reseller` |
| `PROXMOX_HOST` | Proxmox API host | `https://pve.internal:8006` |
| `PROXMOX_TOKEN_ID` | Proxmox API token ID | `root@pam!monitoring` |
| `PROXMOX_TOKEN_SECRET` | Proxmox API token secret | (from Vault) |
| `JWT_PUBLIC_KEY_URL` | JWKS endpoint for token validation | `https://keycloak.example.com/realms/cloud/protocol/openid-connect/certs` |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| PVE | Proxmox Virtual Environment |
| VMID | Proxmox internal integer ID for a VM or container |
| LXC | Linux Container (lightweight container in Proxmox) |
| QEMU | VM type in Proxmox (full virtualization) |
| OIDC | OpenID Connect – identity layer on top of OAuth 2.0 |
| PKCE | Proof Key for Code Exchange – OAuth security extension |
| Kong | Open-source API gateway |
| Tenant | An individual end-user account with isolated resources |
| SPA | Single Page Application |
| JWKS | JSON Web Key Set – public keys for JWT verification |
