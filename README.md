# Proxmox Cloud Reseller Platform – Frontend

A self-service cloud management portal built on [Proxmox VE](https://www.proxmox.com/en/proxmox-virtual-environment/overview), providing an AWS-like experience for cloud resellers and their end users.

## Architecture Overview

| Component | Technology |
|-----------|-----------|
| Frontend monorepo | React 18 + TypeScript 5, Vite, pnpm workspaces, Turborepo |
| Admin SPA | `apps/admin` – full cluster control plane |
| User SPA | `apps/user` – self-service instance management |
| Auth | OIDC SSO via [oidc-client-ts](https://github.com/authts/oidc-client-ts) + react-oidc-context |
| API Gateway | [Kong Gateway](https://konghq.com/) (DB-less, declarative) |
| Backend | Go microservices (Auth, VM, Billing, Monitoring, Notification, Storage) |
| Cache & Queue | Redis 7 (cache, streams, pub/sub) |
| Database | PostgreSQL 16 |
| Identity Provider | Keycloak (default) – any OIDC-compliant IdP supported |

See [SPEC.md](./SPEC.md) for the full technical specification.

## Repository Structure

```
proxmox-reseller-frontend/
├── apps/
│   ├── admin/          # Admin control-plane SPA  (port 3001 in dev)
│   └── user/           # End-user self-service SPA (port 3000 in dev)
├── packages/
│   ├── auth/           # OIDC authentication utilities
│   ├── api-client/     # Typed API client (Axios)
│   ├── ui/             # Shared React component library
│   └── tsconfig/       # Shared TypeScript configurations
├── infra/
│   ├── kong/           # Kong declarative configuration
│   └── docker/         # Docker Compose for local dev
├── .env.example        # Environment variable template
└── SPEC.md             # Full technical specification
```

## Prerequisites

- [Node.js](https://nodejs.org/) ≥ 20
- [pnpm](https://pnpm.io/) ≥ 9
- [Docker](https://www.docker.com/) + Docker Compose (for the local dev stack)

## Quick Start

### 1. Install dependencies

```bash
corepack enable
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Proxmox host credentials and SMTP settings

# Create per-app .env files
cp apps/admin/.env.example apps/admin/.env
cp apps/user/.env.example  apps/user/.env
```

### 3. Start the local infrastructure

```bash
cd infra/docker
docker compose up -d
```

This starts: **Kong**, **Redis**, **PostgreSQL**, and **Keycloak**.

Once Keycloak is running, create a realm named `cloud` and register two OIDC clients:
- `proxmox-admin` (for the admin SPA)
- `proxmox-user` (for the user SPA)

### 4. Start the frontend apps

```bash
# From the repo root – starts both apps in parallel
pnpm dev
```

| App | URL |
|-----|-----|
| User portal | http://localhost:3000 |
| Admin console | http://localhost:3001 |
| Kong proxy | http://localhost:8000 |
| Kong Admin API | http://localhost:8001 |
| Keycloak | http://localhost:8080 |

## Development Commands

```bash
# Build all apps and packages
pnpm build

# Type-check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Run all tests
pnpm test

# Clean all build artifacts
pnpm clean
```

## Environment Variables

See [`.env.example`](.env.example) for the full list.

### Per-app Vite variables

Create `apps/admin/.env` and `apps/user/.env`:

```dotenv
VITE_OIDC_AUTHORITY=http://localhost:8080/realms/cloud
VITE_OIDC_CLIENT_ID=proxmox-admin          # or proxmox-user
VITE_OIDC_REDIRECT_URI=http://localhost:3001/auth/callback
VITE_API_BASE_URL=http://localhost:8000/v1
```

## Authentication

Both SPAs implement the **OIDC Authorization Code + PKCE** flow:

1. Unauthenticated users are redirected to the configured IdP (Keycloak by default)
2. After login, the IdP redirects back with an `access_token` (JWT)
3. The token is stored **in memory only** (never localStorage)
4. Kong validates the JWT on every request using the IdP's JWKS endpoint
5. Tokens are silently refreshed before expiry

The `packages/auth` package provides `<AuthProvider>` and `useAuth()` hook used by both apps.

## Adding a New Backend Service

1. Create `services/<name>/` with a Go module and `Dockerfile`
2. Add a service entry to `infra/kong/kong.yml`
3. Add the service to `infra/docker/docker-compose.yml`
4. Export new API types from `packages/api-client/src/types.ts`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and ensure `pnpm build && pnpm test` pass
4. Open a pull request

## License

[GNU AGPL v3.0](./LICENSE)
