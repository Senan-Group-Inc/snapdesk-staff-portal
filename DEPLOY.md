# SnapDesk Staff Portal — deployment

Senan team **control plane**: manage organisations (tenant SnapDesk), staff/roles,
and provision GLPI engine logins.

Production runs a **pre-built image** from GitHub Container Registry on the shared
network `servicedesk_net`. Servers **pull** the image — they do **not** run `docker build`.

## Image

| Tag | When |
|-----|------|
| `ghcr.io/senan-group-inc/snapdesk-staff-portal:main` | Push to `main` |
| `:latest` | Same as `main` |
| `:sha-<short>` | Every build |
| `:v1.2.3` | Git tags `v*` |

`NEXT_PUBLIC_*` values are **baked at image build time** (Next.js inlines them).
Update the build-args in `.github/workflows/build-prod-image.yml` if API / domain /
GLPI URLs change, then rebuild.

## Prerequisites

- Docker + Compose on the host
- Caddy (or another reverse proxy) on `servicedesk_net`
- GHCR login if the package is private (`read:packages`)

```bash
docker network create servicedesk_net   # once, if missing
echo YOUR_GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

## Deploy (Dokploy / compose)

1. Wait for **Actions → Build production image** to finish on `main`.
2. Point the panel at this repo’s `docker-compose.prod.yml` (no `build:` section).
3. Optional env:

```bash
STAFF_PORTAL_IMAGE=ghcr.io/senan-group-inc/snapdesk-staff-portal
STAFF_PORTAL_IMAGE_TAG=main
```

4. Attach Caddy to `servicedesk_net` and route e.g. `admin.snapdesk…` →
   `snapdesk-staff-portal:3000`.

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Local production image (optional)

```bash
docker compose -f docker-compose.build.yml build
docker compose -f docker-compose.build.yml up -d
# http://localhost:3001
```

## Local development

```bash
npm install
cp .env.example .env.local   # edit as needed
npm run dev                  # http://localhost:3001
```

Or: `docker compose up` (hot reload on `:3001`).

## Related services

| Service | Role |
|---------|------|
| `snapdesk-backend` | API (`/api/v1/staff/...`) |
| `snapdesk-frontend` | Tenant client UI |
| `servicedesk-glpi` | ITSM engine |
| **this app** | Senan admin portal |

Point the client frontend’s staff-portal URL at this app’s public origin
(e.g. `VITE_STAFF_PORTAL_URL=https://admin.…`).
