# SnapDesk Staff Portal

Senan **admin platform** for SnapDesk:

- Manage organisations that use the tenant frontend
- Manage Senan team staff + roles
- Provision matching GLPI logins for the service desk engine

Talks only to the SnapDesk API (`/api/v1/staff/...`). Never calls GLPI from the browser.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

- App: http://localhost:3001  
- Routes: `/admin/login`, `/admin/organisations`, `/admin/staff`, …

## Docker

**Dev** (hot reload):

```bash
docker compose up
```

**Production** (pull GHCR image — preferred on servers):

See [DEPLOY.md](./DEPLOY.md).

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

**Optional local prod build:**

```bash
docker compose -f docker-compose.build.yml up -d --build
```

## Relation to other apps

| App | Audience |
|-----|----------|
| `snapdesk-frontend` | Tenant users |
| **staff-portal** (this) | Senan operators |
| `servicedesk-glpi` | Engine UI (techs provisioned from here) |
| `snapdesk-backend` | Shared API |

Configure the client app with the public URL of this portal
(`VITE_STAFF_PORTAL_URL` / equivalent).
