# SnapDesk Frontend API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Base Configuration](#base-configuration)
3. [Authentication](#authentication)
4. [Data Models & Types](#data-models--types)
5. [API Endpoints](#api-endpoints)
6. [Next.js Integration Guide](#nextjs-integration-guide)
7. [TypeScript Types](#typescript-types)
8. [Error Handling](#error-handling)
9. [Multi-Tenancy](#multi-tenancy)
10. [Example Implementations](#example-implementations)

---

## Overview

SnapDesk is a multi-tenant customer support and ticketing system built with Django REST Framework. This documentation provides everything needed to build a Next.js frontend application.

### Key Features
- **Multi-tenant Architecture**: Organizations accessed via subdomains
- **JWT Authentication**: Token-based authentication with refresh tokens
- **Ticketing System**: Create, manage, and track support tickets
- **Knowledge Base**: Internal and public articles
- **User Management**: Multiple account types (User, Employee, Business Owner)
- **Notifications**: Real-time notifications for ticket events

### Technology Stack
- **Backend**: Django 4.2.4 + Django REST Framework
- **Authentication**: JWT (Simple JWT)
- **Database**: PostgreSQL (SQLite for development)
- **API Documentation**: Swagger/OpenAPI (available at `/api/v1/swagger/`)
- **Deployment**: Docker & Docker Compose (backend runs on port 9000)

---

## Quick Start Guide

### Step 0: Backend Setup (Using Docker)

**Important**: The SnapDesk backend must be running before you can develop the frontend.

1. **Prerequisites**: Install Docker and Docker Compose on your machine
2. **Start the Backend**:
   ```bash
   cd snapdesk  # Navigate to the backend project directory
   docker-compose up -d
   ```
   This will start:
   - PostgreSQL database (port 5432)
   - Redis (port 6379)
   - Django web server (port 9000)

3. **Verify Backend is Running**:
   - Health check: `http://localhost:9000/health` should return "ok"
   - API docs: `http://localhost:9000/api/v1/swagger/`
   - Admin panel: `http://localhost:9000/admin/`

4. **Stop the Backend** (when done):
   ```bash
   docker-compose down
   ```

**Note**: The backend runs on port **9000** when using Docker, not 8000.

### Step 1: Frontend Project Setup

**Option A: Docker Setup (Recommended)**

See the [Frontend Docker Setup](#frontend-docker-setup) section below for complete instructions.

Quick start:
1. Create Next.js project with TypeScript
2. Create Dockerfile and docker-compose.yml (see detailed instructions below)
3. Run `docker-compose up` to start the frontend
4. Frontend will be available at `http://localhost:3000`

**Option B: Local Development (Without Docker)**
1. Create Next.js project with TypeScript
2. Install axios for API calls
3. Set up environment variables (API base URL: `http://localhost:9000/api/v1`)
4. Run `npm run dev` to start development server

1. **Create Dockerfile for Next.js**:
   Create a `Dockerfile` in your frontend project root:
   ```dockerfile
   FROM node:18-alpine AS base

   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app

   COPY package.json package-lock.json* ./
   RUN npm ci

   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .

   # Set environment variables
   ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:9000/api/v1
   ENV NEXT_PUBLIC_MAIN_DOMAIN=snapdesk.com

   RUN npm run build

   # Production image, copy all the files and run next
   FROM base AS runner
   WORKDIR /app

   ENV NODE_ENV production

   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs

   EXPOSE 3000

   ENV PORT 3000

   CMD ["node", "server.js"]
   ```

2. **Update next.config.js for Docker**:
   Add output: 'standalone' to your Next.js config:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'standalone',
   }
   module.exports = nextConfig
   ```

3. **Create docker-compose.yml for Frontend**:
   Create a `docker-compose.yml` in your frontend project:
   ```yaml
   version: '3.8'

   services:
     frontend:
       build:
         context: .
         dockerfile: Dockerfile
       container_name: snapdesk_frontend
       ports:
         - "3000:3000"
       environment:
         - NEXT_PUBLIC_API_BASE_URL=http://localhost:9000/api/v1
         - NEXT_PUBLIC_MAIN_DOMAIN=snapdesk.com
       volumes:
         - .:/app
         - /app/node_modules
         - /app/.next
       depends_on:
         - backend
       networks:
         - snapdesk_network

     backend:
       # Reference to backend service if running in same compose
       # Or use external network if backend runs separately
       image: snapdesk_core:latest
       # ... backend config

   networks:
     snapdesk_network:
       external: true
   ```

4. **Create .dockerignore**:
   ```
   node_modules
   .next
   .git
   .env.local
   .env*.local
   npm-debug.log*
   yarn-debug.log*
   yarn-error.log*
   ```

5. **Build and Run**:
   ```bash
   # Build the Docker image
   docker-compose build

   # Start the frontend
   docker-compose up -d

   # View logs
   docker-compose logs -f frontend

   # Stop
   docker-compose down
   ```

**Development with Docker (Hot Reload)**:
For development with hot reload, use a development Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

And update docker-compose.yml for development:
```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://localhost:9000/api/v1
```

### Step 2: API Client
1. Create API client with base URL configuration
2. Add request interceptor to include JWT tokens
3. Add response interceptor for token refresh and error handling

### Step 3: Authentication
1. Implement authentication service with login/signup methods
2. Handle token storage (localStorage or cookies)
3. Extract tokens from response headers (`set-auth-token`, `set-refresh-token`)

### Step 4: Build Pages
1. Login/Signup pages
2. Protected routes wrapper
3. Dashboard with ticket list
4. Ticket detail and creation forms

### Step 5: Connect to Backend
1. Ensure backend is running via Docker
2. Test authentication endpoints first
3. Implement ticket endpoints as they become available
4. Add error handling and loading states

**Note**: Currently, only authentication endpoints are fully implemented. Ticket, article, and notification endpoints need to be implemented in the backend. Use this documentation as a guide for what endpoints to expect.

---

## Frontend Docker Setup

### Why Docker for Frontend?

Using Docker for the frontend provides:
- Consistent development environment across team members
- Easy deployment to production
- Isolation from host system dependencies
- Simplified CI/CD pipeline integration

### Docker Setup Instructions

**1. Create Dockerfile (Production)**

Create a `Dockerfile` in your frontend project root:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables at build time
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_MAIN_DOMAIN
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_MAIN_DOMAIN=$NEXT_PUBLIC_MAIN_DOMAIN

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**2. Create Dockerfile.dev (Development)**

For development with hot reload:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

EXPOSE 3000

# Use development server with hot reload
CMD ["npm", "run", "dev"]
```

**3. Update next.config.js**

Add standalone output for Docker production builds:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

module.exports = nextConfig
```

**4. Create docker-compose.yml**

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.dev  # Use Dockerfile for production
      args:
        - NEXT_PUBLIC_API_BASE_URL=http://localhost:9000/api/v1
        - NEXT_PUBLIC_MAIN_DOMAIN=snapdesk.com
    container_name: snapdesk_frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://localhost:9000/api/v1
      - NEXT_PUBLIC_MAIN_DOMAIN=snapdesk.com
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    networks:
      - snapdesk_network
    restart: unless-stopped

networks:
  snapdesk_network:
    external: true  # Use external network if backend runs separately
    # Or remove 'external: true' to create a new network
```

**5. Create .dockerignore**

```
node_modules
.next
.git
.env.local
.env*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.pem
```

**6. Docker Commands**

```bash
# Development (with hot reload)
docker-compose up

# Production build
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f frontend

# Stop containers
docker-compose down

# Rebuild after dependency changes
docker-compose build --no-cache frontend
```

**7. Connecting to Backend**

If backend runs in Docker on the same network:
- Use service name: `http://web:9000/api/v1` (internal Docker network)
- Or use host network mode
- Or use `host.docker.internal` to access host services: `http://host.docker.internal:9000/api/v1`

**8. Production docker-compose.yml**

For production, create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_API_BASE_URL=https://api.snapdesk.com/api/v1
        - NEXT_PUBLIC_MAIN_DOMAIN=snapdesk.com
    container_name: snapdesk_frontend_prod
    ports:
      - "3000:3000"
    restart: unless-stopped
    networks:
      - snapdesk_network
```

### Troubleshooting

**Issue: Cannot connect to backend**
- Ensure backend is running and accessible
- Check network configuration in docker-compose.yml
- Use `host.docker.internal` for localhost services
- Verify environment variables are set correctly

**Issue: Hot reload not working**
- Ensure volumes are mounted correctly
- Check that Dockerfile.dev is being used
- Verify file permissions

**Issue: Build fails**
- Clear Docker cache: `docker-compose build --no-cache`
- Check Node.js version compatibility
- Verify all dependencies are in package.json

---

## Base Configuration

### Backend Setup (Docker)

**The backend MUST be run using Docker Compose.**

**To start the backend:**
```bash
# Navigate to the snapdesk backend directory
cd snapdesk

# Start all services (database, redis, web server)
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop all services
docker-compose down
```

**Services started:**
- **Web Server**: `http://localhost:9000` (Django)
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

**First-time setup:**
```bash
# Run database migrations
docker-compose exec web python manage.py migrate

# Create superuser (optional, for admin access)
docker-compose exec web python manage.py createsuperuser
```

### API Base URL

The API base URL structure depends on the environment:

- **Development (Docker)**: `http://localhost:9000/api/v1` ⚠️ **Port 9000, not 8000**
- **Development (Local)**: `http://localhost:8000/api/v1` (if running without Docker)
- **Production**: `https://{subdomain}.snapdesk.com/api/v1` or `https://api.snapdesk.com/api/v1`

**Important**: When using Docker (recommended), the backend runs on port **9000**, not 8000.

### Multi-Tenancy

SnapDesk uses subdomain-based multi-tenancy. Each organization has a unique subdomain:
- Organization subdomain: `acme` → `acme.snapdesk.com`
- API requests should be made to the organization's subdomain

### CORS Configuration

**Important:**
- The backend is configured to accept CORS requests from any origin
- Include `credentials: 'include'` in your fetch/axios requests
- Include `withCredentials: true` if using axios
- The backend exposes custom headers: `set-auth-token` and `set-refresh-token`
- Always include `Content-Type: application/json` header for POST/PUT/PATCH requests
- Include `Authorization: Bearer {token}` header for authenticated requests

---

## Authentication

Authentication **starts from the frontend**. The frontend decides which login method to use (local vs Google vs Microsoft) by calling the backend once, then either shows the email/password form or redirects the user to the provider.

### Authentication Flow (frontend-started)

1. **Frontend loads the login page** for the current organisation (subdomain, e.g. `acme.snapdesk.com`).
2. **Frontend calls** `GET /api/v1/client/auth/account/login-options/?subdomain=acme` (pass **subdomain** as a query param). Alternatively, if the request is made on the org’s host (e.g. `acme.snapdesk.com`), the backend can resolve the organisation from the host; passing `subdomain` is recommended so it works regardless of API base URL.
3. **Backend returns** `{ "auth_method": "local" | "google" | "microsoft", "auth_url": null | "https://..." }`.
   - If `auth_method` is **`local`**: frontend shows the **email + one-time code** form: user enters email → request code → enter code → `POST .../login` or `.../business_login`.
   - If `auth_method` is **`google`** or **`microsoft`**: frontend **redirects the user** to `auth_url` (same as opening that URL in the browser).
4. **User signs in** at Google or Microsoft and is redirected back to the **frontend callback URL** (configured in the provider app and in `OrganisationAuthProviderSettings.redirect_uri`). The callback URL receives query params **`code`** and **`state`** (e.g. `https://acme.snapdesk.com/auth/callback?code=...&state=acme`). The **`state`** value is the organisation subdomain.
5. **Frontend calls** `POST /api/v1/client/auth/account/exchange-code/` with body `{ "code": "...", "state": "acme", "provider": "microsoft" }` (or `"google"`). Request must be made to the **same subdomain** (or backend must be able to resolve org from `state`).
6. **Backend** exchanges the code for tokens, fetches user profile from the provider, finds or creates the **Account** and **EmployeeProfile** for that organisation, and returns the **same response as login**: user payload + headers **`set-auth-token`** and **`set-refresh-token`**.
7. **Frontend** stores the tokens (e.g. from response headers) and uses the **access token** for subsequent API requests (`Authorization: Bearer <access_token>`).

**Important**: The **redirect_uri** configured in Google/Microsoft (and in `OrganisationAuthProviderSettings`) must be the **frontend** URL where the user lands after login (e.g. `https://acme.snapdesk.com/auth/callback`), not a backend URL. The frontend then reads `code` and `state` from the URL and calls **exchange-code** to get the JWT.

### Local auth flow (email + one-time code)

When `auth_method` is `"local"`, the backend sends a **one-time login code** to the user's email (via [Resend](https://resend.com) when configured).

1. **User enters email** on the login page.
2. **Frontend calls** `POST /api/v1/client/auth/account/send_verification_code` with `{ "email": "user@example.com" }` (or `business_send_verification_code` with `email` + `organisation`).
3. **Backend** generates a 6-digit code, sets it as the account's password, and **emails the code** using Resend (or Django email fallback). Response: `{ "success": true, "message": "If an account exists for this email, a code was sent." }`.
4. **User enters the code** they received by email.
5. **Frontend calls** `POST /api/v1/client/auth/account/login` with `{ "email": "user@example.com", "password": "123456" }` (code as password).
6. **Backend** returns user payload and JWT in headers; the code is invalidated (one-time use).
7. **Use Access Token** for authenticated requests.

### Authentication Endpoints

#### 1. Sign Up (Create Account)

**Endpoint**: `POST /api/v1/auth/account/signup`

**Request Body**:
```json
{
  "phone_number": "+1234567890",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "gender": "male",
  "account_type": "user",
  "business_name": "Acme Corp",  // Required if account_type is "business_owner"
  "business_email": "admin@acme.com",  // Required
  "country": "US",
  "address_line_1": "123 Main St"
}
```

**Response**:
```json
{
  "message": "Account created successfully.",
  "data": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "phone_number": "+1234567890",
    "account_type": "user",
    "phone_number_confirmed": false,
    "must_reset_password": false
  }
}
```

**Account Types**:
- `"user"`: Regular user
- `"employee"`: Organization employee
- `"business_owner"`: Business owner (creates organization)
- `"other"`: Other account type

#### 2. Send Verification Code (local auth – email + code)

**Endpoint**: `POST /api/v1/client/auth/account/send_verification_code`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "If an account exists for this email, a code was sent."
}
```

**Note**: The backend generates a 6-digit one-time code, sets it as the account password, and sends it to the given email via **Resend** (when `USE_RESEND=True` and `RESEND_API_KEY` are set). If Resend is not configured, Django's email backend is used. For security, the response does not reveal whether the email exists; the user should enter the code they receive to complete login. Backend setup: see `docs/RESEND_SETUP.md`.

#### 2a. Get Login Options (frontend-started auth)

**Endpoint**: `GET /api/v1/client/auth/account/login-options/`

**Authentication**: Not required

**Query Parameters**:
| Parameter | Required | Description |
|-----------|----------|-------------|
| `subdomain` | Recommended | Organisation subdomain (e.g. `acme`). If provided, the backend resolves the organisation by subdomain. If omitted, the backend uses the request host (OrganisationMiddleware) when the request is on the org’s subdomain. |

**Description**: Returns the login method for the organisation. **Pass `subdomain`** so the correct org is used regardless of which host the API is called from (e.g. `GET .../login-options/?subdomain=acme`).

**Response** (`200 OK`):
```json
{
  "auth_method": "microsoft",
  "auth_url": "https://login.microsoftonline.com/.../oauth2/v2.0/authorize?client_id=...&redirect_uri=...&state=acme&...",
  "state": "acme"
}
```

| Field | Description |
|-------|-------------|
| `auth_method` | `"local"`, `"google"`, or `"microsoft"` |
| `auth_url` | When `auth_method` is `google` or `microsoft`, the URL to redirect the user to. `null` for local. |
| `state` | Organisation subdomain; same value is returned after provider redirect (frontend sends it to exchange-code). |

**Frontend behaviour**:
- If `auth_method === "local"`: show email field → "Send code" → then code field → `POST .../login` or `.../business_login` with `email` and `password` (the code).
- If `auth_method` is `google` or `microsoft`: redirect the user to `auth_url`. After login, the provider redirects to your **frontend callback URL** with `?code=...&state=...`.

#### 2b. Exchange OAuth Code (Google / Microsoft)

**Endpoint**: `POST /api/v1/client/auth/account/exchange-code/`

**Authentication**: Not required

**Description**: After the user returns from Google or Microsoft, the frontend calls this with the `code` and `state` from the callback URL. The backend exchanges the code for tokens, fetches the user profile, and creates or finds the Account and EmployeeProfile. Returns the same shape as login (user data + JWT in headers).

**Request Body**:
```json
{
  "code": "0.AXIA...",
  "state": "acme",
  "provider": "microsoft"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `code` | Yes | Authorization code from the provider callback query string |
| `state` | Yes | Organisation subdomain (from login-options and from callback `state` param) |
| `provider` | Yes | `"google"` or `"microsoft"` |

**Response** (`200 OK`): Same as login: user object in body; JWT in response headers `set-auth-token` and `set-refresh-token`.

**Error** (`400`): e.g. `{ "error": "Invalid state or organisation not found" }`.

#### 3. Business Send Verification Code (local auth)

**Endpoint**: `POST /api/v1/client/auth/account/business_send_verification_code`

**Request Body**:
```json
{
  "email": "user@example.com",
  "organisation": "acme"
}
```

**Response**:
```json
{
  "success": true,
  "message": "If an account exists for this email, a code was sent."
}
```

**Note**: Same as send verification code, but the account must belong to the given organisation (owner or employee). The `organisation` field accepts:
- Organisation ID (numeric): `"1"` or `1`
- Organisation name (string): `"Acme Corp"`
- Organisation subdomain (string): `"acme"`

#### 4. Login (local auth)

**Endpoint**: `POST /api/v1/client/auth/account/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Note**: `password` is the **one-time code** sent to the user's email (from send verification code). After successful login, the code is invalidated.

**Response Headers**:
- `set-auth-token`: Access token (JWT)
- `set-refresh-token`: Refresh token (JWT)

**Response Body**:
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "user@example.com",
  "phone_number": "+1234567890",
  "account_type": "user",
  "phone_number_confirmed": true,
  "must_reset_password": false,
  "organisation": {  // If business_owner
    "id": 1,
    "name": "Acme Corp",
    "subdomain": "acme",
    "email": "admin@acme.com",
    "plan": "free"
  }
}
```

#### 5. Business Login (local auth)

**Endpoint**: `POST /api/v1/client/auth/account/business_login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "123456",
  "organisation": "acme"
}
```

**Response**: Same as regular login (user object + JWT in headers).

**Note**: `password` is the one-time code sent by email. The `organisation` field accepts:
- Organisation ID (numeric): `"1"` or `1`
- Organisation name (string): `"Acme Corp"`
- Organisation subdomain (string): `"acme"`

### Token Management

**Token Lifetime**:
- Access Token: 2 days
- Refresh Token: 2 days

**Token Storage**:
Store tokens securely (httpOnly cookies recommended for production, or secure localStorage):

```typescript
// Store tokens
localStorage.setItem('access_token', accessToken);
localStorage.setItem('refresh_token', refreshToken);

// Or use cookies (recommended for production)
document.cookie = `access_token=${accessToken}; Secure; HttpOnly; SameSite=Strict`;
```

**Using Tokens**:
Include the access token in the `Authorization` header:

```typescript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

### Organisation personalisation (branding & settings)

Organisations can customise how the frontend looks and behaves: logo, brand colors, countries they operate in, and timezone. Use these endpoints to load and update that configuration.

**Who can read**: Any authenticated member of the organisation (employee or business owner).

**Who can update**: Business owner for their organisation, or any user whose role has the `manage_organisation_settings` permission.

#### Get current organisation personalisation

**Endpoint**: `GET /api/v1/client/organisation/personalisation/` or `GET /api/v1/client/organisation/personalisation/current/`

**Response** (`200 OK`):
```json
{
  "id": 1,
  "organisation_id": 1,
  "organisation_name": "Acme Corp",
  "subdomain": "acme",
  "logo": "https://example.com/media/business_logos/acme.png",
  "primary_color": "#1976d2",
  "secondary_color": "#424242",
  "accent_color": "#ff9800",
  "favicon": "https://example.com/media/organisation_favicons/acme.ico",
  "countries": ["GH", "US", "GB"],
  "timezone": "Africa/Accra",
  "display_name": "Acme Corp"
}
```

| Field | Description |
|-------|-------------|
| `id` | Personalisation record id (use for PATCH/PUT by id if needed) |
| `organisation_id` | Organisation id |
| `organisation_name` | Organisation name |
| `subdomain` | Organisation subdomain |
| `logo` | Full URL to organisation logo (from Organisation; may be null) |
| `primary_color` | Primary brand color (hex, e.g. #1976d2) |
| `secondary_color` | Secondary brand color (hex) |
| `accent_color` | Accent/highlight color (hex) |
| `favicon` | Full URL to favicon (may be null) |
| `countries` | List of ISO 3166-1 alpha-2 country codes (e.g. GH, US) |
| `timezone` | IANA timezone (e.g. Africa/Accra, UTC) |
| `display_name` | Display name (defaults to organisation name if not set) |

#### Update organisation personalisation

**Endpoint**: `PATCH /api/v1/client/organisation/personalisation/current/` (partial) or `PUT /api/v1/client/organisation/personalisation/current/` (full). Alternatively use `.../personalisation/{id}/` with the `id` from the GET response.

**Request body** (all fields optional for PATCH):
```json
{
  "primary_color": "#1976d2",
  "secondary_color": "#424242",
  "accent_color": "#ff9800",
  "countries": ["GH", "US"],
  "timezone": "Africa/Accra",
  "display_name": "Acme"
}
```

- **Colors**: Hex format (e.g. `#1976d2` or `#fff`).
- **countries**: List of two-letter ISO country codes; stored uppercase.
- **timezone**: IANA timezone string (e.g. `Africa/Accra`, `America/New_York`, `UTC`).
- **Logo**: Set via the Organisation model (e.g. staff/organisation update or a dedicated logo endpoint); not in this payload.
- **favicon**: Upload as image; use multipart/form-data if sending file.

**Response** (`200 OK`): Same shape as GET (full personalisation object).

**Errors**: `400` if validation fails (e.g. invalid hex color or country code). `403` if user cannot update personalisation.

---

## Staff API

### Staff Authentication

Staff members authenticate using **email-based** authentication with a 6-digit verification code. Staff users are created through Django admin and use a separate authentication system from client users.

**Key Differences from Client Authentication:**
- Uses **email** instead of phone number
- 6-digit code (default: `"000000"` in development)
- Separate authentication endpoints: `/api/v1/staff/auth/`
- Staff users must have `is_staff=True` and a valid email address

### Staff Authentication Flow

1. **Send Verification Code** - Staff member enters their email
2. **Receive Code** - Code is sent via email (defaults to `"000000"` in development)
3. **Login with Email + Code** - Staff member enters email and 6-digit code
4. **Receive JWT Tokens** - Access + Refresh tokens in response headers
5. **Use Access Token** - Include in `Authorization` header for authenticated requests

### Staff Authentication Endpoints

#### 1. Send Staff Verification Code

**Endpoint**: `POST /api/v1/staff/auth/account/send_verification_code`

**Request Body**:
```json
{
  "email": "staff@snapdesk.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Code sent!"
}
```

**Important Notes**:
- The email must belong to a staff user with `is_staff=True`
- In development, the code defaults to `"000000"`
- The code is sent via email (email sending needs to be configured for production)
- The code is set as a one-time password that expires after use

#### 2. Staff Login

**Endpoint**: `POST /api/v1/staff/auth/account/login`

**Request Body**:
```json
{
  "email": "staff@snapdesk.com",
  "code": "000000"
}
```

**Response Headers**:
- `set-auth-token`: Access token (JWT)
- `set-refresh-token`: Refresh token (JWT)

**Response Body**:
```json
{
  "id": 1,
  "first_name": "Jane",
  "last_name": "Doe",
  "middle_name": null,
  "full_name": "Jane Doe",
  "email": "staff@snapdesk.com",
  "phone_number": "+1234567890",
  "is_staff": true,
  "staff_profile": {
    "id": 1,
    "role": 1,
    "role_id": 1,
    "role_name": "Super Admin",
    "role_details": {
      "id": 1,
      "name": "Super Admin",
      "description": "Full platform access. Can manage all organisations, staff, and platform settings.",
      "permissions": [
        "super_admin",
        "manage_organisations",
        "view_organisations",
        "create_organisations",
        "update_organisations",
        "manage_staff",
        "view_staff",
        "create_staff",
        "update_staff",
        "delete_staff",
        "manage_staff_roles",
        "view_staff_roles",
        "create_staff_roles",
        "update_staff_roles",
        "delete_staff_roles",
        "manage_staff_permissions",
        "view_staff_permissions",
        "create_staff_permissions",
        "update_staff_permissions",
        "delete_staff_permissions",
        "view_platform_analytics",
        "export_platform_reports",
        "manage_platform_settings"
      ],
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    },
    "permissions": [
      "super_admin",
      "manage_organisations",
      "view_organisations",
      "create_organisations",
      "update_organisations",
      "manage_staff",
      "view_staff",
      "create_staff",
      "update_staff",
      "delete_staff",
      "manage_staff_roles",
      "view_staff_roles",
      "create_staff_roles",
      "update_staff_roles",
      "delete_staff_roles",
      "manage_staff_permissions",
      "view_staff_permissions",
      "create_staff_permissions",
      "update_staff_permissions",
      "delete_staff_permissions",
      "view_platform_analytics",
      "export_platform_reports",
      "manage_platform_settings"
    ],
    "created": "2024-01-10T08:00:00Z",
    "updated": "2024-01-10T08:00:00Z"
  }
}
```

**Response Fields**:
- `id` - Staff account ID
- `first_name`, `last_name`, `middle_name` - Staff member's name
- `full_name` - Computed full name
- `email` - Staff email address
- `phone_number` - Staff phone number
- `is_staff` - Always `true` for staff accounts
- `staff_profile` - Staff profile object (null if no profile exists):
  - `id` - Staff profile ID
  - `role` - Role ID (for write operations)
  - `role_id` - Role ID (read-only)
  - `role_name` - Role name (read-only)
  - `role_details` - Full role object with all permissions:
    - `id`, `name`, `description`
    - `permissions` - Array of all permission names in this role
    - `created`, `updated` - Timestamps
  - `permissions` - Array of all permission names the staff member has (same as `role_details.permissions`)
  - `created`, `updated` - Profile timestamps

**Important Notes**:
- Default code in development is `"000000"` - this should be changed in production
- After successful login, the password is changed to a random string (one-time use)
- Staff users are authenticated using `StaffAuthentication` class which validates `is_staff=True`
- Tokens have the same lifetime as client tokens (2 days)
- The response includes `staff_profile` object with complete role and permissions information
- Use `staff_profile.permissions` array to control UI visibility and functionality (see Staff Permissions section below)
- If `staff_profile` is `null`, the staff member has no role assigned and should contact an admin

#### 3. Get Current Staff User (with Permissions)

**Endpoint**: `GET /api/v1/staff/auth/account/me`

**Authentication**: Required (Staff JWT token)

**Response** (same format as login response):
```json
{
  "id": 1,
  "first_name": "Jane",
  "last_name": "Doe",
  "middle_name": null,
  "full_name": "Jane Doe",
  "email": "staff@snapdesk.com",
  "phone_number": "+1234567890",
  "is_staff": true,
  "staff_profile": {
    "id": 1,
    "role": 2,
    "role_id": 2,
    "role_name": "Support Manager",
    "role_details": {
      "id": 2,
      "name": "Support Manager",
      "description": "Can manage organisations and view platform analytics. Responsible for onboarding new organisations.",
      "permissions": [
        "manage_organisations",
        "view_organisations",
        "create_organisations",
        "update_organisations",
        "view_staff",
        "view_platform_analytics",
        "export_platform_reports"
      ],
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    },
    "permissions": [
      "manage_organisations",
      "view_organisations",
      "create_organisations",
      "update_organisations",
      "view_staff",
      "view_platform_analytics",
      "export_platform_reports"
    ],
    "created": "2024-01-10T08:00:00Z",
    "updated": "2024-01-10T08:00:00Z"
  }
}
```

**Use Case**:
- Call this endpoint after login to get up-to-date permissions
- Use this to refresh permissions if roles are changed by admin
- Check permissions before rendering UI components
- Returns the same structure as login response, including full `staff_profile` with role details

### Staff Permissions & Role-Based Access Control

Staff members are organized using **roles** and **permissions**. Each staff member has a `StaffProfile` linked to a `StaffRole`, which contains a set of `StaffPermission` objects.

**Key Concepts**:
- **Permissions** are granular actions (e.g., `manage_organisations`, `view_staff`)
- **Roles** are collections of permissions (e.g., "Super Admin", "Support Manager")
- **Staff Profiles** link accounts to roles
- The `super_admin` permission grants access to ALL operations

**Important**: Always check permissions in your frontend to control UI visibility and functionality. Even if an API call succeeds, you should prevent users from seeing features they don't have permission for.

#### Available Staff Permissions

The following permissions are available in the system:

| Permission Name | Description | Controls Access To |
|----------------|-------------|-------------------|
| `super_admin` | Full platform access (grants all permissions) | Everything - bypasses all permission checks |
| `manage_organisations` | Full CRUD access to organizations | Create, update, view, and manage organizations |
| `view_organisations` | View organization details | List and view organization information |
| `create_organisations` | Create new organizations | Create organization button/form |
| `update_organisations` | Update organization details | Edit organization forms |
| `manage_staff` | Full CRUD access to staff members | Create, update, delete, and view staff |
| `view_staff` | View staff member details | List and view staff information |
| `create_staff` | Create new staff members | Add staff button/form |
| `update_staff` | Update staff member details | Edit staff forms |
| `delete_staff` | Delete staff members | Delete staff button/action |
| `manage_staff_roles` | Full CRUD access to staff roles | Create, update, delete, and view roles |
| `view_staff_roles` | View staff roles | List and view role information |
| `create_staff_roles` | Create new staff roles | Create role button/form |
| `update_staff_roles` | Update staff roles | Edit role forms |
| `delete_staff_roles` | Delete staff roles | Delete role button/action |
| `manage_staff_permissions` | Full CRUD access to staff permissions | Create, update, delete, and view permissions |
| `view_staff_permissions` | View staff permissions | List and view permission information |
| `create_staff_permissions` | Create new staff permissions | Create permission button/form |
| `update_staff_permissions` | Update staff permissions | Edit permission forms |
| `delete_staff_permissions` | Delete staff permissions | Delete permission button/action |
| `view_platform_analytics` | View platform-wide analytics | Analytics dashboard, reports view |
| `export_platform_reports` | Export platform reports | Export/download reports functionality |
| `manage_platform_settings` | Manage platform-level settings | Platform settings page/forms |

#### Standard Staff Roles

The following roles are created by default (see `scripts/standard_staff_roles.json`):

**1. Super Admin**
- **Description**: Full platform access. Can manage all organisations, staff, and platform settings.
- **Permissions**: ALL permissions (includes `super_admin`)

**2. Support Manager**
- **Description**: Can manage organisations and view platform analytics. Responsible for onboarding new organisations.
- **Permissions**: 
  - `manage_organisations`
  - `view_organisations`
  - `create_organisations`
  - `update_organisations`
  - `view_staff`
  - `view_platform_analytics`
  - `export_platform_reports`

**3. Onboarding Specialist**
- **Description**: Specializes in onboarding new organisations to the platform.
- **Permissions**:
  - `view_organisations`
  - `create_organisations`
  - `update_organisations`
  - `view_staff`

**4. Staff Manager**
- **Description**: Manages staff members, roles, and permissions across the platform.
- **Permissions**:
  - `manage_staff`
  - `view_staff`
  - `create_staff`
  - `update_staff`
  - `manage_staff_roles`
  - `view_staff_roles`
  - `create_staff_roles`
  - `update_staff_roles`
  - `view_staff_permissions`
  - `view_organisations`

**5. Analyst**
- **Description**: Can view organisations and platform analytics for reporting purposes.
- **Permissions**:
  - `view_organisations`
  - `view_staff`
  - `view_platform_analytics`
  - `export_platform_reports`

#### Frontend Implementation Guide

**1. Getting Permissions**

After login, you receive permissions in the login response. You can also fetch current permissions using the `/me` endpoint:

```typescript
// After login, store user with staff_profile in your auth state/context
const user = await staffApiClient.post('/staff/auth/account/login', {
  email: 'staff@snapdesk.com',
  code: '000000'
});

// Access permissions via staff_profile
const permissions = user.staff_profile?.permissions || [];
const roleName = user.staff_profile?.role_name;

// Or fetch fresh user data
const user = await staffApiClient.get('/staff/auth/account/me');
const permissions = user.staff_profile?.permissions || [];
```

**2. Permission Checking Utility**

Create a utility function to check permissions:

```typescript
// utils/permissions.ts
/**
 * Check if staff user has a specific permission
 */
export function hasPermission(user: StaffUser, permission: string): boolean {
  if (!user?.staff_profile?.permissions) return false;
  
  // Super admin has all permissions
  if (user.staff_profile.permissions.includes('super_admin')) {
    return true;
  }
  
  return user.staff_profile.permissions.includes(permission);
}

/**
 * Check if staff user has any of the given permissions
 */
export function hasAnyPermission(user: StaffUser, permissions: string[]): boolean {
  if (!user?.staff_profile?.permissions) return false;
  
  if (user.staff_profile.permissions.includes('super_admin')) {
    return true;
  }
  
  return permissions.some(permission => user.staff_profile!.permissions.includes(permission));
}

/**
 * Check if staff user has all of the given permissions
 */
export function hasAllPermissions(user: StaffUser, permissions: string[]): boolean {
  if (!user?.staff_profile?.permissions) return false;
  
  if (user.staff_profile.permissions.includes('super_admin')) {
    return true;
  }
  
  return permissions.every(permission => user.staff_profile!.permissions.includes(permission));
}
```

**3. Sidebar/Navigation Control**

Control sidebar items based on permissions:

```typescript
// components/StaffSidebar.tsx
import { hasPermission } from '@/utils/permissions';
import { useStaffAuth } from '@/hooks/useStaffAuth';

export function StaffSidebar() {
  const { user } = useStaffAuth();
  
  const menuItems = [
    {
      label: 'Organizations',
      path: '/staff/organisations',
      icon: BuildingIcon,
      permission: 'view_organisations', // Show if user can view organizations
      children: [
        {
          label: 'List Organizations',
          path: '/staff/organisations',
          permission: 'view_organisations',
        },
        {
          label: 'Create Organization',
          path: '/staff/organisations/create',
          permission: 'create_organisations',
        },
      ],
    },
    {
      label: 'Staff Management',
      path: '/staff/staff',
      icon: UsersIcon,
      permission: 'view_staff',
      children: [
        {
          label: 'List Staff',
          path: '/staff/staff',
          permission: 'view_staff',
        },
        {
          label: 'Add Staff',
          path: '/staff/staff/create',
          permission: 'create_staff',
        },
        {
          label: 'Roles & Permissions',
          path: '/staff/staff/roles',
          permission: 'view_staff_roles',
        },
      ],
    },
    {
      label: 'Analytics',
      path: '/staff/analytics',
      icon: ChartBarIcon,
      permission: 'view_platform_analytics',
    },
    {
      label: 'Platform Settings',
      path: '/staff/settings',
      icon: CogIcon,
      permission: 'manage_platform_settings',
    },
  ];
  
  const visibleItems = menuItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(user, item.permission);
  }).map(item => ({
    ...item,
    children: item.children?.filter(child => 
      !child.permission || hasPermission(user, child.permission)
    ),
  }));
  
  return (
    <nav>
      {visibleItems.map(item => (
        <SidebarItem key={item.path} {...item} />
      ))}
    </nav>
  );
}
```

**4. Button/Action Visibility**

Hide buttons and actions based on permissions:

```typescript
// components/OrganisationList.tsx
import { hasPermission } from '@/utils/permissions';

export function OrganisationList() {
  const { user } = useStaffAuth();
  
  return (
    <div>
      <div className="header">
        <h1>Organizations</h1>
        {hasPermission(user, 'create_organisations') && (
          <button onClick={handleCreate}>Create Organization</button>
        )}
      </div>
      
      <table>
        {organisations.map(org => (
          <tr key={org.id}>
            <td>{org.name}</td>
            <td>
              {hasPermission(user, 'update_organisations') && (
                <button onClick={() => handleEdit(org.id)}>Edit</button>
              )}
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

**5. Route Protection**

Protect routes using middleware or route guards:

```typescript
// middleware/staffPermissions.ts
import { hasPermission } from '@/utils/permissions';
import { redirect } from 'next/navigation';

export function requirePermission(
  user: StaffUser,
  permission: string,
  redirectTo: string = '/staff/dashboard'
) {
  if (!hasPermission(user, permission)) {
    redirect(redirectTo);
  }
}

// Usage in page/component
// pages/staff/organisations/create.tsx
export default function CreateOrganisationPage() {
  const { user } = useStaffAuth();
  
  useEffect(() => {
    requirePermission(user, 'create_organisations', '/staff/organisations');
  }, [user]);
  
  // ... rest of component
}
```

**6. Conditional Rendering**

Show/hide entire sections based on permissions:

```typescript
// components/OrganisationDetail.tsx
export function OrganisationDetail({ organisation }) {
  const { user } = useStaffAuth();
  
  return (
    <div>
      <h1>{organisation.name}</h1>
      
      {/* View-only section */}
      {hasPermission(user, 'view_organisations') && (
        <OrganisationInfo organisation={organisation} />
      )}
      
      {/* Edit section */}
      {hasPermission(user, 'update_organisations') && (
        <EditOrganisationForm organisation={organisation} />
      )}
      
      {/* Advanced settings - requires manage_organisations */}
      {hasPermission(user, 'manage_organisations') && (
        <AdvancedSettings organisation={organisation} />
      )}
    </div>
  );
}
```

#### Permission-to-Feature Mapping

Use this mapping to control features in your frontend:

**Organization Management**:
- Show "Organizations" menu item: `view_organisations`
- Show "Create Organization" button: `create_organisations`
- Show "Edit Organization" button: `update_organisations`
- Show "Delete Organization" button: `manage_organisations`
- Allow access to organization detail page: `view_organisations`
- Allow editing organization form: `update_organisations`

**Staff Management**:
- Show "Staff" menu item: `view_staff`
- Show "Add Staff" button: `create_staff`
- Show "Edit Staff" button: `update_staff`
- Show "Delete Staff" button: `delete_staff`
- Allow access to staff list: `view_staff`

**Roles & Permissions Management**:
- Show "Roles & Permissions" menu item: `view_staff_roles`
- Show "Create Role" button: `create_staff_roles`
- Show "Edit Role" button: `update_staff_roles`
- Show "Delete Role" button: `delete_staff_roles`
- Allow managing permissions: `manage_staff_permissions`

**Analytics & Reports**:
- Show "Analytics" menu item: `view_platform_analytics`
- Show "Export Reports" button: `export_platform_reports`
- Allow viewing analytics dashboard: `view_platform_analytics`

**Platform Settings**:
- Show "Platform Settings" menu item: `manage_platform_settings`
- Allow editing settings: `manage_platform_settings`

#### TypeScript Types

```typescript
// types/staff.ts
export type StaffPermission =
  | 'super_admin'
  | 'manage_organisations'
  | 'view_organisations'
  | 'create_organisations'
  | 'update_organisations'
  | 'manage_staff'
  | 'view_staff'
  | 'create_staff'
  | 'update_staff'
  | 'delete_staff'
  | 'manage_staff_roles'
  | 'view_staff_roles'
  | 'create_staff_roles'
  | 'update_staff_roles'
  | 'delete_staff_roles'
  | 'manage_staff_permissions'
  | 'view_staff_permissions'
  | 'create_staff_permissions'
  | 'update_staff_permissions'
  | 'delete_staff_permissions'
  | 'view_platform_analytics'
  | 'export_platform_reports'
  | 'manage_platform_settings';

export interface StaffRole {
  id: number;
  name: string;
  description: string | null;
  permissions: StaffPermission[];
  created: string;
  updated: string;
}

export interface StaffProfile {
  id: number;
  role: number | null;
  role_id: number | null;
  role_name: string | null;
  role_details: StaffRole | null;
  permissions: StaffPermission[];
  created: string;
  updated: string;
}

// Staff Management Types
export interface StaffPermission {
  id: number;
  name: string;
  description: string | null;
  created: string;
  updated: string;
}

export interface StaffRole {
  id: number;
  name: string;
  description: string | null;
  permissions: StaffPermission[];
  permission_ids?: number[];
  staff_count: number;
  permissions_count?: number;
  created: string;
  updated: string;
}

export interface StaffProfileDetail {
  id: number;
  staff_user: AccountNested;
  staff_user_id: number;
  role: StaffRole | null;
  role_id: number | null;
  permissions: string[];
  created: string;
  updated: string;
}

export interface StaffProfileList {
  id: number;
  staff_user: AccountNested;
  role_name: string | null;
  role_id: number | null;
  permissions_count: number;
  created: string;
  updated: string;
}

// Analytics Types
export interface PlatformOverview {
  totals: {
    organisations: number;
    staff: number;
    users: number;
    tickets: number;
    employees: number;
  };
  recent_activity_30_days: {
    new_organisations: number;
    new_users: number;
    new_tickets: number;
    new_employees: number;
  };
  ticket_status: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  organisations_by_plan: Array<{
    plan: string;
    count: number;
  }>;
}

export interface OrganisationAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_plan: Array<{
    plan: string;
    count: number;
  }>;
  top_by_tickets: Array<{
    id: number;
    name: string;
    subdomain: string;
    plan: string;
    ticket_count: number;
  }>;
}

export interface TicketAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_status: Array<{
    status: string;
    count: number;
  }>;
  by_priority: Array<{
    priority: string;
    count: number;
  }>;
  by_organisation: Array<{
    organisation__name: string;
    organisation__id: number;
    count: number;
  }>;
  average_resolution_time_hours: number;
}

export interface UserAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_account_type: Array<{
    account_type: string;
    count: number;
  }>;
  by_verification_status: Array<{
    verification_status: string;
    count: number;
  }>;
}

export interface PlatformGrowth {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  daily_growth: Array<{
    date: string;
    organisations: number;
    users: number;
    tickets: number;
    employees: number;
  }>;
}

// Platform Settings Types
export interface PlatformSettings {
  platform_name: string | null;
  platform_email: string | null;
  platform_phone: string | null;
  enable_registration: boolean;
  enable_email_verification: boolean;
  enable_sms_verification: boolean;
  max_organisations_per_user: number | null;
  max_users_per_organisation: number | null;
  max_tickets_per_organisation: number | null;
  email_from_address: string | null;
  email_from_name: string | null;
  sms_provider: string | null;
  sms_sender_id: string | null;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_push_notifications: boolean;
  custom_settings: Record<string, any> | null;
}

export interface FeatureFlags {
  enable_registration: boolean;
  enable_email_verification: boolean;
  enable_sms_verification: boolean;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_push_notifications: boolean;
}

export interface ToggleFeatureRequest {
  feature: 'enable_registration' | 'enable_email_verification' | 'enable_sms_verification' | 'enable_email_notifications' | 'enable_sms_notifications' | 'enable_push_notifications';
  enabled: boolean;
}

export interface StaffUser {
  id: number;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  full_name: string;
  email: string;
  phone_number: string | null;
  is_staff: true;
  staff_profile: StaffProfile | null;
}

// Staff Management API Types
export interface StaffPermission {
  id: number;
  name: string;
  description: string | null;
  created: string;
  updated: string;
}

export interface StaffRoleDetail {
  id: number;
  name: string;
  description: string | null;
  permissions: StaffPermission[];
  permission_ids: number[];
  staff_count: number;
  created: string;
  updated: string;
}

export interface StaffRoleList {
  id: number;
  name: string;
  description: string | null;
  permissions_count: number;
  staff_count: number;
  created: string;
  updated: string;
}

export interface AccountNested {
  id: number;
  email: string | null;
  phone_number: string | null;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  full_name: string;
  account_type: string;
  is_staff: boolean;
  is_active: boolean;
  verification_status: string;
}

export interface StaffProfileDetail {
  id: number;
  staff_user: AccountNested;
  staff_user_id: number;
  role: StaffRoleDetail | null;
  role_id: number | null;
  permissions: string[];
  created: string;
  updated: string;
}

export interface StaffProfileList {
  id: number;
  staff_user: AccountNested;
  role_name: string | null;
  role_id: number | null;
  permissions_count: number;
  created: string;
  updated: string;
}

// Analytics API Types
export interface PlatformOverview {
  totals: {
    organisations: number;
    staff: number;
    users: number;
    tickets: number;
    employees: number;
  };
  recent_activity_30_days: {
    new_organisations: number;
    new_users: number;
    new_tickets: number;
    new_employees: number;
  };
  ticket_status: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  organisations_by_plan: Array<{
    plan: string;
    count: number;
  }>;
}

export interface OrganisationAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_plan: Array<{
    plan: string;
    count: number;
  }>;
  top_by_tickets: Array<{
    id: number;
    name: string;
    subdomain: string;
    plan: string;
    ticket_count: number;
  }>;
}

export interface TicketAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_status: Array<{
    status: string;
    count: number;
  }>;
  by_priority: Array<{
    priority: string;
    count: number;
  }>;
  by_organisation: Array<{
    organisation__name: string;
    organisation__id: number;
    count: number;
  }>;
  average_resolution_time_hours: number;
}

export interface UserAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_account_type: Array<{
    account_type: string;
    count: number;
  }>;
  by_verification_status: Array<{
    verification_status: string;
    count: number;
  }>;
}

export interface PlatformGrowth {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  daily_growth: Array<{
    date: string;
    organisations: number;
    users: number;
    tickets: number;
    employees: number;
  }>;
}

// Platform Settings API Types
export interface PlatformSettings {
  platform_name: string | null;
  platform_email: string | null;
  platform_phone: string | null;
  enable_registration: boolean;
  enable_email_verification: boolean;
  enable_sms_verification: boolean;
  max_organisations_per_user: number | null;
  max_users_per_organisation: number | null;
  max_tickets_per_organisation: number | null;
  email_from_address: string | null;
  email_from_name: string | null;
  sms_provider: string | null;
  sms_sender_id: string | null;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_push_notifications: boolean;
  custom_settings: Record<string, any> | null;
}

export interface FeatureFlags {
  enable_registration: boolean;
  enable_email_verification: boolean;
  enable_sms_verification: boolean;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_push_notifications: boolean;
}

export interface ToggleFeatureRequest {
  feature: 'enable_registration' | 'enable_email_verification' | 'enable_sms_verification' | 'enable_email_notifications' | 'enable_sms_notifications' | 'enable_push_notifications';
  enabled: boolean;
}
```

#### Best Practices

1. **Always check permissions on the frontend**: Don't rely solely on backend permission checks. Hide UI elements that users shouldn't access.

2. **Store permissions in auth state**: After login, store the user object with permissions in your auth context/state management.

3. **Refresh permissions when needed**: If an admin changes roles, call `/me` endpoint to refresh permissions.

4. **Handle missing permissions gracefully**: Show a friendly message if a user tries to access something they don't have permission for.

5. **Use permission checks consistently**: Create reusable permission checking utilities and use them throughout your app.

6. **Test with different roles**: Make sure to test your UI with different staff roles to ensure proper permission enforcement.

### Staff Organization Management

Staff members can manage organizations on the platform. All endpoints require staff authentication and check for appropriate permissions through staff roles.

**Base Path**: `/api/v1/staff/organisation/`

**Authentication**: Required (Staff JWT token)

**Permissions**: 
- Staff users must have the `manage_organisations` permission to create/update organizations
- Staff users must have the `view_organisations` permission to view organizations
- Permissions are checked through `StaffProfile` and `StaffRole`

#### List Organizations

**Endpoint**: `GET /api/v1/staff/organisation/`

**Authentication**: Required

**Query Parameters**:
- `?name=acme` - Filter by organization name (case-insensitive partial match)
- `?subdomain=acme` - Filter by subdomain (case-insensitive partial match)
- `?plan=free` - Filter by plan: `free`, `pro`, `enterprise`

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 10,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "Acme Corp",
      "subdomain": "acme",
      "email": "admin@acme.com",
      "plan": "free",
      "settings": {},
      "email_domain": null,
      "allowed_auth_methods": ["local"],
      "address": null,
      "logo": null,
      "owner": 5,
      "owner_details": {
        "id": 5,
        "email": "john.doe@acme.com",
        "phone_number": "+1234567890",
        "first_name": "John",
        "last_name": "Doe",
        "middle_name": null,
        "full_name": "John Doe",
        "account_type": "business_owner",
        "verification_status": "verified",
        "created": "2024-01-10T08:00:00Z"
      },
      "employee_count": 42,
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-15T10:30:00Z",
      "deleted": null
    }
  ]
}
```

**Response Fields**:
- Pagination metadata (`links`, `count`, `total_pages`)
- `data` - Array of organization objects, each containing:
  - All organization fields (id, name, subdomain, email, plan, etc.)
  - `owner` - ID of the owner account (null if no owner)
  - `owner_details` - Owner account details object (null if no owner assigned):
    - `id`, `email`, `phone_number`, `first_name`, `last_name`, `middle_name`, `full_name`
    - `account_type`, `verification_status`, `created`
  - `employee_count` - Number of employees in the organization

#### Get Organization Details

**Endpoint**: `GET /api/v1/staff/organisation/{id}/`

**Authentication**: Required

**Permissions**: Requires `view_organisations` permission

**Response** (200 OK): Returns detailed organization information including owner details and employee count:
```json
{
  "id": 1,
  "name": "Acme Corporation",
  "subdomain": "acme",
  "email": "admin@acme.com",
  "plan": "pro",
  "settings": {
    "feature_enabled": true
  },
  "email_domain": "acme.com",
  "allowed_auth_methods": ["local", "google"],
  "logo": "/media/business_logos/acme_logo.png",
  "owner": 5,
  "owner_details": {
    "id": 5,
    "email": "john.doe@acme.com",
    "phone_number": "+1234567890",
    "first_name": "John",
    "last_name": "Doe",
    "middle_name": null,
    "full_name": "John Doe",
    "account_type": "business_owner",
    "verification_status": "verified",
    "created": "2024-01-10T08:00:00Z"
  },
  "employee_count": 42,
  "created": "2024-01-10T08:00:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "deleted": null,
  "address": {
    "id": 1,
    "country": "US",
    "address_line_1": "123 Main St",
    "address_line_2": null,
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

**Response Fields**:
- All organization fields (id, name, subdomain, email, plan, settings, etc.)
- `owner` - ID of the owner account (null if no owner assigned)
- `owner_details` - Object containing owner account details:
  - `id` - Owner account ID
  - `email` - Owner email address
  - `phone_number` - Owner phone number (E.164 format)
  - `first_name` - Owner first name
  - `last_name` - Owner last name
  - `middle_name` - Owner middle name (null if not provided)
  - `full_name` - Computed full name (`"{first_name} {last_name}"`)
  - `account_type` - Always `"business_owner"` for owners
  - `verification_status` - Account verification status: `"pending"`, `"review"`, `"verified"`, or `"suspended"`
  - `created` - Account creation timestamp (ISO 8601 format)
- `employee_count` - Total number of employees in the organization (includes the owner if they have an EmployeeProfile)
- `address` - Organization address object (null if no address assigned)

**Alternative Endpoint**:
**Endpoint**: `GET /api/v1/staff/organisation/{id}/details`

Returns the same detailed organization information as the main endpoint.

#### Create Organization

**Endpoint**: `POST /api/v1/staff/organisation/`

**Authentication**: Required

**Permissions**: Requires `manage_organisations` permission

**Request Body** (Option 1: With existing owner):
```json
{
  "name": "New Company",
  "subdomain": "newcompany",
  "email": "admin@newcompany.com",
  "plan": "free",
  "settings": {},
  "email_domain": "newcompany.com",
  "allowed_auth_methods": ["local", "google"],
  "owner": 5,
  "country": "US",
  "address_line_1": "123 Main St"
}
```

**Request Body** (Option 2: Create new owner):
```json
{
  "name": "New Company",
  "subdomain": "newcompany",
  "email": "admin@newcompany.com",
  "plan": "free",
  "settings": {},
  "email_domain": "newcompany.com",
  "allowed_auth_methods": ["local", "google"],
  "owner_data": {
    "phone_number": "+1234567890",
    "email": "owner@newcompany.com",
    "first_name": "John",
    "last_name": "Doe",
    "gender": "male",
    "country": "US",
    "address_line_1": "123 Main St"
  },
  "country": "US",
  "address_line_1": "123 Main St"
}
```

**Required Fields**:
- `name` - Organization name
- `subdomain` - Unique subdomain (must be unique across all organizations)

**Optional Fields**:
- `email` - Organization email address
- `plan` - Plan type: `free`, `pro`, `enterprise` (default: `free`)
- `settings` - JSON object with organization settings
- `email_domain` - Email domain for organization (e.g., `"company.com"`)
- `allowed_auth_methods` - Array of allowed auth methods: `["local"]`, `["local", "google"]`, etc.
- `owner` - ID of existing Account with `account_type="business_owner"` to assign as owner
- `owner_data` - Object with account data to create a new owner account (must include `phone_number`)
  - `phone_number` - Required, must be unique
  - `email` - Optional
  - `first_name` - Optional
  - `last_name` - Optional
  - `middle_name` - Optional
  - `gender` - Optional (`"male"` or `"female"`)
  - `country` - Optional, for owner address
  - `address_line_1` - Optional, for owner address
- `country` - Optional, for organization address
- `address_line_1` - Optional, for organization address
- `enabled_modules` - Optional. JSON array of module keys to enable for this tenant, or `null`/omit for **all** modules (same semantics as staff **update**). This is the primary way to provision a limited module set at signup.

**Important Notes**:
- Either `owner` OR `owner_data` can be provided, but **not both**
- If `owner_data` is provided, a new Account will be created with `account_type="business_owner"` and default password `"0000"`
- When an owner is assigned, the system automatically:
  - Creates standard roles for the organization (via signal)
  - Creates an EmployeeProfile for the owner
  - Assigns the "Super Admin" role to the owner
- If no owner is provided, the organization is created without an owner (can be assigned later via update)

**Validation Rules**:
- Subdomain must be unique
- Subdomain cannot be empty
- Plan must be one of: `free`, `pro`, `enterprise`
- If `owner` is provided, the account must exist and have `account_type="business_owner"`
- If `owner` is provided, the account cannot already be owner of another organization
- If `owner_data` is provided, `phone_number` is required and must be unique
- Cannot provide both `owner` and `owner_data`

**Response** (201 Created): Returns the created organization with owner details and employee count:
```json
{
  "id": 1,
  "name": "New Company",
  "subdomain": "newcompany",
  "email": "admin@newcompany.com",
  "plan": "free",
  "settings": {},
  "email_domain": "newcompany.com",
  "allowed_auth_methods": ["local", "google"],
  "logo": null,
  "owner": 5,
  "owner_details": {
    "id": 5,
    "email": "owner@newcompany.com",
    "phone_number": "+1234567890",
    "first_name": "John",
    "last_name": "Doe",
    "middle_name": null,
    "full_name": "John Doe",
    "account_type": "business_owner",
    "verification_status": "pending",
    "created": "2024-01-15T10:30:00Z"
  },
  "employee_count": 1,
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "deleted": null,
  "address": null
}
```

**Response Fields**:
- All organization fields (id, name, subdomain, email, plan, etc.)
- `owner` - ID of the owner account (null if no owner assigned)
- `owner_details` - Object containing owner account details:
  - `id` - Owner account ID
  - `email` - Owner email address
  - `phone_number` - Owner phone number
  - `first_name` - Owner first name
  - `last_name` - Owner last name
  - `middle_name` - Owner middle name
  - `full_name` - Computed full name
  - `account_type` - Always `"business_owner"` for owners
  - `verification_status` - Account verification status
  - `created` - Account creation timestamp
- `employee_count` - Number of employees in the organization (includes the owner)

#### Update Organization

**Endpoint**: `PATCH /api/v1/staff/organisation/{id}/` (partial update)
**Endpoint**: `PUT /api/v1/staff/organisation/{id}/` (full update)

**Authentication**: Required

**Permissions**: Requires `manage_organisations` permission

**Request Body** (PATCH example):
```json
{
  "name": "Updated Company Name",
  "email": "newemail@company.com",
  "plan": "pro",
  "settings": {
    "feature_enabled": true
  },
  "email_domain": "updatedcompany.com",
  "allowed_auth_methods": ["local", "google", "microsoft"],
  "owner": 10
}
```

**Optional Fields**:
- `name` - Organization name
- `email` - Organization email address
- `plan` - Plan type: `free`, `pro`, `enterprise`
- `settings` - JSON object with organization settings
- `email_domain` - Email domain for organization
- `allowed_auth_methods` - Array of allowed auth methods
- `owner` - ID of existing Account with `account_type="business_owner"` to assign as owner (can change owner)
- `enabled_modules` - JSON array of module keys for this org, or `null` for “all enabled modules”. **Staff-only control:** this field (and Django admin on `Organisation`) is how enabled modules are set; tenant users cannot change it via the client API.

**Note**: 
- Subdomain cannot be updated after creation
- When changing `owner`, the new owner account must have `account_type="business_owner"` and cannot be owner of another organization

**Response** (200 OK): Returns the updated organization with owner details and employee count (same format as Get Organization Details response)

**Important Notes**:
- All organization endpoints require staff authentication
- Staff users must have appropriate permissions through their `StaffProfile` and `StaffRole`
- Organizations are sorted by creation date (newest first)
- The `subdomain` field is immutable after creation
- The `owner` field is set separately (typically during organization creation by business owners)
- Organizations cannot be deleted through the API

#### Staff: product module catalog (pricing & availability)

Global catalog rows drive default **monthly prices**, **labels**, **sort order**, and **`is_active`** (inactive modules are hidden from the customer module picker and denied at the permission layer when the catalog table is in use). Seeded by migration `0055_productmodule`; manage in **Django admin → Product modules** or via API.

**Base path**: `/api/v1/staff/product-modules/`

**Permissions**: **`view_product_modules`** — list/retrieve catalog (GET). **`manage_product_modules`** — create/update/delete rows. Staff with **`manage_organisations`** retain full catalog access (legacy). **`super_admin`** as usual.

**Authentication**: Staff JWT

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/staff/product-modules/` | List all catalog rows (including inactive) |
| POST | `/api/v1/staff/product-modules/` | Create row (`key` must already exist in code: `ALL_MODULE_KEYS`) |
| GET | `/api/v1/staff/product-modules/{id}/` | Retrieve |
| PATCH / PUT | `/api/v1/staff/product-modules/{id}/` | Update label, description, monthly_price, sort_order, is_active |
| DELETE | `/api/v1/staff/product-modules/{id}/` | Remove row (falls back to code defaults for that key until re-seeded) |

**Django admin**: **Product modules** — edit `monthly_price`, `is_active`, ordering, copy.

### Staff Roles and Permissions

Staff members are organized using roles and permissions similar to client users, but at the platform level (not organization-specific).

**Models**:
- `StaffPermission` - Platform-wide permissions (e.g., `manage_organisations`, `view_organisations`, `super_admin`)
- `StaffRole` - Roles for staff members (e.g., `Super Admin`, `Support Manager`, `Onboarding Specialist`)
- `StaffProfile` - Links `AdminUser` to `StaffRole` with permission checking

**Permission Checking**:
- Staff permissions are checked through the `StaffProfile.has_permission()` method
- `super_admin` permission grants access to all operations
- Permissions can be assigned to roles, and roles are assigned to staff users

### Staff Management APIs

Staff members can manage other staff members, roles, and permissions through dedicated API endpoints. All endpoints require staff authentication and check for appropriate permissions.

**Base Path**: `/api/v1/staff/staff/`

**Authentication**: Required (Staff JWT token)

**Permissions**: 
- Staff users must have the `manage_staff` permission to create/update/delete staff profiles
- Staff users must have the `view_staff` permission to view staff profiles
- Staff users must have the `manage_staff_roles` permission to manage roles
- Staff users must have the `view_staff_roles` permission to view roles
- Staff users must have the `manage_staff_permissions` permission to manage permissions
- Staff users must have the `view_staff_permissions` permission to view permissions

#### Staff Permissions

**List Permissions**

**Endpoint**: `GET /api/v1/staff/staff/permissions`

**Authentication**: Required

**Permissions**: Requires `view_staff_permissions` permission

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 25,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "manage_organisations",
      "description": "Can create, update, and delete organisations",
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    },
    {
      "id": 2,
      "name": "view_organisations",
      "description": "Can view organisation details",
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    }
  ]
}
```

**Get Permission Details**

**Endpoint**: `GET /api/v1/staff/staff/permissions/{id}`

**Authentication**: Required

**Permissions**: Requires `view_staff_permissions` permission

**Response**: Returns permission details (same format as list item)

**Create Permission**

**Endpoint**: `POST /api/v1/staff/staff/permissions`

**Authentication**: Required

**Permissions**: Requires `manage_staff_permissions` permission

**Request Body**:
```json
{
  "name": "custom_permission",
  "description": "Description of the permission"
}
```

**Required Fields**:
- `name` - Permission name (must be unique, max 255 characters)

**Optional Fields**:
- `description` - Permission description

**Response**: Returns the created permission

**Update Permission**

**Endpoint**: `PATCH /api/v1/staff/staff/permissions/{id}` (partial update)
**Endpoint**: `PUT /api/v1/staff/staff/permissions/{id}` (full update)

**Authentication**: Required

**Permissions**: Requires `manage_staff_permissions` permission

**Request Body**:
```json
{
  "name": "updated_permission_name",
  "description": "Updated description"
}
```

**Response**: Returns the updated permission

**Delete Permission**

**Endpoint**: `DELETE /api/v1/staff/staff/permissions/{id}`

**Authentication**: Required

**Permissions**: Requires `manage_staff_permissions` permission

**Response**: `204 No Content` on success

#### Staff Roles

**List Roles**

**Endpoint**: `GET /api/v1/staff/staff/roles`

**Authentication**: Required

**Permissions**: Requires `view_staff_roles` permission

**Query Parameters**:
- `?name=admin` - Filter by role name (case-insensitive partial match)
- `?permission=1` - Filter roles that have a specific permission ID

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 5,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "Super Admin",
      "description": "Full platform access",
      "permissions_count": 25,
      "staff_count": 2,
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    }
  ]
}
```

**Get Role Details**

**Endpoint**: `GET /api/v1/staff/staff/roles/{id}`

**Authentication**: Required

**Permissions**: Requires `view_staff_roles` permission

**Response**:
```json
{
  "id": 1,
  "name": "Super Admin",
  "description": "Full platform access. Can manage all organisations, staff, and platform settings.",
  "permissions": [
    {
      "id": 1,
      "name": "super_admin",
      "description": "Full platform access",
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    },
    {
      "id": 2,
      "name": "manage_organisations",
      "description": "Can manage organisations",
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    }
  ],
  "permission_ids": [1, 2],
  "staff_count": 2,
  "created": "2024-01-10T08:00:00Z",
  "updated": "2024-01-10T08:00:00Z"
}
```

**Create Role**

**Endpoint**: `POST /api/v1/staff/staff/roles`

**Authentication**: Required

**Permissions**: Requires `manage_staff_roles` permission

**Request Body**:
```json
{
  "name": "Support Manager",
  "description": "Manages support operations",
  "permission_ids": [2, 3, 4]
}
```

**Required Fields**:
- `name` - Role name (must be unique, max 100 characters)

**Optional Fields**:
- `description` - Role description
- `permission_ids` - Array of permission IDs to assign to the role

**Response**: Returns the created role (same format as Get Role Details)

**Update Role**

**Endpoint**: `PATCH /api/v1/staff/staff/roles/{id}` (partial update)
**Endpoint**: `PUT /api/v1/staff/staff/roles/{id}` (full update)

**Authentication**: Required

**Permissions**: Requires `manage_staff_roles` permission

**Request Body**:
```json
{
  "name": "Updated Role Name",
  "description": "Updated description",
  "permission_ids": [1, 2, 3, 4]
}
```

**Response**: Returns the updated role

**Delete Role**

**Endpoint**: `DELETE /api/v1/staff/staff/roles/{id}`

**Authentication**: Required

**Permissions**: Requires `manage_staff_roles` permission

**Response**: `204 No Content` on success

**Assign Permissions to Role**

**Endpoint**: `POST /api/v1/staff/staff/roles/{id}/assign_permissions`

**Authentication**: Required

**Permissions**: Requires `manage_staff_roles` permission

**Request Body**:
```json
{
  "permission_ids": [5, 6, 7]
}
```

**Response**: Returns the updated role with all permissions

**Remove Permissions from Role**

**Endpoint**: `POST /api/v1/staff/staff/roles/{id}/remove_permissions`

**Authentication**: Required

**Permissions**: Requires `manage_staff_roles` permission

**Request Body**:
```json
{
  "permission_ids": [5, 6]
}
```

**Response**: Returns the updated role

#### Staff Profiles

**List Staff Profiles**

**Endpoint**: `GET /api/v1/staff/staff/profiles`

**Authentication**: Required

**Permissions**: Requires `view_staff` permission

**Query Parameters**:
- `?role=1` - Filter by role ID
- `?search=john` - Search by name, email, or phone number
- `?permission=1` - Filter staff with roles that have a specific permission ID

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 10,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "staff_user": {
        "id": 5,
        "email": "staff@snapdesk.com",
        "phone_number": "+1234567890",
        "first_name": "Jane",
        "last_name": "Doe",
        "middle_name": null,
        "full_name": "Jane Doe",
        "account_type": "staff",
        "is_staff": true,
        "is_active": true,
        "verification_status": "verified"
      },
      "role_name": "Super Admin",
      "role_id": 1,
      "permissions_count": 25,
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    }
  ]
}
```

**Get Staff Profile Details**

**Endpoint**: `GET /api/v1/staff/staff/profiles/{id}`

**Authentication**: Required

**Permissions**: Requires `view_staff` permission

**Response**:
```json
{
  "id": 1,
  "staff_user": {
    "id": 5,
    "email": "staff@snapdesk.com",
    "phone_number": "+1234567890",
    "first_name": "Jane",
    "last_name": "Doe",
    "middle_name": null,
    "full_name": "Jane Doe",
    "account_type": "staff",
    "is_staff": true,
    "is_active": true,
    "verification_status": "verified"
  },
  "staff_user_id": 5,
  "role": {
    "id": 1,
    "name": "Super Admin",
    "description": "Full platform access",
    "permissions": [
      {
        "id": 1,
        "name": "super_admin",
        "description": "Full platform access",
        "created": "2024-01-10T08:00:00Z",
        "updated": "2024-01-10T08:00:00Z"
      }
    ],
    "permission_ids": [1, 2, 3],
    "staff_count": 2,
    "created": "2024-01-10T08:00:00Z",
    "updated": "2024-01-10T08:00:00Z"
  },
  "role_id": 1,
  "permissions": [
    "super_admin",
    "manage_organisations",
    "view_organisations"
  ],
  "created": "2024-01-10T08:00:00Z",
  "updated": "2024-01-10T08:00:00Z"
}
```

**Create Staff Profile**

**Endpoint**: `POST /api/v1/staff/staff/profiles`

**Authentication**: Required

**Permissions**: Requires `manage_staff` permission

**Request Body**:
```json
{
  "staff_user_id": 5,
  "role_id": 1
}
```

**Required Fields**:
- `staff_user_id` - Account ID (must have `is_staff=True`)

**Optional Fields**:
- `role_id` - Role ID to assign to the staff member

**Response**: Returns the created staff profile (same format as Get Staff Profile Details)

**Error Responses**:
- `400 Bad Request`: If account already has a staff profile
- `400 Bad Request`: If account does not have `is_staff=True`

**Update Staff Profile**

**Endpoint**: `PATCH /api/v1/staff/staff/profiles/{id}` (partial update)
**Endpoint**: `PUT /api/v1/staff/staff/profiles/{id}` (full update)

**Authentication**: Required

**Permissions**: Requires `manage_staff` permission

**Request Body**:
```json
{
  "role_id": 2
}
```

**Response**: Returns the updated staff profile

**Delete Staff Profile**

**Endpoint**: `DELETE /api/v1/staff/staff/profiles/{id}`

**Authentication**: Required

**Permissions**: Requires `manage_staff` permission

**Response**: `204 No Content` on success

**Assign Role to Staff Member**

**Endpoint**: `POST /api/v1/staff/staff/profiles/{id}/assign_role`

**Authentication**: Required

**Permissions**: Requires `manage_staff` permission

**Request Body**:
```json
{
  "role_id": 2
}
```

**Response**: Returns the updated staff profile

**Remove Role from Staff Member**

**Endpoint**: `POST /api/v1/staff/staff/profiles/{id}/remove_role`

**Authentication**: Required

**Permissions**: Requires `manage_staff` permission

**Response**: Returns the updated staff profile with `role` set to `null`

**Get Current Staff Profile**

**Endpoint**: `GET /api/v1/staff/staff/profiles/me`

**Authentication**: Required

**Description**: Get the current authenticated staff member's profile

**Response**: Returns the current staff member's profile (same format as Get Staff Profile Details)

**Error Responses**:
- `404 Not Found`: If staff profile does not exist for the current user

**Important Notes**:
- All staff management endpoints require staff authentication
- Staff users must have appropriate permissions through their `StaffProfile` and `StaffRole`
- Staff profiles link `Account` instances (with `is_staff=True`) to `StaffRole` instances
- When creating a staff profile, the account must already exist and have `is_staff=True`
- Roles can be assigned/removed from staff members without deleting the profile
- The `permissions` field in staff profile responses shows all permissions from the assigned role
- Use query parameters for filtering and searching staff profiles

### Staff Analytics APIs

Staff members can view platform-wide analytics and insights. All endpoints require staff authentication and the `view_platform_analytics` permission.

**Base Path**: `/api/v1/staff/analytics/`

**Authentication**: Required (Staff JWT token)

**Permissions**: 
- Staff users must have the `view_platform_analytics` permission to view analytics
- Staff users must have the `export_platform_reports` permission to export reports

#### Platform Overview

**Endpoint**: `GET /api/v1/staff/analytics/overview`

**Authentication**: Required

**Permissions**: Requires `view_platform_analytics` permission

**Description**: Get platform-wide overview statistics including totals, recent activity, and ticket status breakdown.

**Response**:
```json
{
  "totals": {
    "organisations": 50,
    "staff": 10,
    "users": 500,
    "tickets": 1500,
    "employees": 250
  },
  "recent_activity_30_days": {
    "new_organisations": 5,
    "new_users": 50,
    "new_tickets": 200,
    "new_employees": 25
  },
  "ticket_status": {
    "open": 300,
    "in_progress": 150,
    "resolved": 200,
    "closed": 850
  },
  "organisations_by_plan": [
    {
      "plan": "free",
      "count": 30
    },
    {
      "plan": "pro",
      "count": 15
    },
    {
      "plan": "enterprise",
      "count": 5
    }
  ]
}
```

#### Organisation Analytics

**Endpoint**: `GET /api/v1/staff/analytics/organisations`

**Authentication**: Required

**Permissions**: Requires `view_platform_analytics` permission

**Query Parameters**:
- `?start_date=2024-01-01` - Filter organisations created on or after this date (ISO format: YYYY-MM-DD)
- `?end_date=2024-12-31` - Filter organisations created on or before this date (ISO format: YYYY-MM-DD)

**Response**:
```json
{
  "created_over_time": [
    {
      "date": "2024-01-15",
      "count": 2
    },
    {
      "date": "2024-01-16",
      "count": 3
    }
  ],
  "by_plan": [
    {
      "plan": "free",
      "count": 30
    },
    {
      "plan": "pro",
      "count": 15
    }
  ],
  "top_by_tickets": [
    {
      "id": 1,
      "name": "Acme Corp",
      "subdomain": "acme",
      "plan": "pro",
      "ticket_count": 150
    },
    {
      "id": 2,
      "name": "Tech Solutions",
      "subdomain": "tech",
      "plan": "enterprise",
      "ticket_count": 120
    }
  ]
}
```

#### Ticket Analytics

**Endpoint**: `GET /api/v1/staff/analytics/tickets`

**Authentication**: Required

**Permissions**: Requires `view_platform_analytics` permission

**Query Parameters**:
- `?start_date=2024-01-01` - Filter tickets created on or after this date (ISO format: YYYY-MM-DD)
- `?end_date=2024-12-31` - Filter tickets created on or before this date (ISO format: YYYY-MM-DD)

**Response**:
```json
{
  "created_over_time": [
    {
      "date": "2024-01-15",
      "count": 25
    },
    {
      "date": "2024-01-16",
      "count": 30
    }
  ],
  "by_status": [
    {
      "status": "open",
      "count": 300
    },
    {
      "status": "closed",
      "count": 850
    }
  ],
  "by_priority": [
    {
      "priority": "urgent",
      "count": 50
    },
    {
      "priority": "high",
      "count": 200
    }
  ],
  "by_organisation": [
    {
      "organisation__name": "Acme Corp",
      "organisation__id": 1,
      "count": 150
    }
  ],
  "average_resolution_time_hours": 24.5
}
```

#### User Analytics

**Endpoint**: `GET /api/v1/staff/analytics/users`

**Authentication**: Required

**Permissions**: Requires `view_platform_analytics` permission

**Query Parameters**:
- `?start_date=2024-01-01` - Filter users created on or after this date (ISO format: YYYY-MM-DD)
- `?end_date=2024-12-31` - Filter users created on or before this date (ISO format: YYYY-MM-DD)

**Response**:
```json
{
  "created_over_time": [
    {
      "date": "2024-01-15",
      "count": 10
    },
    {
      "date": "2024-01-16",
      "count": 15
    }
  ],
  "by_account_type": [
    {
      "account_type": "user",
      "count": 300
    },
    {
      "account_type": "employee",
      "count": 200
    }
  ],
  "by_verification_status": [
    {
      "verification_status": "verified",
      "count": 400
    },
    {
      "verification_status": "pending",
      "count": 100
    }
  ]
}
```

#### Platform Growth Metrics

**Endpoint**: `GET /api/v1/staff/analytics/growth`

**Authentication**: Required

**Permissions**: Requires `view_platform_analytics` permission

**Query Parameters**:
- `?days=90` - Number of days to include in growth metrics (default: 90)

**Description**: Get daily growth metrics for organisations, users, tickets, and employees over a specified period.

**Response**:
```json
{
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "days": 90
  },
  "daily_growth": [
    {
      "date": "2024-01-01",
      "organisations": 0,
      "users": 5,
      "tickets": 10,
      "employees": 2
    },
    {
      "date": "2024-01-02",
      "organisations": 1,
      "users": 3,
      "tickets": 8,
      "employees": 1
    }
  ]
}
```

**Important Notes**:
- All analytics endpoints require staff authentication
- Staff users must have the `view_platform_analytics` permission
- Date filters use ISO format (YYYY-MM-DD)
- All metrics are calculated in real-time from the database
- Growth metrics show daily counts for the specified period

### Platform Settings APIs

Staff members can manage platform-wide settings and feature flags. All endpoints require staff authentication and the `manage_platform_settings` permission.

**Base Path**: `/api/v1/staff/settings/`

**Authentication**: Required (Staff JWT token)

**Permissions**: 
- Staff users must have the `manage_platform_settings` permission to update settings
- Staff users must have the `view_platform_settings` permission to view settings

#### Get Current Settings

**Endpoint**: `GET /api/v1/staff/settings/current`

**Authentication**: Required

**Permissions**: Requires `view_platform_settings` or `manage_platform_settings` permission

**Description**: Get current platform settings including feature flags, limits, and configuration.

**Response**:
```json
{
  "platform_name": "Snapdesk",
  "platform_email": "support@snapdesk.com",
  "platform_phone": "+1234567890",
  "enable_registration": true,
  "enable_email_verification": true,
  "enable_sms_verification": true,
  "max_organisations_per_user": null,
  "max_users_per_organisation": null,
  "max_tickets_per_organisation": null,
  "email_from_address": "noreply@snapdesk.com",
  "email_from_name": "Snapdesk",
  "sms_provider": null,
  "sms_sender_id": null,
  "enable_email_notifications": true,
  "enable_sms_notifications": false,
  "enable_push_notifications": true,
  "custom_settings": {}
}
```

#### Update Settings

**Endpoint**: `PUT /api/v1/staff/settings/update_settings` (full update)
**Endpoint**: `PATCH /api/v1/staff/settings/update_settings` (partial update)

**Authentication**: Required

**Permissions**: Requires `manage_platform_settings` permission

**Request Body** (PATCH example):
```json
{
  "platform_name": "Updated Platform Name",
  "enable_registration": false,
  "max_users_per_organisation": 100,
  "enable_email_notifications": true
}
```

**Optional Fields**:
- `platform_name` - Platform name
- `platform_email` - Platform email address
- `platform_phone` - Platform phone number
- `enable_registration` - Enable user registration (boolean)
- `enable_email_verification` - Enable email verification (boolean)
- `enable_sms_verification` - Enable SMS verification (boolean)
- `max_organisations_per_user` - Maximum organisations per user (integer, null for unlimited)
- `max_users_per_organisation` - Maximum users per organisation (integer, null for unlimited)
- `max_tickets_per_organisation` - Maximum tickets per organisation (integer, null for unlimited)
- `email_from_address` - Email sender address
- `email_from_name` - Email sender name
- `sms_provider` - SMS provider name
- `sms_sender_id` - SMS sender ID
- `enable_email_notifications` - Enable email notifications (boolean)
- `enable_sms_notifications` - Enable SMS notifications (boolean)
- `enable_push_notifications` - Enable push notifications (boolean)
- `custom_settings` - Custom settings JSON object

**Response**:
```json
{
  "message": "Settings updated successfully",
  "settings": {
    "platform_name": "Updated Platform Name",
    "enable_registration": false,
    "max_users_per_organisation": 100
  }
}
```

**Note**: In a production environment, settings are typically stored in a database model. This endpoint provides a simplified interface for managing platform configuration.

#### Get Feature Flags

**Endpoint**: `GET /api/v1/staff/settings/feature_flags`

**Authentication**: Required

**Permissions**: Requires `view_platform_settings` or `manage_platform_settings` permission

**Description**: Get all feature flags and their current states.

**Response**:
```json
{
  "enable_registration": true,
  "enable_email_verification": true,
  "enable_sms_verification": true,
  "enable_email_notifications": true,
  "enable_sms_notifications": false,
  "enable_push_notifications": true
}
```

#### Toggle Feature Flag

**Endpoint**: `POST /api/v1/staff/settings/toggle_feature`

**Authentication**: Required

**Permissions**: Requires `manage_platform_settings` permission

**Request Body**:
```json
{
  "feature": "enable_registration",
  "enabled": false
}
```

**Required Fields**:
- `feature` - Feature flag name (must be one of the valid features)
- `enabled` - Boolean value to set the feature flag

**Valid Features**:
- `enable_registration`
- `enable_email_verification`
- `enable_sms_verification`
- `enable_email_notifications`
- `enable_sms_notifications`
- `enable_push_notifications`

**Response**:
```json
{
  "message": "Feature enable_registration disabled",
  "feature": "enable_registration",
  "enabled": false
}
```

**Error Responses**:
- `400 Bad Request`: If `feature` is missing or invalid
- `400 Bad Request`: If `enabled` is missing

**Important Notes**:
- All settings endpoints require staff authentication
- Staff users must have the `manage_platform_settings` permission to update settings
- Settings are stored in Django settings or a database model (implementation-dependent)
- Feature flags control platform-wide functionality
- Use `toggle_feature` for quick feature flag changes
- Use `update_settings` for bulk configuration updates

---

## Staff API

### Staff Authentication

Staff members authenticate using **email-based** authentication with a 6-digit verification code. Staff users are created through Django admin and use a separate authentication system from client users.

**Key Differences from Client Authentication:**
- Uses **email** instead of phone number
- 6-digit code (default: `"000000"` in development)
- Separate authentication endpoints: `/api/v1/staff/auth/`
- Staff users must have `is_staff=True` and a valid email address

### Staff Authentication Flow

1. **Send Verification Code** - Staff member enters their email
2. **Receive Code** - Code is sent via email (defaults to `"000000"` in development)
3. **Login with Email + Code** - Staff member enters email and 6-digit code
4. **Receive JWT Tokens** - Access + Refresh tokens in response headers
5. **Use Access Token** - Include in `Authorization` header for authenticated requests

### Staff Authentication Endpoints

#### 1. Send Staff Verification Code

**Endpoint**: `POST /api/v1/staff/auth/account/send_verification_code`

**Request Body**:
```json
{
  "email": "staff@snapdesk.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Code sent!"
}
```

**Important Notes**:
- The email must belong to a staff user with `is_staff=True`
- In development, the code defaults to `"000000"`
- The code is sent via email (email sending needs to be configured for production)
- The code is set as a one-time password that expires after use

#### 2. Staff Login

**Endpoint**: `POST /api/v1/staff/auth/account/login`

**Request Body**:
```json
{
  "email": "staff@snapdesk.com",
  "code": "000000"
}
```

**Response Headers**:
- `set-auth-token`: Access token (JWT)
- `set-refresh-token`: Refresh token (JWT)

**Response Body**:
```json
{
  "id": 1,
  "first_name": "Jane",
  "last_name": "Doe",
  "middle_name": null,
  "full_name": "Jane Doe",
  "email": "staff@snapdesk.com",
  "phone_number": "+1234567890",
  "is_staff": true,
  "staff_profile": {
    "id": 1,
    "role": 1,
    "role_id": 1,
    "role_name": "Super Admin",
    "role_details": {
      "id": 1,
      "name": "Super Admin",
      "description": "Full platform access. Can manage all organisations, staff, and platform settings.",
      "permissions": [
        "super_admin",
        "manage_organisations",
        "view_organisations",
        "create_organisations",
        "update_organisations",
        "manage_staff",
        "view_staff",
        "create_staff",
        "update_staff",
        "delete_staff",
        "manage_staff_roles",
        "view_staff_roles",
        "create_staff_roles",
        "update_staff_roles",
        "delete_staff_roles",
        "manage_staff_permissions",
        "view_staff_permissions",
        "create_staff_permissions",
        "update_staff_permissions",
        "delete_staff_permissions",
        "view_platform_analytics",
        "export_platform_reports",
        "manage_platform_settings"
      ],
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    },
    "permissions": [
      "super_admin",
      "manage_organisations",
      "view_organisations",
      "create_organisations",
      "update_organisations",
      "manage_staff",
      "view_staff",
      "create_staff",
      "update_staff",
      "delete_staff",
      "manage_staff_roles",
      "view_staff_roles",
      "create_staff_roles",
      "update_staff_roles",
      "delete_staff_roles",
      "manage_staff_permissions",
      "view_staff_permissions",
      "create_staff_permissions",
      "update_staff_permissions",
      "delete_staff_permissions",
      "view_platform_analytics",
      "export_platform_reports",
      "manage_platform_settings"
    ],
    "created": "2024-01-10T08:00:00Z",
    "updated": "2024-01-10T08:00:00Z"
  }
}
```

**Response Fields**:
- `id` - Staff account ID
- `first_name`, `last_name`, `middle_name` - Staff member's name
- `full_name` - Computed full name
- `email` - Staff email address
- `phone_number` - Staff phone number
- `is_staff` - Always `true` for staff accounts
- `staff_profile` - Staff profile object (null if no profile exists):
  - `id` - Staff profile ID
  - `role` - Role ID (for write operations)
  - `role_id` - Role ID (read-only)
  - `role_name` - Role name (read-only)
  - `role_details` - Full role object with all permissions:
    - `id`, `name`, `description`
    - `permissions` - Array of all permission names in this role
    - `created`, `updated` - Timestamps
  - `permissions` - Array of all permission names the staff member has (same as `role_details.permissions`)
  - `created`, `updated` - Profile timestamps

**Important Notes**:
- Default code in development is `"000000"` - this should be changed in production
- After successful login, the password is changed to a random string (one-time use)
- Staff users are authenticated using `StaffAuthentication` class which validates `is_staff=True`
- Tokens have the same lifetime as client tokens (2 days)
- The response includes `staff_profile` object with complete role and permissions information
- Use `staff_profile.permissions` array to control UI visibility and functionality (see Staff Permissions section below)
- If `staff_profile` is `null`, the staff member has no role assigned and should contact an admin

#### 3. Get Current Staff User (with Permissions)

**Endpoint**: `GET /api/v1/staff/auth/account/me`

**Authentication**: Required (Staff JWT token)

**Response** (same format as login response):
```json
{
  "id": 1,
  "first_name": "Jane",
  "last_name": "Doe",
  "middle_name": null,
  "full_name": "Jane Doe",
  "email": "staff@snapdesk.com",
  "phone_number": "+1234567890",
  "is_staff": true,
  "staff_profile": {
    "id": 1,
    "role": 2,
    "role_id": 2,
    "role_name": "Support Manager",
    "role_details": {
      "id": 2,
      "name": "Support Manager",
      "description": "Can manage organisations and view platform analytics. Responsible for onboarding new organisations.",
      "permissions": [
        "manage_organisations",
        "view_organisations",
        "create_organisations",
        "update_organisations",
        "view_staff",
        "view_platform_analytics",
        "export_platform_reports"
      ],
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    },
    "permissions": [
      "manage_organisations",
      "view_organisations",
      "create_organisations",
      "update_organisations",
      "view_staff",
      "view_platform_analytics",
      "export_platform_reports"
    ],
    "created": "2024-01-10T08:00:00Z",
    "updated": "2024-01-10T08:00:00Z"
  }
}
```

**Use Case**:
- Call this endpoint after login to get up-to-date permissions
- Use this to refresh permissions if roles are changed by admin
- Check permissions before rendering UI components
- Returns the same structure as login response, including full `staff_profile` with role details

### Staff Permissions & Role-Based Access Control

Staff members are organized using **roles** and **permissions**. Each staff member has a `StaffProfile` linked to a `StaffRole`, which contains a set of `StaffPermission` objects.

**Key Concepts**:
- **Permissions** are granular actions (e.g., `manage_organisations`, `view_staff`)
- **Roles** are collections of permissions (e.g., "Super Admin", "Support Manager")
- **Staff Profiles** link accounts to roles
- The `super_admin` permission grants access to ALL operations

**Important**: Always check permissions in your frontend to control UI visibility and functionality. Even if an API call succeeds, you should prevent users from seeing features they don't have permission for.

#### Available Staff Permissions

The following permissions are available in the system:

| Permission Name | Description | Controls Access To |
|----------------|-------------|-------------------|
| `super_admin` | Full platform access (grants all permissions) | Everything - bypasses all permission checks |
| `manage_organisations` | Full CRUD access to organizations | Create, update, view, and manage organizations |
| `view_organisations` | View organization details | List and view organization information |
| `create_organisations` | Create new organizations | Create organization button/form |
| `update_organisations` | Update organization details | Edit organization forms |
| `manage_staff` | Full CRUD access to staff members | Create, update, delete, and view staff |
| `view_staff` | View staff member details | List and view staff information |
| `create_staff` | Create new staff members | Add staff button/form |
| `update_staff` | Update staff member details | Edit staff forms |
| `delete_staff` | Delete staff members | Delete staff button/action |
| `manage_staff_roles` | Full CRUD access to staff roles | Create, update, delete, and view roles |
| `view_staff_roles` | View staff roles | List and view role information |
| `create_staff_roles` | Create new staff roles | Create role button/form |
| `update_staff_roles` | Update staff roles | Edit role forms |
| `delete_staff_roles` | Delete staff roles | Delete role button/action |
| `manage_staff_permissions` | Full CRUD access to staff permissions | Create, update, delete, and view permissions |
| `view_staff_permissions` | View staff permissions | List and view permission information |
| `create_staff_permissions` | Create new staff permissions | Create permission button/form |
| `update_staff_permissions` | Update staff permissions | Edit permission forms |
| `delete_staff_permissions` | Delete staff permissions | Delete permission button/action |
| `view_platform_analytics` | View platform-wide analytics | Analytics dashboard, reports view |
| `export_platform_reports` | Export platform reports | Export/download reports functionality |
| `manage_platform_settings` | Manage platform-level settings | Platform settings page/forms |

#### Standard Staff Roles

The following roles are created by default (see `scripts/standard_staff_roles.json`):

**1. Super Admin**
- **Description**: Full platform access. Can manage all organisations, staff, and platform settings.
- **Permissions**: ALL permissions (includes `super_admin`)

**2. Support Manager**
- **Description**: Can manage organisations and view platform analytics. Responsible for onboarding new organisations.
- **Permissions**: 
  - `manage_organisations`
  - `view_organisations`
  - `create_organisations`
  - `update_organisations`
  - `view_staff`
  - `view_platform_analytics`
  - `export_platform_reports`

**3. Onboarding Specialist**
- **Description**: Specializes in onboarding new organisations to the platform.
- **Permissions**:
  - `view_organisations`
  - `create_organisations`
  - `update_organisations`
  - `view_staff`

**4. Staff Manager**
- **Description**: Manages staff members, roles, and permissions across the platform.
- **Permissions**:
  - `manage_staff`
  - `view_staff`
  - `create_staff`
  - `update_staff`
  - `manage_staff_roles`
  - `view_staff_roles`
  - `create_staff_roles`
  - `update_staff_roles`
  - `view_staff_permissions`
  - `view_organisations`

**5. Analyst**
- **Description**: Can view organisations and platform analytics for reporting purposes.
- **Permissions**:
  - `view_organisations`
  - `view_staff`
  - `view_platform_analytics`
  - `export_platform_reports`

#### Frontend Implementation Guide

**1. Getting Permissions**

After login, you receive permissions in the login response. You can also fetch current permissions using the `/me` endpoint:

```typescript
// After login, store user with staff_profile in your auth state/context
const user = await staffApiClient.post('/staff/auth/account/login', {
  email: 'staff@snapdesk.com',
  code: '000000'
});

// Access permissions via staff_profile
const permissions = user.staff_profile?.permissions || [];
const roleName = user.staff_profile?.role_name;

// Or fetch fresh user data
const user = await staffApiClient.get('/staff/auth/account/me');
const permissions = user.staff_profile?.permissions || [];
```

**2. Permission Checking Utility**

Create a utility function to check permissions:

```typescript
// utils/permissions.ts
/**
 * Check if staff user has a specific permission
 */
export function hasPermission(user: StaffUser, permission: string): boolean {
  if (!user?.staff_profile?.permissions) return false;
  
  // Super admin has all permissions
  if (user.staff_profile.permissions.includes('super_admin')) {
    return true;
  }
  
  return user.staff_profile.permissions.includes(permission);
}

/**
 * Check if staff user has any of the given permissions
 */
export function hasAnyPermission(user: StaffUser, permissions: string[]): boolean {
  if (!user?.staff_profile?.permissions) return false;
  
  if (user.staff_profile.permissions.includes('super_admin')) {
    return true;
  }
  
  return permissions.some(permission => user.staff_profile!.permissions.includes(permission));
}

/**
 * Check if staff user has all of the given permissions
 */
export function hasAllPermissions(user: StaffUser, permissions: string[]): boolean {
  if (!user?.staff_profile?.permissions) return false;
  
  if (user.staff_profile.permissions.includes('super_admin')) {
    return true;
  }
  
  return permissions.every(permission => user.staff_profile!.permissions.includes(permission));
}
```

**3. Sidebar/Navigation Control**

Control sidebar items based on permissions:

```typescript
// components/StaffSidebar.tsx
import { hasPermission } from '@/utils/permissions';
import { useStaffAuth } from '@/hooks/useStaffAuth';

export function StaffSidebar() {
  const { user } = useStaffAuth();
  
  const menuItems = [
    {
      label: 'Organizations',
      path: '/staff/organisations',
      icon: BuildingIcon,
      permission: 'view_organisations', // Show if user can view organizations
      children: [
        {
          label: 'List Organizations',
          path: '/staff/organisations',
          permission: 'view_organisations',
        },
        {
          label: 'Create Organization',
          path: '/staff/organisations/create',
          permission: 'create_organisations',
        },
      ],
    },
    {
      label: 'Staff Management',
      path: '/staff/staff',
      icon: UsersIcon,
      permission: 'view_staff',
      children: [
        {
          label: 'List Staff',
          path: '/staff/staff',
          permission: 'view_staff',
        },
        {
          label: 'Add Staff',
          path: '/staff/staff/create',
          permission: 'create_staff',
        },
        {
          label: 'Roles & Permissions',
          path: '/staff/staff/roles',
          permission: 'view_staff_roles',
        },
      ],
    },
    {
      label: 'Analytics',
      path: '/staff/analytics',
      icon: ChartBarIcon,
      permission: 'view_platform_analytics',
    },
    {
      label: 'Platform Settings',
      path: '/staff/settings',
      icon: CogIcon,
      permission: 'manage_platform_settings',
    },
  ];
  
  const visibleItems = menuItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(user, item.permission);
  }).map(item => ({
    ...item,
    children: item.children?.filter(child => 
      !child.permission || hasPermission(user, child.permission)
    ),
  }));
  
  return (
    <nav>
      {visibleItems.map(item => (
        <SidebarItem key={item.path} {...item} />
      ))}
    </nav>
  );
}
```

**4. Button/Action Visibility**

Hide buttons and actions based on permissions:

```typescript
// components/OrganisationList.tsx
import { hasPermission } from '@/utils/permissions';

export function OrganisationList() {
  const { user } = useStaffAuth();
  
  return (
    <div>
      <div className="header">
        <h1>Organizations</h1>
        {hasPermission(user, 'create_organisations') && (
          <button onClick={handleCreate}>Create Organization</button>
        )}
      </div>
      
      <table>
        {organisations.map(org => (
          <tr key={org.id}>
            <td>{org.name}</td>
            <td>
              {hasPermission(user, 'update_organisations') && (
                <button onClick={() => handleEdit(org.id)}>Edit</button>
              )}
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

**5. Route Protection**

Protect routes using middleware or route guards:

```typescript
// middleware/staffPermissions.ts
import { hasPermission } from '@/utils/permissions';
import { redirect } from 'next/navigation';

export function requirePermission(
  user: StaffUser,
  permission: string,
  redirectTo: string = '/staff/dashboard'
) {
  if (!hasPermission(user, permission)) {
    redirect(redirectTo);
  }
}

// Usage in page/component
// pages/staff/organisations/create.tsx
export default function CreateOrganisationPage() {
  const { user } = useStaffAuth();
  
  useEffect(() => {
    requirePermission(user, 'create_organisations', '/staff/organisations');
  }, [user]);
  
  // ... rest of component
}
```

**6. Conditional Rendering**

Show/hide entire sections based on permissions:

```typescript
// components/OrganisationDetail.tsx
export function OrganisationDetail({ organisation }) {
  const { user } = useStaffAuth();
  
  return (
    <div>
      <h1>{organisation.name}</h1>
      
      {/* View-only section */}
      {hasPermission(user, 'view_organisations') && (
        <OrganisationInfo organisation={organisation} />
      )}
      
      {/* Edit section */}
      {hasPermission(user, 'update_organisations') && (
        <EditOrganisationForm organisation={organisation} />
      )}
      
      {/* Advanced settings - requires manage_organisations */}
      {hasPermission(user, 'manage_organisations') && (
        <AdvancedSettings organisation={organisation} />
      )}
    </div>
  );
}
```

#### Permission-to-Feature Mapping

Use this mapping to control features in your frontend:

**Organization Management**:
- Show "Organizations" menu item: `view_organisations`
- Show "Create Organization" button: `create_organisations`
- Show "Edit Organization" button: `update_organisations`
- Show "Delete Organization" button: `manage_organisations`
- Allow access to organization detail page: `view_organisations`
- Allow editing organization form: `update_organisations`

**Staff Management**:
- Show "Staff" menu item: `view_staff`
- Show "Add Staff" button: `create_staff`
- Show "Edit Staff" button: `update_staff`
- Show "Delete Staff" button: `delete_staff`
- Allow access to staff list: `view_staff`

**Roles & Permissions Management**:
- Show "Roles & Permissions" menu item: `view_staff_roles`
- Show "Create Role" button: `create_staff_roles`
- Show "Edit Role" button: `update_staff_roles`
- Show "Delete Role" button: `delete_staff_roles`
- Allow managing permissions: `manage_staff_permissions`

**Analytics & Reports**:
- Show "Analytics" menu item: `view_platform_analytics`
- Show "Export Reports" button: `export_platform_reports`
- Allow viewing analytics dashboard: `view_platform_analytics`

**Platform Settings**:
- Show "Platform Settings" menu item: `manage_platform_settings`
- Allow editing settings: `manage_platform_settings`

#### TypeScript Types

```typescript
// types/staff.ts
export type StaffPermission =
  | 'super_admin'
  | 'manage_organisations'
  | 'view_organisations'
  | 'create_organisations'
  | 'update_organisations'
  | 'manage_staff'
  | 'view_staff'
  | 'create_staff'
  | 'update_staff'
  | 'delete_staff'
  | 'manage_staff_roles'
  | 'view_staff_roles'
  | 'create_staff_roles'
  | 'update_staff_roles'
  | 'delete_staff_roles'
  | 'manage_staff_permissions'
  | 'view_staff_permissions'
  | 'create_staff_permissions'
  | 'update_staff_permissions'
  | 'delete_staff_permissions'
  | 'view_platform_analytics'
  | 'export_platform_reports'
  | 'manage_platform_settings';

export interface StaffRole {
  id: number;
  name: string;
  description: string | null;
  permissions: StaffPermission[];
  created: string;
  updated: string;
}

export interface StaffProfile {
  id: number;
  role: number | null;
  role_id: number | null;
  role_name: string | null;
  role_details: StaffRole | null;
  permissions: StaffPermission[];
  created: string;
  updated: string;
}

// Staff Management Types
export interface StaffPermission {
  id: number;
  name: string;
  description: string | null;
  created: string;
  updated: string;
}

export interface StaffRole {
  id: number;
  name: string;
  description: string | null;
  permissions: StaffPermission[];
  permission_ids?: number[];
  staff_count: number;
  permissions_count?: number;
  created: string;
  updated: string;
}

export interface StaffProfileDetail {
  id: number;
  staff_user: AccountNested;
  staff_user_id: number;
  role: StaffRole | null;
  role_id: number | null;
  permissions: string[];
  created: string;
  updated: string;
}

export interface StaffProfileList {
  id: number;
  staff_user: AccountNested;
  role_name: string | null;
  role_id: number | null;
  permissions_count: number;
  created: string;
  updated: string;
}

// Analytics Types
export interface PlatformOverview {
  totals: {
    organisations: number;
    staff: number;
    users: number;
    tickets: number;
    employees: number;
  };
  recent_activity_30_days: {
    new_organisations: number;
    new_users: number;
    new_tickets: number;
    new_employees: number;
  };
  ticket_status: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  organisations_by_plan: Array<{
    plan: string;
    count: number;
  }>;
}

export interface OrganisationAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_plan: Array<{
    plan: string;
    count: number;
  }>;
  top_by_tickets: Array<{
    id: number;
    name: string;
    subdomain: string;
    plan: string;
    ticket_count: number;
  }>;
}

export interface TicketAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_status: Array<{
    status: string;
    count: number;
  }>;
  by_priority: Array<{
    priority: string;
    count: number;
  }>;
  by_organisation: Array<{
    organisation__name: string;
    organisation__id: number;
    count: number;
  }>;
  average_resolution_time_hours: number;
}

export interface UserAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_account_type: Array<{
    account_type: string;
    count: number;
  }>;
  by_verification_status: Array<{
    verification_status: string;
    count: number;
  }>;
}

export interface PlatformGrowth {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  daily_growth: Array<{
    date: string;
    organisations: number;
    users: number;
    tickets: number;
    employees: number;
  }>;
}

// Platform Settings Types
export interface PlatformSettings {
  platform_name: string | null;
  platform_email: string | null;
  platform_phone: string | null;
  enable_registration: boolean;
  enable_email_verification: boolean;
  enable_sms_verification: boolean;
  max_organisations_per_user: number | null;
  max_users_per_organisation: number | null;
  max_tickets_per_organisation: number | null;
  email_from_address: string | null;
  email_from_name: string | null;
  sms_provider: string | null;
  sms_sender_id: string | null;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_push_notifications: boolean;
  custom_settings: Record<string, any> | null;
}

export interface FeatureFlags {
  enable_registration: boolean;
  enable_email_verification: boolean;
  enable_sms_verification: boolean;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_push_notifications: boolean;
}

export interface ToggleFeatureRequest {
  feature: 'enable_registration' | 'enable_email_verification' | 'enable_sms_verification' | 'enable_email_notifications' | 'enable_sms_notifications' | 'enable_push_notifications';
  enabled: boolean;
}

export interface StaffUser {
  id: number;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  full_name: string;
  email: string;
  phone_number: string | null;
  is_staff: true;
  staff_profile: StaffProfile | null;
}

// Staff Management API Types
export interface StaffPermission {
  id: number;
  name: string;
  description: string | null;
  created: string;
  updated: string;
}

export interface StaffRoleDetail {
  id: number;
  name: string;
  description: string | null;
  permissions: StaffPermission[];
  permission_ids: number[];
  staff_count: number;
  created: string;
  updated: string;
}

export interface StaffRoleList {
  id: number;
  name: string;
  description: string | null;
  permissions_count: number;
  staff_count: number;
  created: string;
  updated: string;
}

export interface AccountNested {
  id: number;
  email: string | null;
  phone_number: string | null;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  full_name: string;
  account_type: string;
  is_staff: boolean;
  is_active: boolean;
  verification_status: string;
}

export interface StaffProfileDetail {
  id: number;
  staff_user: AccountNested;
  staff_user_id: number;
  role: StaffRoleDetail | null;
  role_id: number | null;
  permissions: string[];
  created: string;
  updated: string;
}

export interface StaffProfileList {
  id: number;
  staff_user: AccountNested;
  role_name: string | null;
  role_id: number | null;
  permissions_count: number;
  created: string;
  updated: string;
}

// Analytics API Types
export interface PlatformOverview {
  totals: {
    organisations: number;
    staff: number;
    users: number;
    tickets: number;
    employees: number;
  };
  recent_activity_30_days: {
    new_organisations: number;
    new_users: number;
    new_tickets: number;
    new_employees: number;
  };
  ticket_status: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  organisations_by_plan: Array<{
    plan: string;
    count: number;
  }>;
}

export interface OrganisationAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_plan: Array<{
    plan: string;
    count: number;
  }>;
  top_by_tickets: Array<{
    id: number;
    name: string;
    subdomain: string;
    plan: string;
    ticket_count: number;
  }>;
}

export interface TicketAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_status: Array<{
    status: string;
    count: number;
  }>;
  by_priority: Array<{
    priority: string;
    count: number;
  }>;
  by_organisation: Array<{
    organisation__name: string;
    organisation__id: number;
    count: number;
  }>;
  average_resolution_time_hours: number;
}

export interface UserAnalytics {
  created_over_time: Array<{
    date: string;
    count: number;
  }>;
  by_account_type: Array<{
    account_type: string;
    count: number;
  }>;
  by_verification_status: Array<{
    verification_status: string;
    count: number;
  }>;
}

export interface PlatformGrowth {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  daily_growth: Array<{
    date: string;
    organisations: number;
    users: number;
    tickets: number;
    employees: number;
  }>;
}

// Platform Settings API Types
export interface PlatformSettings {
  platform_name: string | null;
  platform_email: string | null;
  platform_phone: string | null;
  enable_registration: boolean;
  enable_email_verification: boolean;
  enable_sms_verification: boolean;
  max_organisations_per_user: number | null;
  max_users_per_organisation: number | null;
  max_tickets_per_organisation: number | null;
  email_from_address: string | null;
  email_from_name: string | null;
  sms_provider: string | null;
  sms_sender_id: string | null;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_push_notifications: boolean;
  custom_settings: Record<string, any> | null;
}

export interface FeatureFlags {
  enable_registration: boolean;
  enable_email_verification: boolean;
  enable_sms_verification: boolean;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_push_notifications: boolean;
}

export interface ToggleFeatureRequest {
  feature: 'enable_registration' | 'enable_email_verification' | 'enable_sms_verification' | 'enable_email_notifications' | 'enable_sms_notifications' | 'enable_push_notifications';
  enabled: boolean;
}
```

#### Best Practices

1. **Always check permissions on the frontend**: Don't rely solely on backend permission checks. Hide UI elements that users shouldn't access.

2. **Store permissions in auth state**: After login, store the user object with permissions in your auth context/state management.

3. **Refresh permissions when needed**: If an admin changes roles, call `/me` endpoint to refresh permissions.

4. **Handle missing permissions gracefully**: Show a friendly message if a user tries to access something they don't have permission for.

5. **Use permission checks consistently**: Create reusable permission checking utilities and use them throughout your app.

6. **Test with different roles**: Make sure to test your UI with different staff roles to ensure proper permission enforcement.

### Staff Organization Management

Staff members can manage organizations on the platform. All endpoints require staff authentication and check for appropriate permissions through staff roles.

**Base Path**: `/api/v1/staff/organisation/`

**Authentication**: Required (Staff JWT token)

**Permissions**: 
- Staff users must have the `manage_organisations` permission to create/update organizations
- Staff users must have the `view_organisations` permission to view organizations
- Permissions are checked through `StaffProfile` and `StaffRole`

#### List Organizations

**Endpoint**: `GET /api/v1/staff/organisation/`

**Authentication**: Required

**Query Parameters**:
- `?name=acme` - Filter by organization name (case-insensitive partial match)
- `?subdomain=acme` - Filter by subdomain (case-insensitive partial match)
- `?plan=free` - Filter by plan: `free`, `pro`, `enterprise`

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 10,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "Acme Corp",
      "subdomain": "acme",
      "email": "admin@acme.com",
      "plan": "free",
      "settings": {},
      "email_domain": null,
      "allowed_auth_methods": ["local"],
      "address": null,
      "logo": null,
      "owner": 5,
      "owner_details": {
        "id": 5,
        "email": "john.doe@acme.com",
        "phone_number": "+1234567890",
        "first_name": "John",
        "last_name": "Doe",
        "middle_name": null,
        "full_name": "John Doe",
        "account_type": "business_owner",
        "verification_status": "verified",
        "created": "2024-01-10T08:00:00Z"
      },
      "employee_count": 42,
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-15T10:30:00Z",
      "deleted": null
    }
  ]
}
```

**Response Fields**:
- Pagination metadata (`links`, `count`, `total_pages`)
- `data` - Array of organization objects, each containing:
  - All organization fields (id, name, subdomain, email, plan, etc.)
  - `owner` - ID of the owner account (null if no owner)
  - `owner_details` - Owner account details object (null if no owner assigned):
    - `id`, `email`, `phone_number`, `first_name`, `last_name`, `middle_name`, `full_name`
    - `account_type`, `verification_status`, `created`
  - `employee_count` - Number of employees in the organization

#### Get Organization Details

**Endpoint**: `GET /api/v1/staff/organisation/{id}/`

**Authentication**: Required

**Permissions**: Requires `view_organisations` permission

**Response** (200 OK): Returns detailed organization information including owner details and employee count:
```json
{
  "id": 1,
  "name": "Acme Corporation",
  "subdomain": "acme",
  "email": "admin@acme.com",
  "plan": "pro",
  "settings": {
    "feature_enabled": true
  },
  "email_domain": "acme.com",
  "allowed_auth_methods": ["local", "google"],
  "logo": "/media/business_logos/acme_logo.png",
  "owner": 5,
  "owner_details": {
    "id": 5,
    "email": "john.doe@acme.com",
    "phone_number": "+1234567890",
    "first_name": "John",
    "last_name": "Doe",
    "middle_name": null,
    "full_name": "John Doe",
    "account_type": "business_owner",
    "verification_status": "verified",
    "created": "2024-01-10T08:00:00Z"
  },
  "employee_count": 42,
  "created": "2024-01-10T08:00:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "deleted": null,
  "address": {
    "id": 1,
    "country": "US",
    "address_line_1": "123 Main St",
    "address_line_2": null,
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

**Response Fields**:
- All organization fields (id, name, subdomain, email, plan, settings, etc.)
- `owner` - ID of the owner account (null if no owner assigned)
- `owner_details` - Object containing owner account details:
  - `id` - Owner account ID
  - `email` - Owner email address
  - `phone_number` - Owner phone number (E.164 format)
  - `first_name` - Owner first name
  - `last_name` - Owner last name
  - `middle_name` - Owner middle name (null if not provided)
  - `full_name` - Computed full name (`"{first_name} {last_name}"`)
  - `account_type` - Always `"business_owner"` for owners
  - `verification_status` - Account verification status: `"pending"`, `"review"`, `"verified"`, or `"suspended"`
  - `created` - Account creation timestamp (ISO 8601 format)
- `employee_count` - Total number of employees in the organization (includes the owner if they have an EmployeeProfile)
- `address` - Organization address object (null if no address assigned)

**Alternative Endpoint**:
**Endpoint**: `GET /api/v1/staff/organisation/{id}/details`

Returns the same detailed organization information as the main endpoint.

#### Create Organization

**Endpoint**: `POST /api/v1/staff/organisation/`

**Authentication**: Required

**Permissions**: Requires `manage_organisations` permission

**Request Body** (Option 1: With existing owner):
```json
{
  "name": "New Company",
  "subdomain": "newcompany",
  "email": "admin@newcompany.com",
  "plan": "free",
  "settings": {},
  "email_domain": "newcompany.com",
  "allowed_auth_methods": ["local", "google"],
  "owner": 5,
  "country": "US",
  "address_line_1": "123 Main St"
}
```

**Request Body** (Option 2: Create new owner):
```json
{
  "name": "New Company",
  "subdomain": "newcompany",
  "email": "admin@newcompany.com",
  "plan": "free",
  "settings": {},
  "email_domain": "newcompany.com",
  "allowed_auth_methods": ["local", "google"],
  "owner_data": {
    "phone_number": "+1234567890",
    "email": "owner@newcompany.com",
    "first_name": "John",
    "last_name": "Doe",
    "gender": "male",
    "country": "US",
    "address_line_1": "123 Main St"
  },
  "country": "US",
  "address_line_1": "123 Main St"
}
```

**Required Fields**:
- `name` - Organization name
- `subdomain` - Unique subdomain (must be unique across all organizations)

**Optional Fields**:
- `email` - Organization email address
- `plan` - Plan type: `free`, `pro`, `enterprise` (default: `free`)
- `settings` - JSON object with organization settings
- `email_domain` - Email domain for organization (e.g., `"company.com"`)
- `allowed_auth_methods` - Array of allowed auth methods: `["local"]`, `["local", "google"]`, etc.
- `owner` - ID of existing Account with `account_type="business_owner"` to assign as owner
- `owner_data` - Object with account data to create a new owner account (must include `phone_number`)
  - `phone_number` - Required, must be unique
  - `email` - Optional
  - `first_name` - Optional
  - `last_name` - Optional
  - `middle_name` - Optional
  - `gender` - Optional (`"male"` or `"female"`)
  - `country` - Optional, for owner address
  - `address_line_1` - Optional, for owner address
- `country` - Optional, for organization address
- `address_line_1` - Optional, for organization address
- `enabled_modules` - Optional. JSON array of module keys to enable for this tenant, or `null`/omit for **all** modules (same semantics as staff **update**). This is the primary way to provision a limited module set at signup.

**Important Notes**:
- Either `owner` OR `owner_data` can be provided, but **not both**
- If `owner_data` is provided, a new Account will be created with `account_type="business_owner"` and default password `"0000"`
- When an owner is assigned, the system automatically:
  - Creates standard roles for the organization (via signal)
  - Creates an EmployeeProfile for the owner
  - Assigns the "Super Admin" role to the owner
- If no owner is provided, the organization is created without an owner (can be assigned later via update)

**Validation Rules**:
- Subdomain must be unique
- Subdomain cannot be empty
- Plan must be one of: `free`, `pro`, `enterprise`
- If `owner` is provided, the account must exist and have `account_type="business_owner"`
- If `owner` is provided, the account cannot already be owner of another organization
- If `owner_data` is provided, `phone_number` is required and must be unique
- Cannot provide both `owner` and `owner_data`

**Response** (201 Created): Returns the created organization with owner details and employee count:
```json
{
  "id": 1,
  "name": "New Company",
  "subdomain": "newcompany",
  "email": "admin@newcompany.com",
  "plan": "free",
  "settings": {},
  "email_domain": "newcompany.com",
  "allowed_auth_methods": ["local", "google"],
  "logo": null,
  "owner": 5,
  "owner_details": {
    "id": 5,
    "email": "owner@newcompany.com",
    "phone_number": "+1234567890",
    "first_name": "John",
    "last_name": "Doe",
    "middle_name": null,
    "full_name": "John Doe",
    "account_type": "business_owner",
    "verification_status": "pending",
    "created": "2024-01-15T10:30:00Z"
  },
  "employee_count": 1,
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "deleted": null,
  "address": null
}
```

**Response Fields**:
- All organization fields (id, name, subdomain, email, plan, etc.)
- `owner` - ID of the owner account (null if no owner assigned)
- `owner_details` - Object containing owner account details:
  - `id` - Owner account ID
  - `email` - Owner email address
  - `phone_number` - Owner phone number
  - `first_name` - Owner first name
  - `last_name` - Owner last name
  - `middle_name` - Owner middle name
  - `full_name` - Computed full name
  - `account_type` - Always `"business_owner"` for owners
  - `verification_status` - Account verification status
  - `created` - Account creation timestamp
- `employee_count` - Number of employees in the organization (includes the owner)

#### Update Organization

**Endpoint**: `PATCH /api/v1/staff/organisation/{id}/` (partial update)
**Endpoint**: `PUT /api/v1/staff/organisation/{id}/` (full update)

**Authentication**: Required

**Permissions**: Requires `manage_organisations` permission

**Request Body** (PATCH example):
```json
{
  "name": "Updated Company Name",
  "email": "newemail@company.com",
  "plan": "pro",
  "settings": {
    "feature_enabled": true
  },
  "email_domain": "updatedcompany.com",
  "allowed_auth_methods": ["local", "google", "microsoft"],
  "owner": 10
}
```

**Optional Fields**:
- `name` - Organization name
- `email` - Organization email address
- `plan` - Plan type: `free`, `pro`, `enterprise`
- `settings` - JSON object with organization settings
- `email_domain` - Email domain for organization
- `allowed_auth_methods` - Array of allowed auth methods
- `owner` - ID of existing Account with `account_type="business_owner"` to assign as owner (can change owner)
- `enabled_modules` - JSON array of module keys for this org, or `null` for “all enabled modules”. **Staff-only control:** this field (and Django admin on `Organisation`) is how enabled modules are set; tenant users cannot change it via the client API.

**Note**: 
- Subdomain cannot be updated after creation
- When changing `owner`, the new owner account must have `account_type="business_owner"` and cannot be owner of another organization

**Response** (200 OK): Returns the updated organization with owner details and employee count (same format as Get Organization Details response)

**Important Notes**:
- All organization endpoints require staff authentication
- Staff users must have appropriate permissions through their `StaffProfile` and `StaffRole`
- Organizations are sorted by creation date (newest first)
- The `subdomain` field is immutable after creation
- The `owner` field is set separately (typically during organization creation by business owners)
- Organizations cannot be deleted through the API

#### Staff: product module catalog (pricing & availability)

Global catalog rows drive default **monthly prices**, **labels**, **sort order**, and **`is_active`** (inactive modules are hidden from the customer module picker and denied at the permission layer when the catalog table is in use). Seeded by migration `0055_productmodule`; manage in **Django admin → Product modules** or via API.

**Base path**: `/api/v1/staff/product-modules/`

**Permissions**: **`view_product_modules`** — list/retrieve catalog (GET). **`manage_product_modules`** — create/update/delete rows. Staff with **`manage_organisations`** retain full catalog access (legacy). **`super_admin`** as usual.

**Authentication**: Staff JWT

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/staff/product-modules/` | List all catalog rows (including inactive) |
| POST | `/api/v1/staff/product-modules/` | Create row (`key` must already exist in code: `ALL_MODULE_KEYS`) |
| GET | `/api/v1/staff/product-modules/{id}/` | Retrieve |
| PATCH / PUT | `/api/v1/staff/product-modules/{id}/` | Update label, description, monthly_price, sort_order, is_active |
| DELETE | `/api/v1/staff/product-modules/{id}/` | Remove row (falls back to code defaults for that key until re-seeded) |

**Django admin**: **Product modules** — edit `monthly_price`, `is_active`, ordering, copy.

### Staff Roles and Permissions

Staff members are organized using roles and permissions similar to client users, but at the platform level (not organization-specific).

**Models**:
- `StaffPermission` - Platform-wide permissions (e.g., `manage_organisations`, `view_organisations`, `super_admin`)
- `StaffRole` - Roles for staff members (e.g., `Super Admin`, `Support Manager`, `Onboarding Specialist`)
- `StaffProfile` - Links `AdminUser` to `StaffRole` with permission checking

**Permission Checking**:
- Staff permissions are checked through the `StaffProfile.has_permission()` method
- `super_admin` permission grants access to all operations
- Permissions can be assigned to roles, and roles are assigned to staff users

### Staff Management APIs

Staff members can manage other staff members, roles, and permissions through dedicated API endpoints. All endpoints require staff authentication and check for appropriate permissions.

**Base Path**: `/api/v1/staff/staff/`

**Authentication**: Required (Staff JWT token)

**Permissions**: 
- Staff users must have the `manage_staff` permission to create/update/delete staff profiles
- Staff users must have the `view_staff` permission to view staff profiles
- Staff users must have the `manage_staff_roles` permission to manage roles
- Staff users must have the `view_staff_roles` permission to view roles
- Staff users must have the `manage_staff_permissions` permission to manage permissions
- Staff users must have the `view_staff_permissions` permission to view permissions

#### Staff Permissions

**List Permissions**

**Endpoint**: `GET /api/v1/staff/staff/permissions`

**Authentication**: Required

**Permissions**: Requires `view_staff_permissions` permission

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 25,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "manage_organisations",
      "description": "Can create, update, and delete organisations",
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    },
    {
      "id": 2,
      "name": "view_organisations",
      "description": "Can view organisation details",
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    }
  ]
}
```

**Get Permission Details**

**Endpoint**: `GET /api/v1/staff/staff/permissions/{id}`

**Authentication**: Required

**Permissions**: Requires `view_staff_permissions` permission

**Response**: Returns permission details (same format as list item)

**Create Permission**

**Endpoint**: `POST /api/v1/staff/staff/permissions`

**Authentication**: Required

**Permissions**: Requires `manage_staff_permissions` permission

**Request Body**:
```json
{
  "name": "custom_permission",
  "description": "Description of the permission"
}
```

**Required Fields**:
- `name` - Permission name (must be unique, max 255 characters)

**Optional Fields**:
- `description` - Permission description

**Response**: Returns the created permission

**Update Permission**

**Endpoint**: `PATCH /api/v1/staff/staff/permissions/{id}` (partial update)
**Endpoint**: `PUT /api/v1/staff/staff/permissions/{id}` (full update)

**Authentication**: Required

**Permissions**: Requires `manage_staff_permissions` permission

**Request Body**:
```json
{
  "name": "updated_permission_name",
  "description": "Updated description"
}
```

**Response**: Returns the updated permission

**Delete Permission**

**Endpoint**: `DELETE /api/v1/staff/staff/permissions/{id}`

**Authentication**: Required

**Permissions**: Requires `manage_staff_permissions` permission

**Response**: `204 No Content` on success

#### Staff Roles

**List Roles**

**Endpoint**: `GET /api/v1/staff/staff/roles`

**Authentication**: Required

**Permissions**: Requires `view_staff_roles` permission

**Query Parameters**:
- `?name=admin` - Filter by role name (case-insensitive partial match)
- `?permission=1` - Filter roles that have a specific permission ID

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 5,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "Super Admin",
      "description": "Full platform access",
      "permissions_count": 25,
      "staff_count": 2,
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    }
  ]
}
```

**Get Role Details**

**Endpoint**: `GET /api/v1/staff/staff/roles/{id}`

**Authentication**: Required

**Permissions**: Requires `view_staff_roles` permission

**Response**:
```json
{
  "id": 1,
  "name": "Super Admin",
  "description": "Full platform access. Can manage all organisations, staff, and platform settings.",
  "permissions": [
    {
      "id": 1,
      "name": "super_admin",
      "description": "Full platform access",
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    },
    {
      "id": 2,
      "name": "manage_organisations",
      "description": "Can manage organisations",
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    }
  ],
  "permission_ids": [1, 2],
  "staff_count": 2,
  "created": "2024-01-10T08:00:00Z",
  "updated": "2024-01-10T08:00:00Z"
}
```

**Create Role**

**Endpoint**: `POST /api/v1/staff/staff/roles`

**Authentication**: Required

**Permissions**: Requires `manage_staff_roles` permission

**Request Body**:
```json
{
  "name": "Support Manager",
  "description": "Manages support operations",
  "permission_ids": [2, 3, 4]
}
```

**Required Fields**:
- `name` - Role name (must be unique, max 100 characters)

**Optional Fields**:
- `description` - Role description
- `permission_ids` - Array of permission IDs to assign to the role

**Response**: Returns the created role (same format as Get Role Details)

**Update Role**

**Endpoint**: `PATCH /api/v1/staff/staff/roles/{id}` (partial update)
**Endpoint**: `PUT /api/v1/staff/staff/roles/{id}` (full update)

**Authentication**: Required

**Permissions**: Requires `manage_staff_roles` permission

**Request Body**:
```json
{
  "name": "Updated Role Name",
  "description": "Updated description",
  "permission_ids": [1, 2, 3, 4]
}
```

**Response**: Returns the updated role

**Delete Role**

**Endpoint**: `DELETE /api/v1/staff/staff/roles/{id}`

**Authentication**: Required

**Permissions**: Requires `manage_staff_roles` permission

**Response**: `204 No Content` on success

**Assign Permissions to Role**

**Endpoint**: `POST /api/v1/staff/staff/roles/{id}/assign_permissions`

**Authentication**: Required

**Permissions**: Requires `manage_staff_roles` permission

**Request Body**:
```json
{
  "permission_ids": [5, 6, 7]
}
```

**Response**: Returns the updated role with all permissions

**Remove Permissions from Role**

**Endpoint**: `POST /api/v1/staff/staff/roles/{id}/remove_permissions`

**Authentication**: Required

**Permissions**: Requires `manage_staff_roles` permission

**Request Body**:
```json
{
  "permission_ids": [5, 6]
}
```

**Response**: Returns the updated role

#### Staff Profiles

**List Staff Profiles**

**Endpoint**: `GET /api/v1/staff/staff/profiles`

**Authentication**: Required

**Permissions**: Requires `view_staff` permission

**Query Parameters**:
- `?role=1` - Filter by role ID
- `?search=john` - Search by name, email, or phone number
- `?permission=1` - Filter staff with roles that have a specific permission ID

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 10,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "staff_user": {
        "id": 5,
        "email": "staff@snapdesk.com",
        "phone_number": "+1234567890",
        "first_name": "Jane",
        "last_name": "Doe",
        "middle_name": null,
        "full_name": "Jane Doe",
        "account_type": "staff",
        "is_staff": true,
        "is_active": true,
        "verification_status": "verified"
      },
      "role_name": "Super Admin",
      "role_id": 1,
      "permissions_count": 25,
      "created": "2024-01-10T08:00:00Z",
      "updated": "2024-01-10T08:00:00Z"
    }
  ]
}
```

**Get Staff Profile Details**

**Endpoint**: `GET /api/v1/staff/staff/profiles/{id}`

**Authentication**: Required

**Permissions**: Requires `view_staff` permission

**Response**:
```json
{
  "id": 1,
  "staff_user": {
    "id": 5,
    "email": "staff@snapdesk.com",
    "phone_number": "+1234567890",
    "first_name": "Jane",
    "last_name": "Doe",
    "middle_name": null,
    "full_name": "Jane Doe",
    "account_type": "staff",
    "is_staff": true,
    "is_active": true,
    "verification_status": "verified"
  },
  "staff_user_id": 5,
  "role": {
    "id": 1,
    "name": "Super Admin",
    "description": "Full platform access",
    "permissions": [
      {
        "id": 1,
        "name": "super_admin",
        "description": "Full platform access",
        "created": "2024-01-10T08:00:00Z",
        "updated": "2024-01-10T08:00:00Z"
      }
    ],
    "permission_ids": [1, 2, 3],
    "staff_count": 2,
    "created": "2024-01-10T08:00:00Z",
    "updated": "2024-01-10T08:00:00Z"
  },
  "role_id": 1,
  "permissions": [
    "super_admin",
    "manage_organisations",
    "view_organisations"
  ],
  "created": "2024-01-10T08:00:00Z",
  "updated": "2024-01-10T08:00:00Z"
}
```

**Create Staff Profile**

**Endpoint**: `POST /api/v1/staff/staff/profiles`

**Authentication**: Required

**Permissions**: Requires `manage_staff` permission

**Request Body**:
```json
{
  "staff_user_id": 5,
  "role_id": 1
}
```

**Required Fields**:
- `staff_user_id` - Account ID (must have `is_staff=True`)

**Optional Fields**:
- `role_id` - Role ID to assign to the staff member

**Response**: Returns the created staff profile (same format as Get Staff Profile Details)

**Error Responses**:
- `400 Bad Request`: If account already has a staff profile
- `400 Bad Request`: If account does not have `is_staff=True`

**Update Staff Profile**

**Endpoint**: `PATCH /api/v1/staff/staff/profiles/{id}` (partial update)
**Endpoint**: `PUT /api/v1/staff/staff/profiles/{id}` (full update)

**Authentication**: Required

**Permissions**: Requires `manage_staff` permission

**Request Body**:
```json
{
  "role_id": 2
}
```

**Response**: Returns the updated staff profile

**Delete Staff Profile**

**Endpoint**: `DELETE /api/v1/staff/staff/profiles/{id}`

**Authentication**: Required

**Permissions**: Requires `manage_staff` permission

**Response**: `204 No Content` on success

**Assign Role to Staff Member**

**Endpoint**: `POST /api/v1/staff/staff/profiles/{id}/assign_role`

**Authentication**: Required

**Permissions**: Requires `manage_staff` permission

**Request Body**:
```json
{
  "role_id": 2
}
```

**Response**: Returns the updated staff profile

**Remove Role from Staff Member**

**Endpoint**: `POST /api/v1/staff/staff/profiles/{id}/remove_role`

**Authentication**: Required

**Permissions**: Requires `manage_staff` permission

**Response**: Returns the updated staff profile with `role` set to `null`

**Get Current Staff Profile**

**Endpoint**: `GET /api/v1/staff/staff/profiles/me`

**Authentication**: Required

**Description**: Get the current authenticated staff member's profile

**Response**: Returns the current staff member's profile (same format as Get Staff Profile Details)

**Error Responses**:
- `404 Not Found`: If staff profile does not exist for the current user

**Important Notes**:
- All staff management endpoints require staff authentication
- Staff users must have appropriate permissions through their `StaffProfile` and `StaffRole`
- Staff profiles link `Account` instances (with `is_staff=True`) to `StaffRole` instances
- When creating a staff profile, the account must already exist and have `is_staff=True`
- Roles can be assigned/removed from staff members without deleting the profile
- The `permissions` field in staff profile responses shows all permissions from the assigned role
- Use query parameters for filtering and searching staff profiles

### Staff Analytics APIs

Staff members can view platform-wide analytics and insights. All endpoints require staff authentication and the `view_platform_analytics` permission.

**Base Path**: `/api/v1/staff/analytics/`

**Authentication**: Required (Staff JWT token)

**Permissions**: 
- Staff users must have the `view_platform_analytics` permission to view analytics
- Staff users must have the `export_platform_reports` permission to export reports

#### Platform Overview

**Endpoint**: `GET /api/v1/staff/analytics/overview`

**Authentication**: Required

**Permissions**: Requires `view_platform_analytics` permission

**Description**: Get platform-wide overview statistics including totals, recent activity, and ticket status breakdown.

**Response**:
```json
{
  "totals": {
    "organisations": 50,
    "staff": 10,
    "users": 500,
    "tickets": 1500,
    "employees": 250
  },
  "recent_activity_30_days": {
    "new_organisations": 5,
    "new_users": 50,
    "new_tickets": 200,
    "new_employees": 25
  },
  "ticket_status": {
    "open": 300,
    "in_progress": 150,
    "resolved": 200,
    "closed": 850
  },
  "organisations_by_plan": [
    {
      "plan": "free",
      "count": 30
    },
    {
      "plan": "pro",
      "count": 15
    },
    {
      "plan": "enterprise",
      "count": 5
    }
  ]
}
```

#### Organisation Analytics

**Endpoint**: `GET /api/v1/staff/analytics/organisations`

**Authentication**: Required

**Permissions**: Requires `view_platform_analytics` permission

**Query Parameters**:
- `?start_date=2024-01-01` - Filter organisations created on or after this date (ISO format: YYYY-MM-DD)
- `?end_date=2024-12-31` - Filter organisations created on or before this date (ISO format: YYYY-MM-DD)

**Response**:
```json
{
  "created_over_time": [
    {
      "date": "2024-01-15",
      "count": 2
    },
    {
      "date": "2024-01-16",
      "count": 3
    }
  ],
  "by_plan": [
    {
      "plan": "free",
      "count": 30
    },
    {
      "plan": "pro",
      "count": 15
    }
  ],
  "top_by_tickets": [
    {
      "id": 1,
      "name": "Acme Corp",
      "subdomain": "acme",
      "plan": "pro",
      "ticket_count": 150
    },
    {
      "id": 2,
      "name": "Tech Solutions",
      "subdomain": "tech",
      "plan": "enterprise",
      "ticket_count": 120
    }
  ]
}
```

#### Ticket Analytics

**Endpoint**: `GET /api/v1/staff/analytics/tickets`

**Authentication**: Required

**Permissions**: Requires `view_platform_analytics` permission

**Query Parameters**:
- `?start_date=2024-01-01` - Filter tickets created on or after this date (ISO format: YYYY-MM-DD)
- `?end_date=2024-12-31` - Filter tickets created on or before this date (ISO format: YYYY-MM-DD)

**Response**:
```json
{
  "created_over_time": [
    {
      "date": "2024-01-15",
      "count": 25
    },
    {
      "date": "2024-01-16",
      "count": 30
    }
  ],
  "by_status": [
    {
      "status": "open",
      "count": 300
    },
    {
      "status": "closed",
      "count": 850
    }
  ],
  "by_priority": [
    {
      "priority": "urgent",
      "count": 50
    },
    {
      "priority": "high",
      "count": 200
    }
  ],
  "by_organisation": [
    {
      "organisation__name": "Acme Corp",
      "organisation__id": 1,
      "count": 150
    }
  ],
  "average_resolution_time_hours": 24.5
}
```

#### User Analytics

**Endpoint**: `GET /api/v1/staff/analytics/users`

**Authentication**: Required

**Permissions**: Requires `view_platform_analytics` permission

**Query Parameters**:
- `?start_date=2024-01-01` - Filter users created on or after this date (ISO format: YYYY-MM-DD)
- `?end_date=2024-12-31` - Filter users created on or before this date (ISO format: YYYY-MM-DD)

**Response**:
```json
{
  "created_over_time": [
    {
      "date": "2024-01-15",
      "count": 10
    },
    {
      "date": "2024-01-16",
      "count": 15
    }
  ],
  "by_account_type": [
    {
      "account_type": "user",
      "count": 300
    },
    {
      "account_type": "employee",
      "count": 200
    }
  ],
  "by_verification_status": [
    {
      "verification_status": "verified",
      "count": 400
    },
    {
      "verification_status": "pending",
      "count": 100
    }
  ]
}
```

#### Platform Growth Metrics

**Endpoint**: `GET /api/v1/staff/analytics/growth`

**Authentication**: Required

**Permissions**: Requires `view_platform_analytics` permission

**Query Parameters**:
- `?days=90` - Number of days to include in growth metrics (default: 90)

**Description**: Get daily growth metrics for organisations, users, tickets, and employees over a specified period.

**Response**:
```json
{
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "days": 90
  },
  "daily_growth": [
    {
      "date": "2024-01-01",
      "organisations": 0,
      "users": 5,
      "tickets": 10,
      "employees": 2
    },
    {
      "date": "2024-01-02",
      "organisations": 1,
      "users": 3,
      "tickets": 8,
      "employees": 1
    }
  ]
}
```

**Important Notes**:
- All analytics endpoints require staff authentication
- Staff users must have the `view_platform_analytics` permission
- Date filters use ISO format (YYYY-MM-DD)
- All metrics are calculated in real-time from the database
- Growth metrics show daily counts for the specified period

### Platform Settings APIs

Staff members can manage platform-wide settings and feature flags. All endpoints require staff authentication and the `manage_platform_settings` permission.

**Base Path**: `/api/v1/staff/settings/`

**Authentication**: Required (Staff JWT token)

**Permissions**: 
- Staff users must have the `manage_platform_settings` permission to update settings
- Staff users must have the `view_platform_settings` permission to view settings

#### Get Current Settings

**Endpoint**: `GET /api/v1/staff/settings/current`

**Authentication**: Required

**Permissions**: Requires `view_platform_settings` or `manage_platform_settings` permission

**Description**: Get current platform settings including feature flags, limits, and configuration.

**Response**:
```json
{
  "platform_name": "Snapdesk",
  "platform_email": "support@snapdesk.com",
  "platform_phone": "+1234567890",
  "enable_registration": true,
  "enable_email_verification": true,
  "enable_sms_verification": true,
  "max_organisations_per_user": null,
  "max_users_per_organisation": null,
  "max_tickets_per_organisation": null,
  "email_from_address": "noreply@snapdesk.com",
  "email_from_name": "Snapdesk",
  "sms_provider": null,
  "sms_sender_id": null,
  "enable_email_notifications": true,
  "enable_sms_notifications": false,
  "enable_push_notifications": true,
  "custom_settings": {}
}
```

#### Update Settings

**Endpoint**: `PUT /api/v1/staff/settings/update_settings` (full update)
**Endpoint**: `PATCH /api/v1/staff/settings/update_settings` (partial update)

**Authentication**: Required

**Permissions**: Requires `manage_platform_settings` permission

**Request Body** (PATCH example):
```json
{
  "platform_name": "Updated Platform Name",
  "enable_registration": false,
  "max_users_per_organisation": 100,
  "enable_email_notifications": true
}
```

**Optional Fields**:
- `platform_name` - Platform name
- `platform_email` - Platform email address
- `platform_phone` - Platform phone number
- `enable_registration` - Enable user registration (boolean)
- `enable_email_verification` - Enable email verification (boolean)
- `enable_sms_verification` - Enable SMS verification (boolean)
- `max_organisations_per_user` - Maximum organisations per user (integer, null for unlimited)
- `max_users_per_organisation` - Maximum users per organisation (integer, null for unlimited)
- `max_tickets_per_organisation` - Maximum tickets per organisation (integer, null for unlimited)
- `email_from_address` - Email sender address
- `email_from_name` - Email sender name
- `sms_provider` - SMS provider name
- `sms_sender_id` - SMS sender ID
- `enable_email_notifications` - Enable email notifications (boolean)
- `enable_sms_notifications` - Enable SMS notifications (boolean)
- `enable_push_notifications` - Enable push notifications (boolean)
- `custom_settings` - Custom settings JSON object

**Response**:
```json
{
  "message": "Settings updated successfully",
  "settings": {
    "platform_name": "Updated Platform Name",
    "enable_registration": false,
    "max_users_per_organisation": 100
  }
}
```

**Note**: In a production environment, settings are typically stored in a database model. This endpoint provides a simplified interface for managing platform configuration.

#### Get Feature Flags

**Endpoint**: `GET /api/v1/staff/settings/feature_flags`

**Authentication**: Required

**Permissions**: Requires `view_platform_settings` or `manage_platform_settings` permission

**Description**: Get all feature flags and their current states.

**Response**:
```json
{
  "enable_registration": true,
  "enable_email_verification": true,
  "enable_sms_verification": true,
  "enable_email_notifications": true,
  "enable_sms_notifications": false,
  "enable_push_notifications": true
}
```

#### Toggle Feature Flag

**Endpoint**: `POST /api/v1/staff/settings/toggle_feature`

**Authentication**: Required

**Permissions**: Requires `manage_platform_settings` permission

**Request Body**:
```json
{
  "feature": "enable_registration",
  "enabled": false
}
```

**Required Fields**:
- `feature` - Feature flag name (must be one of the valid features)
- `enabled` - Boolean value to set the feature flag

**Valid Features**:
- `enable_registration`
- `enable_email_verification`
- `enable_sms_verification`
- `enable_email_notifications`
- `enable_sms_notifications`
- `enable_push_notifications`

**Response**:
```json
{
  "message": "Feature enable_registration disabled",
  "feature": "enable_registration",
  "enabled": false
}
```

**Error Responses**:
- `400 Bad Request`: If `feature` is missing or invalid
- `400 Bad Request`: If `enabled` is missing

**Important Notes**:
- All settings endpoints require staff authentication
- Staff users must have the `manage_platform_settings` permission to update settings
- Settings are stored in Django settings or a database model (implementation-dependent)
- Feature flags control platform-wide functionality
- Use `toggle_feature` for quick feature flag changes
- Use `update_settings` for bulk configuration updates

---

## Data Models & Types

### Account Types

```typescript
type AccountType = 'user' | 'employee' | 'business_owner' | 'other';
type Gender = 'male' | 'female';
type VerificationStatus = 'pending' | 'review' | 'verified' | 'suspended';
```

### Ticket Status & Priority

```typescript
type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

interface AccountNested {
  id: number;
  email?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  account_type: string;
}

interface CategoryNested {
  id: number;
  name: string;
  parent?: number;
  parent_name?: string;
  organisation: number;
}

interface Ticket {
  id: number;
  ticket_number: string;  // Auto-generated: ABBREV-0000001 format
  organisation: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_by: number;
  created_by_name: string;
  created_by_email?: string;
  assigned_to?: AccountNested;  // Full object, not just ID
  category?: CategoryNested;  // Full object, not just ID
  project?: ProjectNested;  // Full object with client
  recurring_template?: number;  // ID of recurring template (if generated from template)
  occurrence_date?: string;  // Date (YYYY-MM-DD) for recurring tickets
  comments_count: number;
  attachments_count: number;
  closed_at?: string;
  in_progress_at?: string;  // ISO datetime when ticket status was changed to "in-progress"
  expected_completion_at?: string | null;  // ISO datetime when ticket should be completed (null if closed)
  is_overdue: boolean;  // True if ticket is past expected completion time
  time_remaining_seconds?: number | null;  // Seconds remaining until deadline (negative if overdue, null if closed)
  created: string;
  updated: string;
}

interface TicketList {
  id: number;
  ticket_number: string;  // Auto-generated: ABBREV-0000001 format
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_by: number;
  created_by_name: string;
  created_by_email?: string;
  assigned_to?: AccountNested;  // Full object, not just ID
  category?: CategoryNested;  // Full object, not just ID
  project?: ProjectNested;  // Full object with client
  recurring_template?: number;  // ID of recurring template (if generated from template)
  occurrence_date?: string;  // Date (YYYY-MM-DD) for recurring tickets
  comments_count: number;
  attachments_count: number;
  closed_at?: string;
  in_progress_at?: string;  // ISO datetime when ticket status was changed to "in-progress"
  expected_completion_at?: string | null;  // ISO datetime when ticket should be completed (null if closed)
  is_overdue: boolean;  // True if ticket is past expected completion time
  time_remaining_seconds?: number | null;  // Seconds remaining until deadline (negative if overdue, null if closed)
  created: string;
  updated: string;
}

interface TicketComment {
  id: number;
  ticket: number;
  user: number;
  user_name: string;
  user_email: string;
  message: string;
  parent?: number;
  parent_id?: number;
  attachments_count: number;
  replies_count: number;
  created: string;
  updated: string;
}

interface Category {
  id: number;
  organisation: number;
  name: string;
  parent?: number;
  parent_name?: string;
  subcategories_count: number;
  created: string;
  updated: string;
}

interface Attachment {
  id: number;
  ticket?: number;
  comment?: number;
  file_url: string;
  file_type: string;
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_by_email: string;
  created: string;
  updated: string;
}
```

### Organization Plan

```typescript
type OrganisationPlan = 'free' | 'pro' | 'enterprise';

// Owner Account (for organization owners)
interface OwnerAccount {
  id: number;
  email: string | null;
  phone_number: string | null;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  full_name: string;
  account_type: 'business_owner';
  verification_status: 'pending' | 'review' | 'verified' | 'suspended';
  created: string; // ISO 8601 date string
}

// Organization (Staff API)
interface Organisation {
  id: number;
  name: string;
  subdomain: string;
  email: string | null;
  plan: OrganisationPlan;
  settings: Record<string, any>;
  email_domain: string | null;
  allowed_auth_methods: string[];
  logo: string | null;
  owner: number | null; // Owner account ID
  owner_details: OwnerAccount | null; // Owner account details
  employee_count: number; // Number of employees in the organization
  created: string; // ISO 8601 date string
  updated: string; // ISO 8601 date string
  deleted: string | null; // ISO 8601 date string or null
  address: Address | null;
}

// Create Organization Request (with existing owner)
interface CreateOrganisationRequest {
  name: string;
  subdomain: string;
  email?: string;
  plan?: OrganisationPlan;
  settings?: Record<string, any>;
  email_domain?: string;
  allowed_auth_methods?: string[];
  owner?: number; // Existing owner account ID
  owner_data?: CreateOwnerAccountRequest; // New owner account data
  country?: string; // Organization address
  address_line_1?: string; // Organization address
}

// Create Owner Account Request (nested in owner_data)
interface CreateOwnerAccountRequest {
  phone_number: string; // Required, E.164 format (e.g., "+1234567890")
  email?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  gender?: 'male' | 'female';
  country?: string; // Owner address
  address_line_1?: string; // Owner address
}
```

### Knowledge Base Visibility

```typescript
type ArticleVisibility = 'internal' | 'public';

interface KnowledgebaseArticle {
  id: number;
  organisation: number;
  title: string;
  content: string;  // HTML or Markdown
  visibility: ArticleVisibility;
  author: AccountNested;
  category?: CategoryNested;
  version: number;
  created: string;
  updated: string;
}

interface KnowledgebaseArticleList {
  id: number;
  title: string;
  visibility: ArticleVisibility;
  author: AccountNested;
  category?: CategoryNested;
  version: number;
  created: string;
  updated: string;
}

interface ArticleImage {
  id: number;
  organisation: number;
  article?: number;
  image: string;  // Relative path
  url: string;  // Full URL to access the image
  uploaded_by: number;
  alt_text?: string;
  created: string;
  updated: string;
}
```

### Notification Types

```typescript
type NotificationType = 'ticket_created' | 'ticket_assigned' | 'ticket_closed';
```

### Roles & Permissions Types

```typescript
interface Role {
  id: number;
  organisation: number;
  name: string;
  description: string;
  permissions: CustomPermission[];
  permission_ids?: number[];  // For write operations
  created: string;
  updated: string;
}

interface CustomPermission {
  id: number;
  name: string;
  created: string;
  updated: string;
}

interface RoleList {
  id: number;
  name: string;
  description: string;
  permission_count: number;
  created: string;
  updated: string;
}

interface EmployeeProfile {
  id: number;
  account_id: number;
  account_email: string;
  account_phone: string;
  account_name: string;
  position: string;
  base_salary: number;
  department?: string;
  date_hired?: string;
  manager_id?: number;
  manager_name?: string;
  emergency_contact?: string;
  national_id?: string;
  organisation: number;
  role_id?: number;
  role_name?: string;
  created: string;
  updated: string;
}

interface EmployeeProfileList {
  id: number;
  account_email: string;
  account_phone: string;
  account_name: string;
  position: string;
  department?: string;
  role_name?: string;
  date_hired?: string;
  created: string;
  updated: string;
}

// Dashboard responses vary by role
// The dashboard automatically adapts based on the user's role name
// Check the 'role_focus' field to determine which interface to use

// Super Admin Dashboard
interface SuperAdminDashboardSummary {
  role_focus: 'super_admin';
  metrics: {
    // First 3: Role-specific
    total_employees: number;
    total_tickets: number;
    tickets_closed_30_days: number;
    // Next 3: Additional permissions (may vary)
    knowledge_base_articles?: number;
    total_categories?: number;
    total_roles?: number;
  };
  organization_overview: {
    ticket_status: {
      open: number;
      'in-progress': number;
      resolved: number;
      closed: number;
    };
    employees_by_department: Record<string, number>;
  };
  super_admin_performance: {
    on_time_closure_rate: number;
    avg_response_time: number;  // in hours
    first_response_rate: number;
    new_hires_30_days: number;
  };
}

// HR Dashboard
interface HRDashboardSummary {
  role_focus: 'hr';
  metrics: {
    // First 3: Role-specific
    total_employees: number;
    new_hires_30_days: number;
    employees_with_manager: number;
    // Next 3: Additional permissions (may vary)
    total_tickets?: number;  // If has view_all_tickets
    reports_available?: boolean;  // If has view_reports
    total_roles?: number;  // If has view_roles
  };
  employee_breakdown: {
    by_department: Record<string, number>;
    by_role: Record<string, number>;
  };
  hr_performance: {
    onboarding_rate: number;
    manager_coverage: number;
    recent_hires_90_days: number;
  };
}

// IT Support Dashboard
interface ITSupportDashboardSummary {
  role_focus: 'it_support';
  metrics: {
    // First 3: Role-specific
    assigned_to_me: number;
    total_tickets: number;
    on_time_closure_rate: number;
    // Next 3: Additional permissions (may vary)
    knowledge_base_articles?: number;
    published_articles?: number;
    total_categories?: number;
  };
  ticket_breakdown: {
    by_status: {
      open: number;
      'in-progress': number;
      resolved: number;
      closed: number;
    };
    by_priority: Record<string, number>;
  };
  it_performance: {
    avg_response_time: number;  // in hours
    first_response_rate: number;
    resolution_rate: number;
  };
}

// Manager Dashboard
interface ManagerDashboardSummary {
  role_focus: 'manager';
  metrics: {
    // First 3: Role-specific
    team_size: number;
    team_tickets: number;
    total_tickets: number;
    // Next 3: Additional permissions (may vary)
    reports_available?: boolean;
    knowledge_base_articles?: number;
    total_categories?: number;
  };
  team_breakdown: {
    team_ticket_status: {
      open: number;
      'in-progress': number;
      resolved: number;
      closed: number;
    };
    all_ticket_status: {
      open: number;
      'in-progress': number;
      resolved: number;
      closed: number;
    };
  };
  manager_performance: {
    team_on_time_closure_rate: number;
    team_response_rate: number;
  };
}

// Employee Dashboard
interface EmployeeDashboardSummary {
  role_focus: 'employee';
  metrics: {
    // First 3: Role-specific
    my_tickets: number;
    my_open_tickets: number;
    my_in_progress: number;
    // Next 3: Additional permissions (may vary)
    knowledge_base_articles?: number;
    total_categories?: number;
  };
  my_ticket_breakdown: {
    by_status: {
      open: number;
      'in-progress': number;
      resolved: number;
      closed: number;
    };
    by_priority: Record<string, number>;
  };
  employee_performance: {
    resolution_rate: number;
    closed_tickets: number;
    resolved_tickets: number;
  };
}

// General Dashboard (for custom roles or users without role)
interface GeneralDashboardSummary {
  role_focus: 'general';
  metrics: {
    // First 3: Based on primary permissions
    my_tickets?: number;
    total_tickets?: number;
    total_employees?: number;
    // Next 3: Additional permissions (may vary)
    knowledge_base_articles?: number;
    total_categories?: number;
    reports_available?: boolean;
  };
  ticket_status?: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  performance_metrics: {
    sla_compliance: number;
    customer_satisfaction: number;
    first_response_rate: number;
  };
}
```

---

## API Endpoints

### Current Endpoints (Implemented)

#### Client Authentication
- `GET /api/v1/client/auth/account/login-options/?subdomain=acme` - Get login method and OAuth URL for org (pass subdomain; frontend-started auth)
- `POST /api/v1/client/auth/account/exchange-code/` - Exchange Google/Microsoft OAuth code for JWT
- `POST /api/v1/client/auth/account/signup` - Create account
- `POST /api/v1/client/auth/account/login` - User login
- `POST /api/v1/client/auth/account/business_login` - Business login
- `POST /api/v1/client/auth/account/send_verification_code` - Send OTP
- `POST /api/v1/client/auth/account/business_send_verification_code` - Send business OTP

**Note**: The client auth endpoints are accessible at `/api/v1/auth/` (legacy path) or `/api/v1/client/auth/`.

#### Staff Authentication
- `POST /api/v1/staff/auth/account/send_verification_code` - Send verification code to staff email
- `POST /api/v1/staff/auth/account/login` - Staff login with email and code

#### Staff Organization Management
- `GET /api/v1/staff/organisation/` - List all organizations
- `GET /api/v1/staff/organisation/{id}/` - Get organization details
- `GET /api/v1/staff/organisation/{id}/details` - Get organization details (alternative)
- `POST /api/v1/staff/organisation/` - Create new organization
- `PATCH /api/v1/staff/organisation/{id}/` - Update organization (partial)
- `PUT /api/v1/staff/organisation/{id}/` - Update organization (full)

#### Staff Management
- `GET /api/v1/staff/staff/permissions` - List all staff permissions
- `GET /api/v1/staff/staff/permissions/{id}` - Get permission details
- `POST /api/v1/staff/staff/permissions` - Create permission
- `PATCH /api/v1/staff/staff/permissions/{id}` - Update permission
- `DELETE /api/v1/staff/staff/permissions/{id}` - Delete permission
- `GET /api/v1/staff/staff/roles` - List all staff roles
- `GET /api/v1/staff/staff/roles/{id}` - Get role details
- `POST /api/v1/staff/staff/roles` - Create role
- `PATCH /api/v1/staff/staff/roles/{id}` - Update role
- `DELETE /api/v1/staff/staff/roles/{id}` - Delete role
- `POST /api/v1/staff/staff/roles/{id}/assign_permissions` - Assign permissions to role
- `POST /api/v1/staff/staff/roles/{id}/remove_permissions` - Remove permissions from role
- `GET /api/v1/staff/staff/profiles` - List all staff profiles
- `GET /api/v1/staff/staff/profiles/{id}` - Get staff profile details
- `GET /api/v1/staff/staff/profiles/me` - Get current staff member's profile
- `POST /api/v1/staff/staff/profiles` - Create staff profile
- `PATCH /api/v1/staff/staff/profiles/{id}` - Update staff profile
- `DELETE /api/v1/staff/staff/profiles/{id}` - Delete staff profile
- `POST /api/v1/staff/staff/profiles/{id}/assign_role` - Assign role to staff member
- `POST /api/v1/staff/staff/profiles/{id}/remove_role` - Remove role from staff member

#### Staff Analytics
- `GET /api/v1/staff/analytics/overview` - Get platform overview statistics
- `GET /api/v1/staff/analytics/organisations` - Get organisation analytics
- `GET /api/v1/staff/analytics/tickets` - Get ticket analytics
- `GET /api/v1/staff/analytics/users` - Get user analytics
- `GET /api/v1/staff/analytics/growth` - Get platform growth metrics

#### Platform Settings
- `GET /api/v1/staff/settings/current` - Get current platform settings
- `PUT /api/v1/staff/settings/update_settings` - Update platform settings (full)
- `PATCH /api/v1/staff/settings/update_settings` - Update platform settings (partial)
- `GET /api/v1/staff/settings/feature_flags` - Get feature flags
- `POST /api/v1/staff/settings/toggle_feature` - Toggle a feature flag

#### Dashboard
- `GET /api/v1/client/organisation/dashboard/summary` - Get dashboard summary data

#### Product modules (per organisation)
**Which modules a tenant may use** is configured by **platform staff** (`enabled_modules` on the organisation via staff org **PATCH/PUT** or Django admin) and by the global **`ProductModule`** catalog (staff). Tenant roles still control *features within* enabled modules.

**Disabled modules:** API endpoints for those areas return **403** if the user’s role would otherwise allow them, and role/permission pickers only list permissions for enabled modules. The `organisation` module is always on (core settings).

- `GET /api/v1/client/organisation/modules/` — **Read-only** registry + effective `enabled_modules` + pricing. Requires **`view_organisation_modules`** or legacy **`manage_organisation_settings`**. **Business owners** may always read. Others without these permissions should use **personalisation** for `enabled_modules` only (see below). There is **no** client `PATCH` for modules.

**Pricing:** After migration `0055_productmodule`, **list prices and labels** come from the **`ProductModule`** table (Django admin **Product modules** or staff API `/api/v1/staff/product-modules/`). If the table is empty, the app falls back to `MODULE_MONTHLY_PRICES` / `MODULE_DEFINITIONS` in code. Optional per-org contract overrides: `Organisation.settings["module_price_overrides"]` = `{ "pm": "199.00", ... }`. Display currency defaults to `USD`; set Django `SNAPDESK_MODULE_PRICING_CURRENCY` to override.

Personalisation read payload includes **`enabled_modules`** and **`modules_explicit_configuration`** for every org member. **`module_pricing`** is included only when the user may view organisation modules (same rule as GET `/modules/`); otherwise it is **`null`**.

#### Organisation personalisation (branding, timezone, countries)
- `GET /api/v1/client/organisation/personalisation/` - Get current org's personalisation (logo, colors, timezone, countries)
- `GET /api/v1/client/organisation/personalisation/current/` - Same as above
- `PATCH /api/v1/client/organisation/personalisation/current/` - Update personalisation (partial; business owner or `manage_organisation_settings`)
- `PUT /api/v1/client/organisation/personalisation/current/` - Full update
- `GET /api/v1/client/organisation/personalisation/{id}/` - Get by id (current org only)
- `PATCH /api/v1/client/organisation/personalisation/{id}/` - Update by id
- `PUT /api/v1/client/organisation/personalisation/{id}/` - Full update by id

#### Employee Management
- `GET /api/v1/client/organisation/employees/` - List all employees
- `POST /api/v1/client/organisation/employees/` - Create new employee (can create account + employee together)
- `GET /api/v1/client/organisation/employees/{id}` - Get employee details
- `PATCH /api/v1/client/organisation/employees/{id}` - Update employee (partial)
- `PUT /api/v1/client/organisation/employees/{id}` - Update employee (full)
- `POST /api/v1/client/organisation/employees/{id}/assign_role` - Assign role to employee
- `POST /api/v1/client/organisation/employees/{id}/assign_manager` - Assign manager to employee
- `DELETE /api/v1/client/organisation/employees/{id}/remove_manager` - Remove manager from employee
- `GET /api/v1/client/organisation/employees/{id}/subordinates` - Get employee's subordinates
- `POST /api/v1/client/organisation/employees/bulk-upload/` - Bulk create members (employees)

#### Ticket Management
- `GET /api/v1/client/organisation/tickets/` - List all tickets (query filters: `status`, `priority`, `project`, `client`, `category`, `phase`, `deliverable`, `parent`, `root_only=true` for top-level items only, `assigned_to` / `assigned_to_me`, `created_by`, `search`)
- `POST /api/v1/client/organisation/tickets/` - Create new ticket (optional `project_id`, `phase_id`, `deliverable_id`, `parent_id` for PM: phase/deliverable must match project; project can be inferred from phase/deliverable/parent)
- `GET /api/v1/client/organisation/tickets/{ticket_number}` - Get ticket details
- `PATCH /api/v1/client/organisation/tickets/{ticket_number}` - Update ticket (partial)
- `PUT /api/v1/client/organisation/tickets/{ticket_number}` - Update ticket (full)
- `POST /api/v1/client/organisation/tickets/{ticket_number}/assign` - Assign ticket to user
- `POST /api/v1/client/organisation/tickets/{ticket_number}/unassign` - Unassign ticket
- `POST /api/v1/client/organisation/tickets/{ticket_number}/close` - Close ticket
- `POST /api/v1/client/organisation/tickets/{ticket_number}/reopen` - Reopen ticket
- `GET /api/v1/client/organisation/tickets/{ticket_number}/comments` - Get ticket comments
- `GET /api/v1/client/organisation/tickets/{ticket_number}/attachments` - Get ticket attachments
- `GET /api/v1/client/organisation/tickets/comments/` - List all comments
- `POST /api/v1/client/organisation/tickets/comments/` - Create comment
- `GET /api/v1/client/organisation/tickets/comments/{id}` - Get comment details
- `PATCH /api/v1/client/organisation/tickets/comments/{id}` - Update comment
- `GET /api/v1/client/organisation/tickets/categories/` - List categories
- `POST /api/v1/client/organisation/tickets/categories/` - Create category
- `GET /api/v1/client/organisation/tickets/categories/{id}` - Get category details
- `PATCH /api/v1/client/organisation/tickets/categories/{id}` - Update category
- `GET /api/v1/client/organisation/tickets/attachments/` - List attachments
- `POST /api/v1/client/organisation/tickets/attachments/` - Create attachment
- `GET /api/v1/client/organisation/tickets/attachments/{id}` - Get attachment details
- `PATCH /api/v1/client/organisation/tickets/attachments/{id}` - Update attachment
- `GET /api/v1/client/organisation/tickets/clients/` - List clients
- `POST /api/v1/client/organisation/tickets/clients/` - Create client
- `GET /api/v1/client/organisation/tickets/clients/{id}` - Get client details
- `PATCH /api/v1/client/organisation/tickets/clients/{id}` - Update client
- `DELETE /api/v1/client/organisation/tickets/clients/{id}` - Delete client
- `POST /api/v1/client/organisation/tickets/clients/bulk-upload/` - Bulk create clients only
- `GET /api/v1/client/organisation/tickets/projects/` - List projects
- `POST /api/v1/client/organisation/tickets/projects/bulk-upload/` - Bulk create projects (with optional deliverables & phases)
- `POST /api/v1/client/organisation/tickets/projects/` - Create project
- `GET /api/v1/client/organisation/tickets/projects/{id}` - Get project details
- `PATCH /api/v1/client/organisation/tickets/projects/{id}` - Update project
- `DELETE /api/v1/client/organisation/tickets/projects/{id}` - Delete project
- `GET /api/v1/client/organisation/tickets/deliverables/` - List deliverables (optionally filter by `?project={project_id}`)
- `POST /api/v1/client/organisation/tickets/deliverables/bulk-upload/` - Bulk create deliverables
- `POST /api/v1/client/organisation/tickets/deliverables/` - Create deliverable
- `GET /api/v1/client/organisation/tickets/deliverables/{id}` - Get deliverable details
- `PATCH /api/v1/client/organisation/tickets/deliverables/{id}` - Update deliverable
- `DELETE /api/v1/client/organisation/tickets/deliverables/{id}` - Delete deliverable
- `GET /api/v1/client/organisation/tickets/phases/` - List phases / milestones (`?project={project_id}`)
- `POST /api/v1/client/organisation/tickets/phases/` - Create phase
- `GET /api/v1/client/organisation/tickets/phases/{id}` - Get phase details
- `PATCH /api/v1/client/organisation/tickets/phases/{id}` - Update phase
- `DELETE /api/v1/client/organisation/tickets/phases/{id}` - Delete phase
- `GET /api/v1/client/organisation/tickets/recurring/` - List recurring ticket templates
- `POST /api/v1/client/organisation/tickets/recurring/` - Create recurring ticket template
- `GET /api/v1/client/organisation/tickets/recurring/{id}/` - Get recurring ticket template details
- `PUT /api/v1/client/organisation/tickets/recurring/{id}/` - Update recurring ticket template (full)
- `PATCH /api/v1/client/organisation/tickets/recurring/{id}/` - Update recurring ticket template (partial)
- `DELETE /api/v1/client/organisation/tickets/recurring/{id}/` - Delete recurring ticket template
- `POST /api/v1/client/organisation/tickets/recurring/{id}/pause` - Pause recurring ticket template
- `POST /api/v1/client/organisation/tickets/recurring/{id}/resume` - Resume recurring ticket template
- `GET /api/v1/client/organisation/tickets/recurring/{id}/instances/` - Get ticket instances generated from template

#### Project Management (PM API)
Dedicated prefix for clients / projects / deliverables / phases. **Same models, serializers, permissions, and behaviour** as under `tickets/`; use this namespace for PM UIs so routing stays separate from helpdesk tickets. Work items remain **tickets** (`/tickets/…`); link them to phases and deliverables via `phase_id`, `deliverable_id`, and `parent_id` (subtasks) on create/update.

- `GET /api/v1/client/organisation/pm/clients/` - List clients (same as `tickets/clients/`)
- `POST /api/v1/client/organisation/pm/clients/` - Create client
- `GET /api/v1/client/organisation/pm/clients/{id}` - Get client details
- `PATCH /api/v1/client/organisation/pm/clients/{id}` - Update client
- `DELETE /api/v1/client/organisation/pm/clients/{id}` - Delete client
- `POST /api/v1/client/organisation/pm/clients/bulk-upload/` - Bulk create clients
- `GET /api/v1/client/organisation/pm/projects/` - List projects
- `POST /api/v1/client/organisation/pm/projects/bulk-upload/` - Bulk create projects (with optional deliverables & phases)
- `POST /api/v1/client/organisation/pm/projects/` - Create project
- `GET /api/v1/client/organisation/pm/projects/{id}` - Get project details
- `PATCH /api/v1/client/organisation/pm/projects/{id}` - Update project
- `DELETE /api/v1/client/organisation/pm/projects/{id}` - Delete project
- `GET /api/v1/client/organisation/pm/deliverables/` - List deliverables (`?project=` filter supported)
- `POST /api/v1/client/organisation/pm/deliverables/bulk-upload/` - Bulk create deliverables
- `POST /api/v1/client/organisation/pm/deliverables/` - Create deliverable
- `GET /api/v1/client/organisation/pm/deliverables/{id}` - Get deliverable details
- `PATCH /api/v1/client/organisation/pm/deliverables/{id}` - Update deliverable
- `DELETE /api/v1/client/organisation/pm/deliverables/{id}` - Delete deliverable
- `GET /api/v1/client/organisation/pm/phases/` - List phases (`?project=` filter supported)
- `POST /api/v1/client/organisation/pm/phases/` - Create phase
- `GET /api/v1/client/organisation/pm/phases/{id}` - Get phase details
- `PATCH /api/v1/client/organisation/pm/phases/{id}` - Update phase
- `DELETE /api/v1/client/organisation/pm/phases/{id}` - Delete phase

#### Knowledge Base
- `GET /api/v1/client/organisation/knowledgebase/` - List all articles
- `POST /api/v1/client/organisation/knowledgebase/` - Create new article
- `GET /api/v1/client/organisation/knowledgebase/{id}` - Get article details
- `PATCH /api/v1/client/organisation/knowledgebase/{id}` - Update article (partial)
- `PUT /api/v1/client/organisation/knowledgebase/{id}` - Update article (full)
- `POST /api/v1/client/organisation/knowledgebase/{id}/publish` - Publish article (set visibility to public)
- `POST /api/v1/client/organisation/knowledgebase/{id}/unpublish` - Unpublish article (set visibility to internal)
- `POST /api/v1/client/organisation/knowledgebase/upload_image` - Upload image for article content

#### Attendance (Clock In/Out)
- `GET /api/v1/client/organisation/attendance/me` - Get your own attendance records (all employees)
- `GET /api/v1/client/organisation/attendance/` - List all attendance records (requires `view_attendance` permission)
- `GET /api/v1/client/organisation/attendance/{id}` - Get attendance record details
- `GET /api/v1/client/organisation/attendance/calendar` - Get calendar events (holidays, attendance, timesheets)
- `POST /api/v1/client/organisation/attendance/clock_in` - Clock in
- `POST /api/v1/client/organisation/attendance/clock_out` - Clock out
- `GET /api/v1/client/organisation/attendance/status` - Get current clock status

#### Leave Management
- `GET /api/v1/client/organisation/leave/requests/` - List leave requests
- `POST /api/v1/client/organisation/leave/requests/` - Create leave request
- `GET /api/v1/client/organisation/leave/requests/{id}` - Get leave request details
- `PATCH /api/v1/client/organisation/leave/requests/{id}` - Update leave request
- `POST /api/v1/client/organisation/leave/requests/{id}/approve` - Approve leave request
- `POST /api/v1/client/organisation/leave/requests/{id}/reject` - Reject leave request
- `POST /api/v1/client/organisation/leave/requests/{id}/cancel` - Cancel leave request
- `GET /api/v1/client/organisation/leave/holidays/` - List holidays
- `POST /api/v1/client/organisation/leave/holidays/` - Create holiday
- `POST /api/v1/client/organisation/leave/holidays/generate/` - Generate holidays from organisation's countries
- `GET /api/v1/client/organisation/leave/holidays/{id}` - Get holiday details
- `PATCH /api/v1/client/organisation/leave/holidays/{id}` - Update holiday
- `DELETE /api/v1/client/organisation/leave/holidays/{id}` - Delete holiday
- `GET /api/v1/client/organisation/leave/holidays/calendar` - Get calendar events (holidays + approved leaves)

#### Timesheet Management
- `GET /api/v1/client/organisation/timesheet/` - List timesheets
- `POST /api/v1/client/organisation/timesheet/` - Create timesheet
- `GET /api/v1/client/organisation/timesheet/{id}` - Get timesheet details
- `PATCH /api/v1/client/organisation/timesheet/{id}` - Update timesheet
- `DELETE /api/v1/client/organisation/timesheet/{id}` - Delete timesheet

#### Compliance Criticality Assessment
- `GET /api/v1/client/organisation/compliance/assessments/` - List compliance assessments
- `POST /api/v1/client/organisation/compliance/assessments/` - Create new assessment
- `GET /api/v1/client/organisation/compliance/assessments/{id}` - Get assessment details
- `PUT /api/v1/client/organisation/compliance/assessments/{id}` - Update assessment (draft=true/false to submit)
- `POST /api/v1/client/organisation/compliance/assessments/{id}/approve` - Approve assessment
- `POST /api/v1/client/organisation/compliance/assessments/{id}/reject` - Reject assessment (with comment)
- `GET /api/v1/client/organisation/compliance/assessments/{id}/comments` - Get review comments
- `POST /api/v1/client/organisation/compliance/assessments/summary` - Preview summary/rating calculation
- `GET /api/v1/client/organisation/compliance/reports/{report_id}/download` - Download compressed reports ZIP

#### CSV Templates (Bulk Upload)
- `GET /api/v1/client/organisation/csv-templates/` - List CSV templates
- `POST /api/v1/client/organisation/csv-templates/` - Create CSV template
- `GET /api/v1/client/organisation/csv-templates/{id}` - Get CSV template details
- `PATCH /api/v1/client/organisation/csv-templates/{id}` - Update CSV template (partial)
- `PUT /api/v1/client/organisation/csv-templates/{id}` - Update CSV template (full)
- `DELETE /api/v1/client/organisation/csv-templates/{id}` - Delete CSV template
- `GET /api/v1/client/organisation/csv-templates/default?template_type=members` - Get default template for type

#### Dashboard

The Dashboard API provides **role-specific** summary data for the business dashboard. The dashboard automatically adapts based on the user's role name, showing relevant metrics and breakdowns for each role type.

**Key Features:**
- **Role-Specific Dashboards**: Each role (Super Admin, HR, IT Support, Manager, Employee) gets a tailored dashboard
- **Structured Metrics**: First 3 metrics are role-specific, next 3 are based on additional permissions
- **Role-Specific Breakdowns**: Each role has breakdowns relevant to their responsibilities
- **Role-Specific Performance**: Performance metrics tailored to each role's focus

**Base Path**: `/api/v1/client/organisation/dashboard/`

##### Get Dashboard Summary

**Endpoint**: `GET /api/v1/client/organisation/dashboard/summary`

**Authentication**: Required

**Description**: Returns role-specific dashboard data. The response structure varies based on the user's role name. Check the `role_focus` field to determine which interface to use.

**Important**: The dashboard is determined by the user's **role name**, not permissions. The role names are:
- `"Super Admin"` → `role_focus: "super_admin"`
- `"HR"` → `role_focus: "hr"`
- `"IT Support"` → `role_focus: "it_support"`
- `"Manager"` → `role_focus: "manager"`
- `"Employee"` → `role_focus: "employee"`
- Custom roles or no role → `role_focus: "general"`

**Response Structure:**
All responses include:
- `role_focus`: The role type (`"super_admin"`, `"hr"`, `"it_support"`, `"manager"`, `"employee"`, or `"general"`)
- `metrics`: Object with 6 metrics (first 3 role-specific, next 3 from additional permissions)
- Breakdown section: Role-specific breakdown (varies by role)
- Performance section: Role-specific performance metrics (varies by role)

**Response Examples by Role:**

See the TypeScript interfaces section above for complete type definitions. Below are JSON response examples for each role:

**1. Super Admin Response** (`role_focus: "super_admin"`):
```json
{
  "role_focus": "super_admin",
  "metrics": {
    "total_employees": 25,
    "total_tickets": 150,
    "tickets_closed_30_days": 45,
    "knowledge_base_articles": 12,
    "total_categories": 8,
    "total_roles": 5
  },
  "organization_overview": {
    "ticket_status": {
      "open": 30,
      "in-progress": 20,
      "resolved": 25,
      "closed": 75
    },
    "employees_by_department": {
      "Engineering": 10,
      "HR": 3,
      "Sales": 8,
      "Support": 4
    }
  },
  "super_admin_performance": {
    "on_time_closure_rate": 85.5,
    "avg_response_time": 2.3,
    "first_response_rate": 92.0,
    "new_hires_30_days": 3
  }
}
```

**2. HR Response** (`role_focus: "hr"`):
```json
{
  "role_focus": "hr",
  "metrics": {
    "total_employees": 25,
    "new_hires_30_days": 3,
    "employees_with_manager": 20,
    "total_tickets": 150,
    "reports_available": true,
    "total_roles": 5
  },
  "employee_breakdown": {
    "by_department": {
      "Engineering": 10,
      "HR": 3,
      "Sales": 8,
      "Support": 4
    },
    "by_role": {
      "Employee": 15,
      "Manager": 5,
      "IT Support": 3,
      "HR": 2
    }
  },
  "hr_performance": {
    "onboarding_rate": 12.0,
    "manager_coverage": 80.0,
    "recent_hires_90_days": 5
  }
}
```

**3. IT Support Response** (`role_focus: "it_support"`):
```json
{
  "role_focus": "it_support",
  "metrics": {
    "assigned_to_me": 12,
    "total_tickets": 150,
    "on_time_closure_rate": 85.5,
    "knowledge_base_articles": 12,
    "published_articles": 8,
    "total_categories": 8
  },
  "ticket_breakdown": {
    "by_status": {
      "open": 3,
      "in-progress": 5,
      "resolved": 2,
      "closed": 2
    },
    "by_priority": {
      "urgent": 2,
      "high": 4,
      "medium": 4,
      "low": 2
    }
  },
  "it_performance": {
    "avg_response_time": 1.8,
    "first_response_rate": 95.0,
    "resolution_rate": 83.3
  }
}
```

**4. Manager Response** (`role_focus: "manager"`):
```json
{
  "role_focus": "manager",
  "metrics": {
    "team_size": 5,
    "team_tickets": 18,
    "total_tickets": 150,
    "reports_available": true,
    "knowledge_base_articles": 12,
    "total_categories": 8
  },
  "team_breakdown": {
    "team_ticket_status": {
      "open": 5,
      "in-progress": 6,
      "resolved": 4,
      "closed": 3
    },
    "all_ticket_status": {
      "open": 30,
      "in-progress": 20,
      "resolved": 25,
      "closed": 75
    }
  },
  "manager_performance": {
    "team_on_time_closure_rate": 80.0,
    "team_response_rate": 88.9
  }
}
```

**5. Employee Response** (`role_focus: "employee"`):
```json
{
  "role_focus": "employee",
  "metrics": {
    "my_tickets": 5,
    "my_open_tickets": 2,
    "my_in_progress": 1,
    "knowledge_base_articles": 12,
    "total_categories": 8
  },
  "my_ticket_breakdown": {
    "by_status": {
      "open": 2,
      "in-progress": 1,
      "resolved": 1,
      "closed": 1
    },
    "by_priority": {
      "high": 2,
      "medium": 2,
      "low": 1
    }
  },
  "employee_performance": {
    "resolution_rate": 40.0,
    "closed_tickets": 1,
    "resolved_tickets": 1
  }
}
```

**6. General Response** (`role_focus: "general"` - for custom roles):
```json
{
  "role_focus": "general",
  "metrics": {
    "my_tickets": 5,
    "total_tickets": 10,
    "knowledge_base_articles": 12
  },
  "ticket_status": {
    "open": 3,
    "in-progress": 2,
    "resolved": 3,
    "closed": 2
  },
  "performance_metrics": {
    "sla_compliance": 80.0
  }
}
```

**Usage Example with Type Checking**:
```typescript
// Fetch dashboard summary after login
const response = await apiClient.get('/client/organisation/dashboard/summary');
const data = response.data;

// Check role_focus to determine which interface to use
switch (data.role_focus) {
  case 'super_admin':
    const superAdminData = data as SuperAdminDashboardSummary;
    console.log(`Total Employees: ${superAdminData.metrics.total_employees}`);
    console.log(`Total Tickets: ${superAdminData.metrics.total_tickets}`);
    break;
    
  case 'hr':
    const hrData = data as HRDashboardSummary;
    console.log(`Total Employees: ${hrData.metrics.total_employees}`);
    console.log(`New Hires: ${hrData.metrics.new_hires_30_days}`);
    break;
    
  case 'it_support':
    const itData = data as ITSupportDashboardSummary;
    console.log(`Assigned to Me: ${itData.metrics.assigned_to_me}`);
    console.log(`On-Time Closure: ${itData.metrics.on_time_closure_rate}%`);
    break;
    
  case 'manager':
    const managerData = data as ManagerDashboardSummary;
    console.log(`Team Size: ${managerData.metrics.team_size}`);
    console.log(`Team Tickets: ${managerData.metrics.team_tickets}`);
    break;
    
  case 'employee':
    const employeeData = data as EmployeeDashboardSummary;
    console.log(`My Tickets: ${employeeData.metrics.my_tickets}`);
    console.log(`My Open: ${employeeData.metrics.my_open_tickets}`);
    break;
    
  default:
    const generalData = data as GeneralDashboardSummary;
    // Handle general dashboard
    break;
}
```

**Frontend Implementation Guide:**

1. **Check `role_focus` First**: Always check the `role_focus` field to determine which dashboard structure you're receiving.

2. **Display Metrics**: 
   - Show the first 3 metrics prominently (these are role-specific)
   - Show the next 3 metrics if they exist (these are from additional permissions)

3. **Display Breakdowns**: 
   - Each role has different breakdown sections (e.g., `employee_breakdown` for HR, `ticket_breakdown` for IT Support)
   - Use appropriate charts/visualizations for each breakdown type

4. **Display Performance Metrics**:
   - Each role has different performance metrics
   - Use role-specific labels and visualizations

**Important Notes**:
- **Dashboard is determined by role name**, not permissions
- All data is automatically filtered by the current organization (from subdomain)
- **Metrics Structure**: First 3 metrics are always role-specific, next 3 are based on additional permissions the user has
- **Breakdowns and Performance**: Each role has unique breakdown and performance sections tailored to their responsibilities
- Data is filtered based on user permissions (e.g., tickets visible based on `view_all_tickets` vs `view_tickets`)
- Metrics are calculated in real-time based on filtered data
- The `role_focus` field tells you exactly which dashboard structure to expect

#### Roles & Permissions

The Roles API allows organizations to manage roles and permissions for their employees. All endpoints require authentication and automatically filter by the current organization (set via subdomain).

#### Employee Management

The Employee Management API allows organizations to manage employee profiles, assign roles, and manage organizational hierarchy. All endpoints require authentication and automatically filter by the current organization (set via subdomain).

**Base Path**: `/api/v1/client/organisation/roles/`

**Note**: Permissions are nested under the roles path: `/api/v1/client/organisation/roles/permissions/`

##### Roles

**List Roles**
- **Endpoint**: `GET /api/v1/client/organisation/roles/`
- **Authentication**: Required
- **Description**: Get all roles for the current organization
- **Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 2,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "Support Agent",
      "description": "Can view and respond to tickets",
      "permission_count": 5,
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "name": "Manager",
      "description": "Can manage tickets and team members",
      "permission_count": 12,
      "created": "2024-01-15T10:35:00Z",
      "updated": "2024-01-15T10:35:00Z"
    }
  ]
}
```

**Get Role Details**
- **Endpoint**: `GET /api/v1/client/organisation/roles/{id}`
- **Authentication**: Required
- **Description**: Get detailed information about a specific role including its permissions
- **Response**:
```json
{
  "id": 1,
  "organisation": 1,
  "name": "Support Agent",
  "description": "Can view and respond to tickets",
  "permissions": [
    {
      "id": 1,
      "name": "view_tickets",
      "created": "2024-01-15T10:00:00Z",
      "updated": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "name": "create_tickets",
      "created": "2024-01-15T10:00:00Z",
      "updated": "2024-01-15T10:00:00Z"
    }
  ],
  "permission_ids": [1, 2],
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z"
}
```

**Create Role**
- **Endpoint**: `POST /api/v1/client/organisation/roles/`
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "Support Agent",
  "description": "Can view and respond to tickets",
  "permission_ids": [1, 2, 3]  // Optional: Array of permission IDs
}
```
- **Response**: Returns the created role (same format as Get Role Details)

**Update Role**
- **Endpoint**: `PATCH /api/v1/client/organisation/roles/{id}` (partial update)
- **Endpoint**: `PUT /api/v1/client/organisation/roles/{id}` (full update)
- **Authentication**: Required
- **Request Body** (PATCH example):
```json
{
  "name": "Senior Support Agent",
  "description": "Updated description"
}
```
- **Response**: Returns the updated role

**Note**: Delete endpoint is not available. Roles can only be created, listed, retrieved, and updated.

**Add Permissions to Role**
- **Endpoint**: `POST /api/v1/client/organisation/roles/{id}/permissions`
- **Authentication**: Required
- **Request Body**:
```json
{
  "permission_ids": [4, 5, 6]
}
```
- **Response**:
```json
{
  "message": "Added 3 permission(s) to role",
  "permissions": [
    {
      "id": 4,
      "name": "edit_tickets",
      "created": "2024-01-15T10:00:00Z",
      "updated": "2024-01-15T10:00:00Z"
    },
    {
      "id": 5,
      "name": "delete_tickets",
      "created": "2024-01-15T10:00:00Z",
      "updated": "2024-01-15T10:00:00Z"
    },
    {
      "id": 6,
      "name": "assign_tickets",
      "created": "2024-01-15T10:00:00Z",
      "updated": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Remove Permissions from Role**
- **Endpoint**: `DELETE /api/v1/client/organisation/roles/{id}/permissions`
- **Authentication**: Required
- **Request Body**:
```json
{
  "permission_ids": [4, 5]
}
```
- **Response**:
```json
{
  "message": "Removed 2 permission(s) from role"
}
```

##### Permissions

**List All Permissions**
- **Endpoint**: `GET /api/v1/client/organisation/roles/permissions/`
- **Authentication**: Required
- **Description**: Get all available custom permissions (not filtered by organization)
- **Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 10,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "view_tickets",
      "created": "2024-01-15T10:00:00Z",
      "updated": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "name": "create_tickets",
      "created": "2024-01-15T10:00:00Z",
      "updated": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Get Permission Details**
- **Endpoint**: `GET /api/v1/client/organisation/roles/permissions/{id}`
- **Authentication**: Required
- **Response**: Same format as list item

**Create Permission**
- **Endpoint**: `POST /api/v1/client/organisation/roles/permissions/`
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "manage_users"
}
```
- **Response**: Returns the created permission

**Update Permission**
- **Endpoint**: `PATCH /api/v1/client/organisation/roles/permissions/{id}` (partial)
- **Endpoint**: `PUT /api/v1/client/organisation/roles/permissions/{id}` (full)
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "manage_all_users"
}
```
- **Response**: Returns the updated permission

**Delete Permission**
- **Endpoint**: `DELETE /api/v1/client/organisation/roles/permissions/{id}`
- **Authentication**: Required
- **Response**: `204 No Content` on success

**Important Notes:**
- All role endpoints automatically filter by the current organization (from subdomain)
- The `organisation` field is automatically set when creating roles - don't include it in the request
- Permissions are global (not organization-specific) but can be assigned to organization-specific roles
- When updating a role's permissions, use `permission_ids` in the request body
- The `permissions` field in responses shows full permission objects, while `permission_ids` is for write operations
- **Delete operations are not available** - roles and permissions can only be created, listed, retrieved, and updated
- Permissions endpoints are nested under roles: `/api/v1/client/organisation/roles/permissions/`

#### CSV Templates (Bulk Upload)

Organisations can define CSV templates to map CSV column headers to API fields for bulk uploads. Template types are separate: **members** (employees), **clients**, and **projects**. Each type has its own templates and default. Templates specify delimiter, encoding, and whether the file has a header row. One template per organisation and type can be marked as default.

**Base Path**: `/api/v1/client/organisation/csv-templates/`

**Permissions**: View requires `view_employees`, `view_clients`, or `view_projects`. Create/update/delete requires `create_employees`, `create_clients`, or `create_projects`.

##### List CSV Templates

**Endpoint**: `GET /api/v1/client/organisation/csv-templates/`

**Authentication**: Required

**Query Parameters** (optional):
- `?template_type=members` - Filter by type: `members`, `clients`, `projects`, or `deliverables`

**Page-specific usage:** On the **Clients** page, pass `?template_type=clients`. On the **Projects** page, pass `?template_type=projects`. On the **Deliverables** (bulk upload) page, pass `?template_type=deliverables`. Omit the parameter to list all templates.

**Response** (paginated):
```json
{
  "links": { "next": null, "previous": null },
  "count": 2,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "Standard members import",
      "template_type": "members",
      "template_type_display": "Bulk members (employees)",
      "is_default": true,
      "delimiter": ",",
      "encoding": "utf-8",
      "created": "2025-01-15T10:00:00Z"
    }
  ]
}
```

##### Get CSV Template Details

**Endpoint**: `GET /api/v1/client/organisation/csv-templates/{id}`

**Authentication**: Required

**Response**:
```json
{
  "id": 1,
  "organisation": 1,
  "name": "Standard members import",
  "template_type": "members",
  "template_type_display": "Bulk members (employees)",
  "description": "Use with CSV export from HR system.",
  "column_mapping": {
    "Phone": "account_data.phone_number",
    "Email": "account_data.email",
    "First Name": "account_data.first_name",
    "Last Name": "account_data.last_name",
    "Position": "position",
    "Base Salary": "base_salary",
    "Department": "department",
    "Created": "created",
    "Updated": "updated"
  },
  "delimiter": ",",
  "encoding": "utf-8",
  "has_header_row": true,
  "is_default": true,
  "created": "2025-01-15T10:00:00Z",
  "updated": "2025-01-15T10:00:00Z"
}
```

##### Create CSV Template

**Endpoint**: `POST /api/v1/client/organisation/csv-templates/`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Standard members import",
  "template_type": "members",
  "description": "Optional instructions.",
  "column_mapping": {
    "Phone": "account_data.phone_number",
    "Email": "account_data.email",
    "First Name": "account_data.first_name",
    "Last Name": "account_data.last_name",
    "Position": "position",
    "Base Salary": "base_salary",
    "Role": "role_name",
    "Manager Email": "manager_email",
    "Created": "created",
    "Updated": "updated"
  },
  "delimiter": ",",
  "encoding": "utf-8",
  "has_header_row": true,
  "is_default": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name for the template |
| `template_type` | string | Yes | `members`, `clients`, `projects`, or `deliverables` |
| `description` | string | No | Optional description or instructions |
| `column_mapping` | object | No | Map of CSV column name → field path (default `{}`) |
| `delimiter` | string | No | CSV delimiter (default `,`) |
| `encoding` | string | No | File encoding (default `utf-8`) |
| `has_header_row` | boolean | No | First row is headers (default `true`) |
| `is_default` | boolean | No | Use as default for this type (default `false`) |

**Response**: Returns the created template (same shape as Get CSV Template Details). The `organisation` field is set automatically.

##### Update CSV Template

**Endpoint**: `PATCH /api/v1/client/organisation/csv-templates/{id}` (partial)  
**Endpoint**: `PUT /api/v1/client/organisation/csv-templates/{id}` (full)

**Authentication**: Required

**Request Body**: Same fields as create (all optional for PATCH).

**Response**: Returns the updated template.

##### Delete CSV Template

**Endpoint**: `DELETE /api/v1/client/organisation/csv-templates/{id}`

**Authentication**: Required

**Response**: `204 No Content`

##### Get Default Template

**Endpoint**: `GET /api/v1/client/organisation/csv-templates/default?template_type=...`

**Authentication**: Required

**Query Parameters**:
- `template_type` (required): `members`, `clients`, `projects`, or `deliverables` — Use `clients` on the Clients page, `projects` on the Projects page, and `deliverables` on the Deliverables bulk-upload page to get the default template for that type.

**Response**: Returns the default template for that type (same shape as Get CSV Template Details). If no default is set, returns `404` with `{"detail": "No default template set for this type."}`.

**Important Notes**:
- All CSV template endpoints are scoped to the current organisation (from subdomain). The `organisation` field is set automatically on create.
- **Templates shown on each page:** On the **Clients** page, use `?template_type=clients`. On the **Projects** page, use `?template_type=projects`. On the **Deliverables** bulk-upload page, use `?template_type=deliverables` for list and default.
- **Bulk upload for clients and bulk upload for projects are separate**: use template type `clients` for the clients bulk-upload endpoint and `projects` for the projects bulk-upload endpoint. Each has its own CSV templates and default.
- Only one template per organisation and type can have `is_default=true`; setting it on one clears the flag on others.
- `column_mapping` keys are the exact CSV column headers as they appear in the file; values are dot-notation field paths. For **members** use `role_name`, `manager_email` (e.g. `"Role": "role_name"`). For **projects** use `client_name`, `name`, `manager_email`, `description`, `status`, `start_date`, `end_date`, `budget`. For **deliverables** use `client_name`, `project_name`, `name`, `description`, `order`, `due_date`, `created`, `updated` (e.g. `"Client Name": "client_name"`, `"Project Name": "project_name"`).
- **Created and Updated:** All three bulk-upload types (members, clients, projects) accept optional `created` and `updated` fields; they can be blank in the CSV. Map CSV columns to field paths `"Created": "created"` and `"Updated": "updated"`. Values should be ISO 8601 datetimes (e.g. `2024-01-15T10:00:00Z`). When provided, they are applied to the created record in the respective bulk upload.

#### Employee Management

The Employee Management API allows organizations to manage employee profiles, assign roles, and manage organizational hierarchy. All endpoints require authentication and automatically filter by the current organization (set via subdomain).

**Base Path**: `/api/v1/client/organisation/employees/`

**Key Feature**: The create employee endpoint supports creating both the Account and EmployeeProfile in a single request, making it easy to onboard new employees.

##### List Employees

**Endpoint**: `GET /api/v1/client/organisation/employees/`

**Authentication**: Required

**Query Parameters**:
- `?department=IT` - Filter by department
- `?role=1` - Filter by role ID
- `?search=john` - Search by name, email, or position

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 5,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "account_email": "john.doe@example.com",
      "account_phone": "+1234567890",
      "account_name": "John Doe",
      "position": "Software Engineer",
      "department": "Engineering",
      "role_name": "Employee",
      "date_hired": "2024-01-15",
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "account_email": "jane.smith@example.com",
      "account_phone": "+1234567891",
      "account_name": "Jane Smith",
      "position": "HR Manager",
      "department": "Human Resources",
      "role_name": "HR",
      "date_hired": "2024-01-10",
      "created": "2024-01-10T09:00:00Z",
      "updated": "2024-01-10T09:00:00Z"
    }
  ]
}
```

##### Get Employee Details

**Endpoint**: `GET /api/v1/client/organisation/employees/{id}`

**Authentication**: Required

**Response**:
```json
{
  "id": 1,
  "account_id": 10,
  "account_email": "john.doe@example.com",
  "account_phone": "+1234567890",
  "account_name": "John Doe",
  "position": "Software Engineer",
  "base_salary": 75000.00,
  "department": "Engineering",
  "date_hired": "2024-01-15",
  "manager_id": 2,
  "manager_name": "Jane Smith",
  "emergency_contact": "+1987654321",
  "national_id": "123-45-6789",
  "organisation": 1,
  "role_id": 3,
  "role_name": "Employee",
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z"
}
```

##### Create Employee

**Endpoint**: `POST /api/v1/client/organisation/employees/`

**Authentication**: Required

**Description**: Create a new employee profile. This endpoint supports two workflows:
1. **Create employee from existing account** - Use when the account already exists
2. **Create account and employee together** - Use when you need to create both in one request (recommended for onboarding new employees)

**Important**: When creating a new account via `account_data`, both the Account and EmployeeProfile are created in a single request. This is the recommended approach for adding new employees to your organization.

---

**Option 1: Using Existing Account**

Use this when the person already has an account in the system.

**Request Body**:
```json
{
  "account": 10,
  "position": "Software Engineer",
  "base_salary": 75000.00,
  "department": "Engineering",
  "date_hired": "2024-01-15",
  "role": 3,
  "manager": 2,
  "emergency_contact": "+1987654321",
  "national_id": "123-45-6789"
}
```

**Required Fields**:
- `account` - Existing account ID (must exist and not already have an employee profile for this organization)
- `position` - Job position/title
- `base_salary` - Base salary (decimal)

---

**Option 2: Creating Account and Employee Together** ⭐ **Recommended**

Use this when onboarding a new employee who doesn't have an account yet. This creates both the Account and EmployeeProfile in one request.

**Request Body**:
```json
{
  "account_data": {
    "phone_number": "+1234567890",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "middle_name": "Michael",
    "gender": "male"
  },
  "position": "Software Engineer",
  "base_salary": 75000.00,
  "department": "Engineering",
  "date_hired": "2024-01-15",
  "role": 3,
  "manager": 2,
  "emergency_contact": "+1987654321",
  "national_id": "123-45-6789"
}
```

**Required Fields**:
- `account_data` - Object containing account information (see fields below)
  - `phone_number` - Phone number (required, must be unique across all accounts)
- `position` - Job position/title
- `base_salary` - Base salary (decimal)

**Account Data Fields** (when using `account_data`):
- `phone_number` - Phone number (required, must be unique)
- `email` - Email address (optional)
- `first_name` - First name (optional)
- `last_name` - Last name (optional)
- `middle_name` - Middle name (optional)
- `gender` - Gender: "male" or "female" (optional)

**Optional Employee Fields**:
- `department` - Department name
- `date_hired` - Date hired (YYYY-MM-DD format: "2024-01-15")
- `role` - Role ID (must belong to same organization)
- `manager` - Manager's employee profile ID (must belong to same organization)
- `emergency_contact` - Emergency contact phone number
- `national_id` - National ID number

**Response**: Returns the created employee (same format as Get Employee Details)

**Example Response**:
```json
{
  "id": 1,
  "account_id": 25,
  "account_email": "john.doe@example.com",
  "account_phone": "+1234567890",
  "account_name": "John Doe",
  "position": "Software Engineer",
  "base_salary": "75000.00",
  "department": "Engineering",
  "date_hired": "2024-01-15",
  "role_id": 3,
  "role_name": "Employee",
  "manager_id": 2,
  "manager_name": "Jane Smith",
  "organisation": 1,
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z"
}
```

**Validation Rules**:
- Either `account` OR `account_data` must be provided, but **not both**
- If using `account_data`, the phone number must be unique (no existing account with that phone number)
- Account cannot already have an employee profile for this organization
- Role must belong to the same organization
- Manager must belong to the same organization
- Manager cannot be the same employee (self-reference)

**What Happens When Creating a New Account**:
- A new Account is created with `account_type` automatically set to `"employee"`
- The account is created with a default password: `"0000"`
- The `must_reset_password` flag is set to `true` (user must change password on first login)
- The account's `verification_status` is set to `"pending"` by default
- The EmployeeProfile is then created and linked to this new account

**Example: Creating a New Employee with Account**

```typescript
// Using axios
const response = await apiClient.post('/client/organisation/employees/', {
  account_data: {
    phone_number: "+1234567890",
    email: "john.doe@example.com",
    first_name: "John",
    last_name: "Doe",
    gender: "male"
  },
  position: "Software Engineer",
  base_salary: 75000.00,
  department: "Engineering",
  date_hired: "2024-01-15",
  role: 3  // Optional: assign a role immediately
});

// The response includes both account and employee information
console.log(response.data.account_id); // New account ID
console.log(response.data.id); // New employee profile ID
```

**Error Responses**:
- `400 Bad Request`: If both `account` and `account_data` are provided, or if required fields are missing
- `400 Bad Request`: If phone number already exists (when using `account_data`)
- `400 Bad Request`: If account already has an employee profile for this organization
- `404 Not Found`: If role or manager doesn't exist or doesn't belong to this organization

##### Update Employee

**Endpoint**: `PATCH /api/v1/client/organisation/employees/{id}` (partial update)
**Endpoint**: `PUT /api/v1/client/organisation/employees/{id}` (full update)

**Authentication**: Required

**Request Body** (PATCH example):
```json
{
  "position": "Senior Software Engineer",
  "base_salary": 90000.00,
  "department": "Engineering"
}
```

**Response**: Returns the updated employee

**Note**: Delete endpoint is not available. Employees can only be created, listed, retrieved, and updated.

##### Assign Role to Employee

**Endpoint**: `POST /api/v1/client/organisation/employees/{id}/assign_role`

**Authentication**: Required

**Request Body**:
```json
{
  "role_id": 2
}
```

**Response**:
```json
{
  "id": 1,
  "account_id": 10,
  "account_email": "john.doe@example.com",
  "position": "Software Engineer",
  "role_id": 2,
  "role_name": "IT Support",
  ...
}
```

**Error Responses**:
- `400 Bad Request`: If `role_id` is missing
- `404 Not Found`: If role doesn't exist or doesn't belong to this organization

##### Assign Manager to Employee

**Endpoint**: `POST /api/v1/client/organisation/employees/{id}/assign_manager`

**Authentication**: Required

**Request Body**:
```json
{
  "manager_id": 2
}
```

**Response**: Returns the updated employee with manager information

**Error Responses**:
- `400 Bad Request`: If `manager_id` is missing or employee tries to be their own manager
- `404 Not Found`: If manager doesn't exist or doesn't belong to this organization

##### Remove Manager from Employee

**Endpoint**: `DELETE /api/v1/client/organisation/employees/{id}/remove_manager`

**Authentication**: Required

**Response**: Returns the updated employee with `manager_id` and `manager_name` set to `null`

##### Get Employee Subordinates

**Endpoint**: `GET /api/v1/client/organisation/employees/{id}/subordinates`

**Authentication**: Required

**Description**: Get all employees who report directly to this employee (their manager)

**Response**:
```json
[
  {
    "id": 3,
    "account_email": "bob.jones@example.com",
    "account_phone": "+1234567892",
    "account_name": "Bob Jones",
    "position": "Junior Developer",
    "department": "Engineering",
    "role_name": "Employee",
    "date_hired": "2024-02-01",
    "created": "2024-02-01T08:00:00Z",
    "updated": "2024-02-01T08:00:00Z"
  }
]
```

##### Bulk Members Upload

**Endpoint**: `POST /api/v1/client/organisation/employees/bulk-upload/`

**Authentication**: Required

**Permission**: `create_employees`

**Description**: Create multiple employees (members) in one request. Each item can create a new account via `account_data` and an employee profile. Maximum 500 members per request. **Anyone who appears as a manager** (i.e. is listed as `manager_email` for another row) **is created first**, then the remaining members, so manager references resolve correctly. Phone number and position are not required; all fields may be omitted or blank.

**Request Body**:
```json
{
  "members": [
    {
      "account_data": {
        "phone_number": "+15551234567",
        "email": "jane@example.com",
        "first_name": "Jane",
        "last_name": "Doe"
      },
      "position": "Software Developer",
      "base_salary": "72000.00",
      "department": "Engineering",
      "date_hired": "2025-01-15",
      "role_name": "Developer",
      "manager_email": "john.smith@example.com"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `members` | array | Yes | List of member objects (max 500) |

Each **member** object: `account_data` (object, required – can be minimal). **Phone number and position are not required.** All fields may be blank: `position`, `base_salary` (decimal), `department`, `date_hired` (date), `role_name` (role name in this org), `manager_email` (manager's email in this org), `emergency_contact`, `national_id`, `created`, `updated` (optional; ISO 8601 datetime, can be blank in CSV; applied to both Account and EmployeeProfile).  
**account_data**: `phone_number`, `email`, `first_name`, `last_name`, `middle_name`, `gender` – all optional/blank allowed.

**Response** (`200 OK`):
```json
{
  "created_count": 2,
  "failed_count": 0,
  "created": [
    { "index": 0, "id": 10, "account_id": 101 },
    { "index": 1, "id": 11, "account_id": 102 }
  ],
  "errors": [],
  "warnings": [
    { "index": 0, "message": "Manager email \"X\" not found; used organisation owner as manager." }
  ]
}
```
`failed_count` is the number of **errors** (skipped or validation/save failures). **Warnings** (e.g. manager fallback to org owner) do not count as failures; those members were still created.

On partial failure, `errors` contains `{ "index": n, "error": ... }` for each failed item. **Members whose email is already in use are skipped** (error: `Email "X" is already in use; skipping.`). **Role** is specified by **name** (`role_name`), not ID; matched case-insensitively. **Manager** is specified by **email** (`manager_email`), not name or ID; if the given email is not found in the organisation, the **organisation owner** is used as manager (if they have an employee profile in this org); otherwise no manager is assigned and an error is reported. New accounts get default password `"0000"` and `must_reset_password: true`.

**Important Notes:**
- All employee endpoints automatically filter by the current organization (from subdomain)
- **Employee data is filtered based on user permissions and role**:
  - **List/Retrieve Employees**: 
    - Users with `view_employees` permission (e.g., Super Admin, HR, Manager) can see **all employees** in the organization
    - Users without `view_employees` permission can only see **themselves**
  - **Create Employee**: User must have `create_employees` permission
  - **Update Employee**: 
    - Users can always update **their own profile**
    - To update other employees, user must have `update_employees` permission
  - **Assign Role/Manager**: User must have `update_employees` permission
  - **View Subordinates**: 
    - Users can view their own subordinates
    - To view other employees' subordinates, user must have `view_employees` permission
- The `organisation` field is automatically set when creating employees - don't include it in the request
- An account can only have one employee profile per organization
- When assigning a role or manager, they must belong to the same organization
- Employees cannot be their own manager
- Delete operations are not available - employees can only be created, listed, retrieved, and updated
- Use query parameters for filtering and searching the employee list
- **Each user sees employee data relevant to their role and permissions**, ensuring data privacy and appropriate access levels

#### Ticket Management

The Ticket Management API allows organizations to create, manage, and track support tickets. All endpoints require authentication and automatically filter by the current organization (set via subdomain).

**Base Path**: `/api/v1/client/organisation/tickets/`

**Key Features**:
- Create, list, retrieve, and update tickets
- Assign/unassign tickets to employees
- Close and reopen tickets
- Add comments and attachments to tickets
- Filter tickets by status, priority, assigned user, category, and search
- Manage ticket categories (hierarchical)

##### Tickets

**List Tickets**

**Endpoint**: `GET /api/v1/client/organisation/tickets/`

**Authentication**: Required

**Query Parameters**:
- `?status=open` - Filter by status: `open`, `in-progress`, `resolved`, `closed`
- `?priority=high` - Filter by priority: `low`, `medium`, `high`, `urgent`
- `?assigned_to=5` - Filter by assigned user ID (use `assigned_to=me` to filter tickets assigned to current user)
- `?assigned_to_me=true` - Filter tickets assigned to current user (convenience parameter, alternative to `assigned_to=me`)
- `?category=2` - Filter by category ID
- `?project=1` - Filter by project ID
- `?client=1` - Filter by client ID (through projects)
- `?created_by=3` - Filter by creator ID (use `created_by=me` to filter tickets created by current user)
- `?search=login` - Search in ticket number, subject, and description (case-insensitive partial match)

**Note on "Assigned to Me" filtering**:
- Use `?assigned_to=me` or `?assigned_to_me=true` to show only tickets assigned to the current user
- Tickets with `assigned_to=null` (unassigned) are excluded when using assigned_to filters
- Permission checks still apply: users without `view_all_tickets` can only see tickets they created or are assigned to

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 10,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "ticket_number": "PC-0000001",
      "subject": "Issue with login",
      "status": "open",
      "priority": "high",
      "created_by": 5,
      "created_by_name": "John Doe",
      "created_by_email": "john@example.com",
      "assigned_to": {
        "id": 3,
        "email": "jane@example.com",
        "phone_number": "+1234567890",
        "first_name": "Jane",
        "last_name": "Smith",
        "full_name": "Jane Smith",
        "account_type": "employee"
      },
      "category": {
        "id": 2,
        "name": "Technical Support",
        "parent": null,
        "parent_name": null,
        "organisation": 1
      },
      "project": {
        "id": 1,
        "name": "Website Redesign",
        "client": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com",
          "company_name": "Acme Corp",
          "is_active": true
        },
        "status": "active",
        "status_display": "Active",
        "manager": 5,
        "manager_email": "jane.smith@example.com",
        "start_date": "2024-01-01",
        "end_date": "2024-06-30"
      },
      "comments_count": 2,
      "attachments_count": 1,
      "closed_at": null,
      "expected_completion_at": "2024-01-16T10:30:00Z",
      "is_overdue": false,
      "time_remaining_seconds": 7200,
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Get Ticket Details**

**Endpoint**: `GET /api/v1/client/organisation/tickets/{ticket_number}`

**Note**: Use the `ticket_number` (e.g., `PC-0000001`) instead of the internal `id` to retrieve tickets.

**Authentication**: Required

**Response**:
```json
{
  "id": 1,
  "ticket_number": "PC-0000001",
  "organisation": 1,
  "subject": "Issue with login",
  "description": "Cannot log in to the system. Getting error message.",
  "status": "open",
  "priority": "high",
  "created_by": 5,
  "created_by_name": "John Doe",
  "created_by_email": "john@example.com",
  "assigned_to": {
    "id": 3,
    "email": "jane@example.com",
    "phone_number": "+1234567890",
    "first_name": "Jane",
    "last_name": "Smith",
    "full_name": "Jane Smith",
    "account_type": "employee"
  },
  "category": {
    "id": 2,
    "name": "Technical Support",
    "parent": null,
    "parent_name": null,
    "organisation": 1
  },
  "comments_count": 2,
  "attachments_count": 1,
  "closed_at": null,
  "expected_completion_at": "2024-01-16T10:30:00Z",
  "is_overdue": false,
  "time_remaining_seconds": 7200,
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z"
}
```

**Priority-Based Timers & Overdue Detection**

Tickets automatically have expected completion times based on their priority level. This helps track whether tickets are overdue and provides countdown timers for the frontend.

**Priority Timer Configuration**:
- **Urgent**: 4 hours
- **High**: 24 hours (1 day)
- **Medium**: 72 hours (3 days)
- **Low**: 168 hours (7 days)

**How It Works**:
- The expected completion time is calculated as: `created` + priority timer duration
- For closed tickets: `expected_completion_at` and `time_remaining_seconds` are `null`, `is_overdue` is `false`
- For open tickets: All three fields are calculated based on the ticket's creation time and priority

**Response Fields**:
- `expected_completion_at` - ISO datetime string of when the ticket should be completed (null if closed)
- `is_overdue` - Boolean indicating if the ticket is past its expected completion time
- `time_remaining_seconds` - Integer representing seconds remaining until deadline:
  - Positive value: Time remaining (e.g., `7200` = 2 hours remaining)
  - Negative value: Overdue (e.g., `-3600` = 1 hour overdue)
  - `null`: Ticket is closed

**Frontend Usage Examples**:

```typescript
// Display overdue badge
{ticket.is_overdue && (
  <Badge color="red">Overdue</Badge>
)}

// Show countdown timer
{ticket.time_remaining_seconds !== null && (
  <CountdownTimer seconds={ticket.time_remaining_seconds} />
)}

// Format time remaining
const formatTimeRemaining = (seconds: number | null): string => {
  if (seconds === null) return 'Closed';
  if (seconds < 0) {
    const overdueHours = Math.abs(Math.floor(seconds / 3600));
    return `${overdueHours}h overdue`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m remaining`;
};

// Filter overdue tickets
const overdueTickets = tickets.filter(ticket => ticket.is_overdue);

// Sort by urgency (overdue first, then by time remaining)
const sortedTickets = tickets.sort((a, b) => {
  if (a.is_overdue && !b.is_overdue) return -1;
  if (!a.is_overdue && b.is_overdue) return 1;
  if (a.time_remaining_seconds === null) return 1;
  if (b.time_remaining_seconds === null) return -1;
  return a.time_remaining_seconds - b.time_remaining_seconds;
});
```

**Example Response with Overdue Ticket**:
```json
{
  "id": 2,
  "ticket_number": "PC-0000002",
  "subject": "Server down",
  "priority": "urgent",
  "status": "open",
  "expected_completion_at": "2024-01-15T14:00:00Z",
  "is_overdue": true,
  "time_remaining_seconds": -3600,
  "created": "2024-01-15T10:00:00Z"
}
```

**Example Response with Closed Ticket**:
```json
{
  "id": 3,
  "ticket_number": "PC-0000003",
  "subject": "Password reset",
  "priority": "high",
  "status": "closed",
  "closed_at": "2024-01-15T12:00:00Z",
  "expected_completion_at": null,
  "is_overdue": false,
  "time_remaining_seconds": null,
  "created": "2024-01-15T10:00:00Z"
}
```

**Create Ticket**

**Endpoint**: `POST /api/v1/client/organisation/tickets/`

**Authentication**: Required

**Request Body**:
```json
{
  "subject": "Issue with login",
  "description": "Cannot log in to the system",
  "priority": "high",
  "category_id": 2,
  "project_id": 1,
  "assigned_to_id": 3
}
```

**Note**: When creating, use `category_id`, `project_id`, and `assigned_to_id` (not `category`, `project`, and `assigned_to`). The response will return full objects for `assigned_to`, `category`, and `project`.

**Required Fields**:
- `subject` - Ticket subject (max 255 characters)
- `description` - Ticket description

**Optional Fields**:
- `priority` - Priority level: `low`, `medium`, `high`, `urgent` (default: `medium`)
- `status` - Status: `open`, `in-progress`, `resolved`, `closed` (default: `open`)
- `category_id` - Category ID (must belong to same organization)
- `project_id` - Project ID (must belong to same organization, optional - tickets can exist without projects)
- `assigned_to_id` - User ID to assign ticket to (must be an employee of the organization)
- `created_by` - User ID (defaults to current user if not provided)

**Note**: Use `category_id`, `project_id`, and `assigned_to_id` when creating/updating. The response will return full objects for `assigned_to`, `category`, and `project` with all their details.

**Response**: Returns the created ticket (same format as Get Ticket Details)

**Update Ticket**

**Endpoint**: `PATCH /api/v1/client/organisation/tickets/{ticket_number}` (partial update)
**Endpoint**: `PUT /api/v1/client/organisation/tickets/{ticket_number}` (full update)

**Note**: Use the `ticket_number` (e.g., `PC-0000001`) instead of the internal `id` to update tickets.

**Authentication**: Required

**Request Body** (PATCH example):
```json
{
  "status": "in-progress",
  "priority": "urgent",
  "assigned_to_id": 4,
  "category_id": 2,
  "project_id": 1
}
```

**Note**: When updating, use `assigned_to_id`, `category_id`, and `project_id` (not `assigned_to`, `category`, and `project`). The response will return full objects for `assigned_to`, `category`, and `project`.

**Response**: Returns the updated ticket

**Assign Ticket**

**Endpoint**: `POST /api/v1/client/organisation/tickets/{ticket_number}/assign`

**Note**: Use the `ticket_number` (e.g., `PC-0000001`) instead of the internal `id`.

**Authentication**: Required

**Request Body**:
```json
{
  "assigned_to": 3
}
```

**Note**: The response will return a full `assigned_to` object with user details, not just the ID.

**Response**: Returns the updated ticket with new assignment

**Error Responses**:
- `400 Bad Request`: If `assigned_to` is missing
- `400 Bad Request`: If assigned user is not an employee of this organization

**Unassign Ticket**

**Endpoint**: `POST /api/v1/client/organisation/tickets/{ticket_number}/unassign`

**Note**: Use the `ticket_number` (e.g., `PC-0000001`) instead of the internal `id`.

**Authentication**: Required

**Response**: Returns the updated ticket with `assigned_to` set to `null`

**Close Ticket**

**Endpoint**: `POST /api/v1/client/organisation/tickets/{ticket_number}/close`

**Note**: Use the `ticket_number` (e.g., `PC-0000001`) instead of the internal `id`.

**Authentication**: Required

**Description**: Sets ticket status to `closed` and sets `closed_at` timestamp

**Response**: Returns the updated ticket with status `closed` and `closed_at` timestamp

**Reopen Ticket**

**Endpoint**: `POST /api/v1/client/organisation/tickets/{ticket_number}/reopen`

**Note**: Use the `ticket_number` (e.g., `PC-0000001`) instead of the internal `id`.

**Authentication**: Required

**Description**: Sets ticket status to `open` and clears `closed_at` timestamp

**Response**: Returns the updated ticket with status `open` and `closed_at` set to `null`

**Get Ticket Comments**

**Endpoint**: `GET /api/v1/client/organisation/tickets/{ticket_number}/comments`

**Note**: Use the `ticket_number` (e.g., `PC-0000001`) instead of the internal `id`.

**Authentication**: Required

**Query Parameters**:
- `?include_replies=true` - Include replies in the response (default: `false`, returns only top-level comments)
- `?parent=5` - Filter to get only replies to a specific comment ID

**Response** (top-level comments only, default):
```json
[
  {
    "id": 1,
    "ticket": 1,
    "user": 3,
    "user_name": "Jane Smith",
    "user_email": "jane@example.com",
    "message": "Looking into this issue now.",
    "parent": null,
    "parent_id": null,
    "attachments_count": 0,
    "replies_count": 2,
    "created": "2024-01-15T11:00:00Z",
    "updated": "2024-01-15T11:00:00Z"
  },
  {
    "id": 2,
    "ticket": 1,
    "user": 5,
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "message": "Thanks for the update!",
    "parent": null,
    "parent_id": null,
    "attachments_count": 0,
    "replies_count": 0,
    "created": "2024-01-15T11:30:00Z",
    "updated": "2024-01-15T11:30:00Z"
  }
]
```

**Response** (with replies, `?include_replies=true`):
```json
[
  {
    "id": 1,
    "ticket": 1,
    "user": 3,
    "user_name": "Jane Smith",
    "user_email": "jane@example.com",
    "message": "Looking into this issue now.",
    "parent": null,
    "parent_id": null,
    "attachments_count": 0,
    "replies_count": 2,
    "created": "2024-01-15T11:00:00Z",
    "updated": "2024-01-15T11:00:00Z"
  },
  {
    "id": 3,
    "ticket": 1,
    "user": 4,
    "user_name": "Bob Wilson",
    "user_email": "bob@example.com",
    "message": "I can help with this.",
    "parent": 1,
    "parent_id": 1,
    "attachments_count": 0,
    "replies_count": 0,
    "created": "2024-01-15T11:15:00Z",
    "updated": "2024-01-15T11:15:00Z"
  },
  {
    "id": 4,
    "ticket": 1,
    "user": 5,
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "message": "Great, thanks!",
    "parent": 1,
    "parent_id": 1,
    "attachments_count": 0,
    "replies_count": 0,
    "created": "2024-01-15T11:20:00Z",
    "updated": "2024-01-15T11:20:00Z"
  }
]
```

**Get Ticket Attachments**

**Endpoint**: `GET /api/v1/client/organisation/tickets/{ticket_number}/attachments`

**Note**: Use the `ticket_number` (e.g., `PC-0000001`) instead of the internal `id`.

**Authentication**: Required

**Response**:
```json
[
  {
    "id": 1,
    "ticket": 1,
    "comment": null,
    "file_url": "https://example.com/files/attachment1.pdf",
    "file_type": "application/pdf",
    "uploaded_by": 3,
    "uploaded_by_name": "Jane Smith",
    "uploaded_by_email": "jane@example.com",
    "created": "2024-01-15T11:30:00Z",
    "updated": "2024-01-15T11:30:00Z"
  }
]
```

**Important Notes**:
- All ticket endpoints automatically filter by the current organization (from subdomain)
- The `organisation` field is automatically set when creating tickets - don't include it in the request
- The `ticket_number` field is **automatically generated** when a ticket is created - you cannot set or modify it
- **Tickets are retrieved using `ticket_number` (e.g., `PC-0000001`) instead of the internal `id`** - use `ticket_number` in all URL paths for ticket operations
- The `created_by` field defaults to the current user if not provided
- Status values must be one of: `open`, `in-progress`, `resolved`, `closed`
- Priority values must be one of: `low`, `medium`, `high`, `urgent`
- When assigning a ticket, the assigned user must be an employee of the organization
- Categories must belong to the same organization
- Delete operations are not available - tickets can only be created, listed, retrieved, and updated
- **Ticket numbers are unique and sequential per organization**, making them easy to reference and track
- **Ticket numbers are unique and sequential per organization**, making them easy to reference and track

##### Ticket Comments

**List Comments**

**Endpoint**: `GET /api/v1/client/organisation/tickets/comments/`

**Authentication**: Required

**Query Parameters**:
- `?ticket=1` - Filter by ticket ID
- `?parent=5` - Filter to get only replies to a specific comment ID
- `?include_replies=true` - Include replies in the response (default: `false`, returns only top-level comments)

**Response**: Same format as Get Ticket Comments

**Get Comment Details**

**Endpoint**: `GET /api/v1/client/organisation/tickets/comments/{id}`

**Authentication**: Required

**Response**: Returns comment details including parent information and replies count

**Example Response**:
```json
{
  "id": 1,
  "ticket": 1,
  "user": 3,
  "user_name": "Jane Smith",
  "user_email": "jane@example.com",
  "message": "Looking into this issue now.",
  "parent": null,
  "parent_id": null,
  "attachments_count": 0,
  "replies_count": 2,
  "created": "2024-01-15T11:00:00Z",
  "updated": "2024-01-15T11:00:00Z"
}
```

**Create Comment**

**Endpoint**: `POST /api/v1/client/organisation/tickets/comments/`

**Authentication**: Required

**Request Body** (Top-level comment):
```json
{
  "ticket": 1,
  "message": "This is a comment on the ticket",
  "user": 3
}
```

**Request Body** (Reply to a comment):
```json
{
  "ticket": 1,
  "parent": 5,
  "message": "This is a reply to comment #5",
  "user": 3
}
```

**Required Fields**:
- `ticket` - Ticket ID (must belong to same organization)
- `message` - Comment message

**Optional Fields**:
- `parent` - Parent comment ID (to create a reply to another comment)
- `user` - User ID (defaults to current user if not provided)

**Response**: Returns the created comment

**Example Response**:
```json
{
  "id": 6,
  "ticket": 1,
  "user": 3,
  "user_name": "Jane Smith",
  "user_email": "jane@example.com",
  "message": "This is a reply to comment #5",
  "parent": 5,
  "parent_id": 5,
  "attachments_count": 0,
  "replies_count": 0,
  "created": "2024-01-15T12:00:00Z",
  "updated": "2024-01-15T12:00:00Z"
}
```

**Validation Rules**:
- If `parent` is provided, it must belong to the same ticket
- Parent comment must exist and belong to the same organization
- Comments can be nested (replies to replies), but there's no explicit depth limit

**Update Comment**

**Endpoint**: `PATCH /api/v1/client/organisation/tickets/comments/{id}` (partial update)
**Endpoint**: `PUT /api/v1/client/organisation/tickets/comments/{id}` (full update)

**Authentication**: Required

**Request Body**:
```json
{
  "message": "Updated comment message"
}
```

**Response**: Returns the updated comment

**Get Replies to a Comment**

**Endpoint**: `GET /api/v1/client/organisation/tickets/comments/?ticket=1&parent=5`

**Authentication**: Required

**Description**: Get all replies to a specific comment

**Response**: Returns array of comments that are replies to the specified parent comment

**Example: Building Threaded Comments in Frontend**

```typescript
// 1. Get top-level comments for a ticket
const topLevelComments = await apiClient.get(
  `/client/organisation/tickets/${ticketId}/comments`
);

// 2. For each comment, fetch its replies if replies_count > 0
const commentsWithReplies = await Promise.all(
  topLevelComments.data.map(async (comment) => {
    if (comment.replies_count > 0) {
      const replies = await apiClient.get(
        `/client/organisation/tickets/comments/`,
        { params: { ticket: ticketId, parent: comment.id } }
      );
      return { ...comment, replies: replies.data };
    }
    return { ...comment, replies: [] };
  })
);

// 3. Create a reply to a comment
const reply = await apiClient.post('/client/organisation/tickets/comments/', {
  ticket: ticketId,
  parent: parentCommentId,
  message: "This is a reply"
});
```

**Important Notes**:
- Comments support threading - use the `parent` field to create replies
- Top-level comments have `parent: null` and `parent_id: null`
- Replies have `parent` and `parent_id` set to the parent comment's ID
- The `replies_count` field shows how many direct replies a comment has
- Comments are automatically filtered by organization (via ticket)
- The `user` field defaults to the current user if not provided
- When creating a reply, the `parent` comment must belong to the same ticket
- Delete operations are not available - comments can only be created, listed, retrieved, and updated

##### Categories

**List Categories**

**Endpoint**: `GET /api/v1/client/organisation/tickets/categories/`

**Authentication**: Required

**Query Parameters**:
- `?parent=1` - Filter by parent category ID
- `?parent=null` or `?parent=` - Get only top-level categories (no parent)

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 5,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "Technical Support",
      "parent": null,
      "parent_name": null,
      "created": "2024-01-15T10:00:00Z",
      "updated": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Billing",
      "parent": 1,
      "parent_name": "Technical Support",
      "created": "2024-01-15T10:05:00Z",
      "updated": "2024-01-15T10:05:00Z"
    }
  ]
}
```

**Get Category Details**

**Endpoint**: `GET /api/v1/client/organisation/tickets/categories/{id}`

**Authentication**: Required

**Response**:
```json
{
  "id": 1,
  "organisation": 1,
  "name": "Technical Support",
  "parent": null,
  "subcategories_count": 2,
  "created": "2024-01-15T10:00:00Z",
  "updated": "2024-01-15T10:00:00Z"
}
```

**Create Category**

**Endpoint**: `POST /api/v1/client/organisation/tickets/categories/`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Technical Support",
  "parent": null
}
```

**Required Fields**:
- `name` - Category name (max 100 characters)

**Optional Fields**:
- `parent` - Parent category ID (for subcategories, must belong to same organization)

**Response**: Returns the created category

**Update Category**

**Endpoint**: `PATCH /api/v1/client/organisation/tickets/categories/{id}` (partial update)
**Endpoint**: `PUT /api/v1/client/organisation/tickets/categories/{id}` (full update)

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Updated Category Name",
  "parent": 1
}
```

**Response**: Returns the updated category

**Important Notes**:
- All category endpoints automatically filter by the current organization (from subdomain)
- The `organisation` field is automatically set when creating categories - don't include it in the request
- Parent categories must belong to the same organization
- Categories support hierarchical structure (parent-child relationships)
- Delete operations are not available - categories can only be created, listed, retrieved, and updated

##### Attachments

**List Attachments**

**Endpoint**: `GET /api/v1/client/organisation/tickets/attachments/`

**Authentication**: Required

**Query Parameters**:
- `?ticket=1` - Filter by ticket ID
- `?comment=2` - Filter by comment ID

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 3,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "ticket": 1,
      "comment": null,
      "file_url": "https://example.com/files/attachment1.pdf",
      "file_type": "application/pdf",
      "uploaded_by": 3,
      "uploaded_by_name": "Jane Smith",
      "uploaded_by_email": "jane@example.com",
      "created": "2024-01-15T11:30:00Z",
      "updated": "2024-01-15T11:30:00Z"
    }
  ]
}
```

**Get Attachment Details**

**Endpoint**: `GET /api/v1/client/organisation/tickets/attachments/{id}`

**Authentication**: Required

**Response**: Returns attachment details

**Create Attachment**

**Endpoint**: `POST /api/v1/client/organisation/tickets/attachments/`

**Authentication**: Required

**Request Body**:
```json
{
  "ticket": 1,
  "comment": null,
  "file_url": "https://example.com/files/attachment1.pdf",
  "file_type": "application/pdf",
  "uploaded_by": 3
}
```

**Required Fields**:
- Either `ticket` OR `comment` (one is required, not both)
- `file_url` - URL to the uploaded file
- `file_type` - MIME type of the file (e.g., `application/pdf`, `image/png`)

**Optional Fields**:
- `uploaded_by` - User ID (defaults to current user if not provided)

**Response**: Returns the created attachment

**Update Attachment**

**Endpoint**: `PATCH /api/v1/client/organisation/tickets/attachments/{id}` (partial update)
**Endpoint**: `PUT /api/v1/client/organisation/tickets/attachments/{id}` (full update)

**Authentication**: Required

**Request Body**:
```json
{
  "file_url": "https://example.com/files/updated-attachment.pdf",
  "file_type": "application/pdf"
}
```

**Response**: Returns the updated attachment

**Important Notes**:
- Attachments are automatically filtered by organization (via ticket or comment's ticket)
- Either `ticket` OR `comment` must be provided, but not both

##### Clients

**List Clients**

**Endpoint**: `GET /api/v1/client/organisation/tickets/clients/`

**Authentication**: Required

**Query Parameters**:
- `?is_active=true` - Filter by active status (`true` or `false`)
- `?search=acme` - Search in name, email, or company name (case-insensitive partial match)

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 5,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "company_name": "Acme Corp",
      "is_active": true,
      "projects_count": 3,
      "created": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Get Client Details**

**Endpoint**: `GET /api/v1/client/organisation/tickets/clients/{id}`

**Authentication**: Required

**Response**:
```json
{
  "id": 1,
  "organisation": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+1234567890",
  "company_name": "Acme Corp",
  "address": "123 Main St, City, State 12345",
  "notes": "Preferred contact method: email",
  "is_active": true,
  "projects_count": 3,
  "created": "2024-01-15T10:00:00Z",
  "updated": "2024-01-15T10:00:00Z"
}
```

**Create Client**

**Endpoint**: `POST /api/v1/client/organisation/tickets/clients/`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+1234567890",
  "company_name": "Acme Corp",
  "address": "123 Main St, City, State 12345",
  "notes": "Preferred contact method: email",
  "is_active": true
}
```

**Required Fields**:
- `name` - Client name (max 255 characters)

**Optional Fields**:
- `email` - Client email address
- `phone_number` - Client phone number (max 50 characters)
- `company_name` - Company name if client is a business (max 255 characters)
- `address` - Client address
- `notes` - Additional notes about the client
- `is_active` - Whether client is active (default: `true`)

**Response**: Returns the created client

**Update Client**

**Endpoint**: `PATCH /api/v1/client/organisation/tickets/clients/{id}` (partial update)
**Endpoint**: `PUT /api/v1/client/organisation/tickets/clients/{id}` (full update)

**Authentication**: Required

**Request Body**:
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "is_active": false
}
```

**Response**: Returns the updated client

**Delete Client**

**Endpoint**: `DELETE /api/v1/client/organisation/tickets/clients/{id}`

**Authentication**: Required

**Response**: `204 No Content`

**Important Notes**:
- All client endpoints automatically filter by the current organization
- The `organisation` field is automatically set when creating clients - don't include it in the request
- Clients can have multiple projects
- Deleting a client will cascade delete all associated projects and their tickets (use with caution)

##### Bulk Clients Upload

**Endpoint**: `POST /api/v1/client/organisation/tickets/clients/bulk-upload/`

**Authentication**: Required

**Permission**: `create_clients`

**Description**: Create multiple clients in one request (clients only, no projects). Maximum 200 clients per request. **Required:** `name`. **Important:** `company_name`. All other fields may be omitted or blank and will be accepted.

**Request Body**:
```json
{
  "clients": [
    {
      "name": "Acme Corporation",
      "company_name": "Acme Corp"
    },
    {
      "name": "Another Client",
      "email": "contact@example.com",
      "phone_number": "",
      "address": "",
      "notes": "",
      "is_active": true
    }
  ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Client/contact name |
| `company_name` | No | Company name (important; may be blank) |
| `email`, `phone_number`, `address`, `notes` | No | Optional; blank or omitted allowed |
| `is_active` | No | Default `true` |
| `created`, `updated` | No | Optional; ISO 8601 datetime. Can be blank in CSV. |

**Response** (`200 OK`):
```json
{
  "clients_created": 1,
  "created_clients": [{ "index": 0, "id": 42, "name": "Acme Corporation" }],
  "errors": []
}
```

##### Bulk Projects Upload

**Endpoint**: `POST /api/v1/client/organisation/tickets/projects/bulk-upload/`

**Authentication**: Required

**Permission**: `create_projects`

**Description**: Create multiple projects in one request. Each project specifies a `client_name` (must match an existing client in the current organisation) and can include deliverables and phases. Maximum 500 projects per request.

**Request Body**:
```json
{
  "projects": [
    {
      "client_name": "Acme Corporation",
      "name": "Website Redesign",
      "description": "Full website overhaul",
      "status": "active",
      "start_date": "2025-02-01",
      "end_date": "2025-06-30",
      "budget": "50000.00",
      "manager_email": "jane.smith@example.com",
      "deliverables": [
        { "name": "Design mockups", "order": 0, "due_date": "2025-03-01" },
        { "name": "Frontend build", "order": 1 }
      ],
      "phases": [
        { "name": "Discovery", "order": 0, "start_date": "2025-02-01", "end_date": "2025-02-15" },
        { "name": "Build", "order": 1 }
      ]
    }
  ]
}
```

| Level | Required | Optional |
|-------|----------|----------|
| **Project** | `client_name`, `name` | `description`, `status`, `start_date`, `end_date`, `budget`, `manager_email` (project manager email, must be an employee in this organisation), `deliverables`, `phases`, `created`, `updated` (optional; can be blank in CSV) |
| **Deliverable** | `name` | `description`, `order`, `due_date` |
| **Phase** | `name` | `description`, `order`, `start_date`, `end_date` |

**Response** (`200 OK`):
```json
{
  "projects_created": 1,
  "deliverables_created": 2,
  "phases_created": 2,
  "created_projects": [{ "project_index": 0, "id": 88, "name": "Website Redesign", "client_id": 42, "client_name": "Acme Corporation" }],
  "created_deliverables": [{ "project_id": 88, "id": 1 }, { "project_id": 88, "id": 2 }],
  "created_phases": [{ "project_id": 88, "id": 1 }, { "project_id": 88, "id": 2 }],
  "errors": []
}
```

On partial failure, `errors` contains entries with `project_index` and `error` (e.g. `Client named "X" not found in this organisation.` or `Manager email "X" not found in this organisation.`). `client_name` must match an existing client in the organisation exactly. `manager_email` must be an employee's email in this organisation (case-insensitive); if not found, the project is still created with no manager and the error is reported.

##### Projects

**List Projects**

**Endpoint**: `GET /api/v1/client/organisation/tickets/projects/`

**Authentication**: Required

**Query Parameters**:
- `?client=1` - Filter by client ID
- `?status=active` - Filter by status: `active`, `on_hold`, `completed`, `cancelled`
- `?manager=5` - Filter by project manager (employee account ID)
- `?search=website` - Search in name, description, or client name (case-insensitive partial match)

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 5,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "Website Redesign",
      "client": 1,
      "client_name": "John Doe",
      "client_company": "Acme Corp",
      "status": "active",
      "status_display": "Active",
      "manager": 5,
      "manager_email": "jane.smith@example.com",
      "start_date": "2024-01-01",
      "end_date": "2024-06-30",
      "tickets_count": 12,
      "created": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Get Project Details**

**Endpoint**: `GET /api/v1/client/organisation/tickets/projects/{id}`

**Authentication**: Required

**Response**:
```json
{
  "id": 1,
  "organisation": 1,
  "client": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "company_name": "Acme Corp",
    "is_active": true
  },
  "name": "Website Redesign",
  "description": "Complete redesign of the company website",
  "status": "active",
  "status_display": "Active",
  "start_date": "2024-01-01",
  "end_date": "2024-06-30",
  "budget": "50000.00",
  "manager": 5,
  "manager_name": "Jane Smith",
  "tickets_count": 12,
  "created": "2024-01-15T10:00:00Z",
  "updated": "2024-01-15T10:00:00Z"
}
```

**Create Project**

**Endpoint**: `POST /api/v1/client/organisation/tickets/projects/`

**Authentication**: Required

**Request Body**:
```json
{
  "client": 1,
  "name": "Website Redesign",
  "description": "Complete redesign of the company website",
  "status": "active",
  "start_date": "2024-01-01",
  "end_date": "2024-06-30",
  "budget": "50000.00",
  "manager": 5
}
```

**Required Fields**:
- `client` - Client ID (must belong to the same organization)
- `name` - Project name (max 255 characters)

**Optional Fields**:
- `description` - Project description
- `status` - Project status: `active`, `on_hold`, `completed`, `cancelled` (default: `active`)
- `start_date` - Project start date (YYYY-MM-DD)
- `end_date` - Project end date (YYYY-MM-DD)
- `budget` - Project budget (decimal)
- `manager` - Project manager (employee account ID)

**Response**: Returns the created project

**Update Project**

**Endpoint**: `PATCH /api/v1/client/organisation/tickets/projects/{id}` (partial update)
**Endpoint**: `PUT /api/v1/client/organisation/tickets/projects/{id}` (full update)

**Authentication**: Required

**Request Body**:
```json
{
  "status": "completed",
  "end_date": "2024-06-15"
}
```

**Response**: Returns the updated project

**Delete Project**

**Endpoint**: `DELETE /api/v1/client/organisation/tickets/projects/{id}`

**Authentication**: Required

**Response**: `204 No Content`

**Important Notes**:
- All project endpoints automatically filter by the current organization
- The `organisation` field is automatically set when creating projects - don't include it in the request
- Projects must belong to a client in the same organization
- Projects can have multiple tickets
- Tickets can optionally be associated with a project (via `project_id` field)
- Deleting a project will set all associated tickets' `project` field to `null` (tickets are not deleted)
- Project statuses: `active` (default), `on_hold`, `completed`, `cancelled`

**TypeScript Types**:
```typescript
interface Client {
  id: number;
  organisation: number;
  name: string;
  email?: string;
  phone_number?: string;
  company_name?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  projects_count: number;
  created: string;
  updated: string;
}

interface Project {
  id: number;
  organisation: number;
  client: number | ClientNested;
  name: string;
  description?: string;
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  status_display: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
  manager?: number;
  manager_name?: string;
  tickets_count: number;
  created: string;
  updated: string;
}

interface ClientNested {
  id: number;
  name: string;
  email?: string;
  company_name?: string;
  is_active: boolean;
}
```

**Frontend Implementation Examples**:

```typescript
// List clients
const clients = await apiClient.get('/client/organisation/tickets/clients', {
  params: { is_active: true, search: 'acme' }
});

// Create client
const newClient = await apiClient.post('/client/organisation/tickets/clients', {
  name: 'John Doe',
  email: 'john@example.com',
  company_name: 'Acme Corp',
  is_active: true
});

// List projects for a client
const projects = await apiClient.get('/client/organisation/tickets/projects', {
  params: { client: 1, status: 'active' }
});

// Create project
const newProject = await apiClient.post('/client/organisation/tickets/projects', {
  client: 1,
  name: 'Website Redesign',
  description: 'Complete redesign of the company website',
  status: 'active',
  start_date: '2024-01-01',
  end_date: '2024-06-30',
  budget: '50000.00',
  manager: 5
});

// Create ticket with project
const newTicket = await apiClient.post('/client/organisation/tickets', {
  subject: 'Fix login bug',
  description: 'Users cannot log in',
  priority: 'high',
  project_id: 1,  // Associate ticket with project
  category_id: 2
});
```
- The `uploaded_by` field defaults to the current user if not provided
- The ticket or comment's ticket must belong to the current organization
- Delete operations are not available - attachments can only be created, listed, retrieved, and updated

##### Deliverables

Deliverables are items to be delivered for a project. Deliverables belong to a project, and projects are scoped to the current organisation.

**Base Path**: `/api/v1/client/organisation/tickets/deliverables/`

**Authentication**: Required

**Permissions**:
- `view_projects` - List / retrieve deliverables
- `create_projects` - Create deliverables
- `update_projects` - Update deliverables
- `delete_projects` - Delete deliverables

**List Deliverables**

**Endpoint**: `GET /api/v1/client/organisation/tickets/deliverables/`

**Query Parameters**:
- `?project=123` - Filter deliverables by project ID

**Response** (`200 OK`): Paginated list (same pagination shape as other list endpoints)

**Create Deliverable**

**Endpoint**: `POST /api/v1/client/organisation/tickets/deliverables/`

**Request Body**:
```json
{
  "project": 123,
  "name": "Design mockups",
  "description": "Initial UI concepts",
  "order": 0,
  "due_date": "2025-03-01"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `project` | Yes | Project ID (must belong to current organisation) |
| `name` | Yes | Deliverable name |
| `description` | No | Optional description |
| `order` | No | Sort order (integer; default `0`) |
| `due_date` | No | Due date (YYYY-MM-DD) |

**Get Deliverable Details**

**Endpoint**: `GET /api/v1/client/organisation/tickets/deliverables/{id}`

**Update Deliverable**

**Endpoint**: `PATCH /api/v1/client/organisation/tickets/deliverables/{id}` (partial update)  
**Endpoint**: `PUT /api/v1/client/organisation/tickets/deliverables/{id}` (full update)

**Delete Deliverable**

**Endpoint**: `DELETE /api/v1/client/organisation/tickets/deliverables/{id}`

**Bulk Deliverables Upload**

**Endpoint**: `POST /api/v1/client/organisation/tickets/deliverables/bulk-upload/`

**Authentication**: Required

**Permission**: `create_projects`

**Description**: Create multiple deliverables in one request. Each item specifies `client_name` and `project_name` (must match an existing client and project in the current organisation). Maximum 500 deliverables per request.

**Request Body**:
```json
{
  "deliverables": [
    {
      "client_name": "BlueRock Therapeutics",
      "project_name": "General",
      "name": "Design mockups",
      "description": "Initial UI concepts",
      "order": 0,
      "due_date": "2025-03-01"
    },
    {
      "client_name": "BlueRock Therapeutics",
      "project_name": "General",
      "name": "Frontend build",
      "order": 1
    }
  ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `client_name` | Yes | Client name (must exist in current organisation) |
| `project_name` | Yes | Project name under that client (must exist) |
| `name` | Yes | Deliverable name |
| `description` | No | Optional description |
| `order` | No | Sort order (integer; default `0`) |
| `due_date` | No | Due date (YYYY-MM-DD) |
| `created`, `updated` | No | Optional; ISO 8601 datetime (can be blank in CSV) |

**Response** (`200 OK`):
```json
{
  "deliverables_created": 2,
  "created_deliverables": [
    { "deliverable_index": 0, "id": 1, "project_id": 88, "name": "Design mockups" },
    { "deliverable_index": 1, "id": 2, "project_id": 88, "name": "Frontend build" }
  ],
  "errors": []
}
```

On partial failure, `errors` contains entries with `deliverable_index` and `error` (e.g. client or project not found).

**CSV template**: A template file `data/deliverables-csv-template.csv` has columns: **Name**, **Description**, **Order**, **Due Date**, **Created**, **Updated**, **Client Name**, **Project Name**. Use these when mapping CSV uploads to the bulk-upload payload.

**Important Notes**:
- All deliverable endpoints automatically scope to the current organisation (via the deliverable’s project).
- When creating/updating, the referenced `project` must belong to the same organisation.

**TypeScript Types**:
```typescript
interface Deliverable {
  id: number;
  project: number;
  name: string;
  description?: string;
  order: number;
  due_date?: string | null;
  created: string;
  updated?: string;
}
```

**Frontend Implementation Examples**:
```typescript
// List deliverables for a project
const deliverables = await apiClient.get('/client/organisation/tickets/deliverables', {
  params: { project: 123 }
});

// Create deliverable
const newDeliverable = await apiClient.post('/client/organisation/tickets/deliverables', {
  project: 123,
  name: 'Design mockups',
  order: 0,
  due_date: '2025-03-01'
});
```

#### Knowledge Base Management

The Knowledge Base API allows organizations to create, manage, and publish help articles for their users. All endpoints require authentication and automatically filter by the current organization (set via subdomain).

**Base Path**: `/api/v1/client/organisation/knowledgebase/`

**Key Features**:
- Create, list, retrieve, and update articles
- Publish/unpublish articles (control visibility: internal vs public)
- Filter articles by visibility, category, author, and search
- Version tracking for articles (auto-increments on update)
- Permission-based access control

**Permissions**:
- `view_knowledge_base` - View articles
- `create_knowledge_base` - Create new articles
- `update_knowledge_base` - Update existing articles
- `publish_knowledge_base` - Publish articles (set visibility to public)

##### List Articles

**Endpoint**: `GET /api/v1/client/organisation/knowledgebase/`

**Authentication**: Required

**Permissions**: Requires `view_knowledge_base` permission

**Query Parameters**:
- `?visibility=public` - Filter by visibility: `internal`, `public`
- `?category=2` - Filter by category ID
- `?author=5` - Filter by author ID (use `author=me` to filter articles by current user)
- `?search=password` - Search in title and content (case-insensitive partial match)

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 5,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "title": "How to reset your password",
      "visibility": "public",
      "author": {
        "id": 3,
        "email": "jane@example.com",
        "phone_number": "+1234567890",
        "first_name": "Jane",
        "last_name": "Smith",
        "full_name": "Jane Smith",
        "account_type": "employee"
      },
      "category": {
        "id": 2,
        "name": "Account Management",
        "parent": null,
        "parent_name": null,
        "organisation": 1
      },
      "version": 1,
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-15T10:30:00Z"
    }
  ]
}
```

##### Get Article Details

**Endpoint**: `GET /api/v1/client/organisation/knowledgebase/{id}`

**Authentication**: Required

**Permissions**: Requires `view_knowledge_base` permission

**Response**:
```json
{
  "id": 1,
  "organisation": 1,
  "title": "How to reset your password",
  "content": "<h1>Password Reset Guide</h1><p>Follow these steps to reset your password...</p>",
  "visibility": "public",
  "author": {
    "id": 3,
    "email": "jane@example.com",
    "phone_number": "+1234567890",
    "first_name": "Jane",
    "last_name": "Smith",
    "full_name": "Jane Smith",
    "account_type": "employee"
  },
  "category": {
    "id": 2,
    "name": "Account Management",
    "parent": null,
    "parent_name": null,
    "organisation": 1
  },
  "version": 1,
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z"
}
```

##### Create Article

**Endpoint**: `POST /api/v1/client/organisation/knowledgebase/`

**Authentication**: Required

**Permissions**: Requires `create_knowledge_base` permission

**Request Body**:
```json
{
  "title": "How to reset your password",
  "content": "<h1>Password Reset Guide</h1><p>Follow these steps...</p>",
  "visibility": "internal",
  "category_id": 2,
  "author_id": 3
}
```

**Required Fields**:
- `title` - Article title (max 255 characters)
- `content` - Article content (HTML/Markdown)

**Optional Fields**:
- `visibility` - Visibility level: `internal`, `public` (default: `internal`)
- `category_id` - Category ID (must belong to same organization)
- `author_id` - Author ID (defaults to current user if not provided, must be an employee of the organization)

**Response**: Returns the created article (same format as Get Article Details)

**Important Notes**:
- The `organisation` field is automatically set - don't include it in the request
- The `author` defaults to the current user if `author_id` is not provided
- The `version` field is automatically set to 1 for new articles
- Articles start as `internal` by default and can be published later

##### Update Article

**Endpoint**: `PATCH /api/v1/client/organisation/knowledgebase/{id}` (partial update)
**Endpoint**: `PUT /api/v1/client/organisation/knowledgebase/{id}` (full update)

**Authentication**: Required

**Permissions**: Requires `update_knowledge_base` permission

**Request Body** (PATCH example):
```json
{
  "title": "Updated: How to reset your password",
  "content": "<h1>Updated Password Reset Guide</h1><p>New steps...</p>",
  "visibility": "public",
  "category_id": 3
}
```

**Response**: Returns the updated article with incremented version number

**Important Notes**:
- The `version` field is automatically incremented on each update
- Use `category_id` when updating (not `category`)
- The `author` cannot be changed after creation
- Updates are logged in the audit trail

##### Publish Article

**Endpoint**: `POST /api/v1/client/organisation/knowledgebase/{id}/publish`

**Authentication**: Required

**Permissions**: Requires `publish_knowledge_base` permission

**Description**: Sets the article's visibility to `public`, making it accessible to all users.

**Response**: Returns the updated article with `visibility: "public"`

**Example Response**:
```json
{
  "id": 1,
  "title": "How to reset your password",
  "visibility": "public",
  "version": 1,
  ...
}
```

##### Unpublish Article

**Endpoint**: `POST /api/v1/client/organisation/knowledgebase/{id}/unpublish`

**Authentication**: Required

**Permissions**: Requires `update_knowledge_base` permission

**Description**: Sets the article's visibility to `internal`, making it accessible only to organization members.

**Response**: Returns the updated article with `visibility: "internal"`

##### Upload Image for Article

**Endpoint**: `POST /api/v1/client/organisation/knowledgebase/upload_image`

**Authentication**: Required

**Permissions**: Requires `create_knowledge_base` permission

**Description**: Upload an image to be used in knowledge base article content. Returns the image URL that can be embedded in the article HTML.

**Request**: `multipart/form-data`

**Form Fields**:
- `image` - Image file (required)
  - Allowed types: JPEG, JPG, PNG, GIF, WebP
  - Maximum size: 5MB
- `article_id` - Article ID to associate image with (optional)
- `alt_text` - Alternative text for accessibility (optional)

**Example Request (using FormData)**:
```typescript
const formData = new FormData();
formData.append('image', imageFile);  // File object from input
formData.append('alt_text', 'Screenshot of login page');
formData.append('article_id', '5');  // Optional

const response = await apiClient.post(
  '/client/organisation/knowledgebase/upload_image',
  formData,
  {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }
);
```

**Response**:
```json
{
  "id": 1,
  "organisation": 1,
  "article": 5,
  "image": "/media/knowledgebase_images/screenshot_2024_01_15.png",
  "url": "http://localhost:9000/media/knowledgebase_images/screenshot_2024_01_15.png",
  "uploaded_by": 3,
  "alt_text": "Screenshot of login page",
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z"
}
```

**Response Fields**:
- `id` - Image ID
- `organisation` - Organization ID
- `article` - Article ID (null if not associated)
- `image` - Relative path to the image file
- `url` - Full URL to access the image (use this in article content)
- `uploaded_by` - User ID who uploaded the image
- `alt_text` - Alternative text for accessibility
- `created`, `updated` - Timestamps

**Using with React Quill**:

```typescript
// Custom image handler for React Quill
import ReactQuill from 'react-quill';
import { useRef } from 'react';

export function ArticleEditor() {
  const quillRef = useRef<ReactQuill>(null);
  
  // Custom image handler
  const imageHandler = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/jpeg,image/jpg,image/png,image/gif,image/webp');
    input.click();
    
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      // Upload image
      const formData = new FormData();
      formData.append('image', file);
      formData.append('alt_text', file.name);
      
      try {
        const response = await apiClient.post(
          '/client/organisation/knowledgebase/upload_image',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        // Get the image URL from response
        const imageUrl = response.data.url;
        
        // Insert image into editor
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', imageUrl);
          quill.setSelection(range.index + 1);
        }
      } catch (error) {
        console.error('Image upload failed:', error);
        alert('Failed to upload image');
      }
    };
  };
  
  // Quill modules with custom image handler
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],  // Image button
        ['clean']
      ],
      handlers: {
        image: imageHandler  // Custom image handler
      }
    }
  };
  
  return (
    <ReactQuill
      ref={quillRef}
      theme="snow"
      modules={modules}
      value={content}
      onChange={setContent}
    />
  );
}
```

**Alternative: Base64 Images (Not Recommended)**

React Quill can also embed images as base64 data URLs. However, this approach:
- ❌ Increases article content size significantly
- ❌ Slows down page load times
- ❌ Makes content harder to manage
- ✅ Works without server upload

**Recommendation**: Use the `upload_image` endpoint for better performance and manageability.

**Important Notes**:
- All knowledge base endpoints automatically filter by the current organization (from subdomain)
- The `organisation` field is automatically set when creating articles - don't include it in the request
- Articles support HTML or Markdown content in the `content` field
- The `version` field tracks article revisions and auto-increments on updates
- Public articles can be viewed by anyone, internal articles are restricted to organization members
- Categories must belong to the same organization
- Authors must be employees of the organization
- Delete operations are not available - articles can only be created, listed, retrieved, and updated
- Use the `publish` and `unpublish` actions to control article visibility
- All operations are logged in the audit trail

---

### Recurring Ticket Templates

Recurring ticket templates allow you to automatically generate tickets based on recurrence patterns (daily, weekly, monthly, yearly). When a ticket generated from a template is closed, it automatically creates a timesheet entry (existing functionality).

**Key Features:**
- Create templates with recurrence patterns (daily, weekly, monthly, yearly)
- Automatically generate ticket instances based on the pattern
- Pause and resume templates
- View all ticket instances generated from a template
- Templates support date variables in subject/description (`{date}`)
- Auto-deactivate when max occurrences or end date is reached

**Base Path**: `/api/v1/client/organisation/tickets/recurring/`

#### TypeScript Interfaces

```typescript
interface RecurringTicketTemplate {
  id: number;
  organisation: number;
  created_by: AccountNested;
  subject: string;  // Can use {date} variable
  description: string;  // Can use {date} variable
  priority: TicketPriority;
  category?: CategoryNested;
  category_id?: number;  // Write-only
  project?: ProjectNested;
  project_id?: number;  // Write-only
  assigned_to?: AccountNested;
  assigned_to_id?: number;  // Write-only
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  recurrence_config: {
    // Daily: { interval: 1 } (every N days)
    // Weekly: { days_of_week: [0,2,4], interval: 1 } (0=Monday, 6=Sunday, every N weeks)
    // Monthly: { day_of_month: 15, interval: 1 } (day 1-31, every N months)
    // Yearly: { month: 1, day_of_month: 15 } (month 1-12, day 1-31)
    // Custom: { cron: '0 9 * * 1' } (cron expression)
    [key: string]: any;
  };
  start_date: string;  // Date (YYYY-MM-DD)
  end_date?: string;  // Date (YYYY-MM-DD), null = no end
  next_occurrence_date?: string;  // Date (YYYY-MM-DD), managed by system
  max_occurrences?: number;  // null = unlimited
  occurrences_generated: number;  // Read-only
  is_active: boolean;
  ticket_instances_count: number;  // Read-only
  created: string;
  updated: string;
}
```

#### List Recurring Ticket Templates

**Endpoint**: `GET /api/v1/client/organisation/tickets/recurring/`

**Authentication**: Required

**Permissions**: Requires `view_tickets` permission

**Query Parameters**:
- `is_active` - Filter by active status (`true`/`false`)
- `recurrence_pattern` - Filter by pattern (`daily`, `weekly`, `monthly`, `yearly`, `custom`)

**Example Request**:
```typescript
// Get all active templates
const response = await apiClient.get('/client/organisation/tickets/recurring/', {
  params: { is_active: 'true' }
});
```

#### Create Recurring Ticket Template

**Endpoint**: `POST /api/v1/client/organisation/tickets/recurring/`

**Authentication**: Required

**Permissions**: Requires `create_tickets` permission

**Request Body**:
```json
{
  "subject": "Daily Standup - {date}",
  "description": "Daily team standup meeting for {date}",
  "priority": "medium",
  "category_id": 2,
  "project_id": 3,
  "assigned_to_id": 6,
  "recurrence_pattern": "daily",
  "recurrence_config": {
    "interval": 1
  },
  "start_date": "2024-01-15",
  "end_date": "2024-12-31",
  "max_occurrences": 365
}
```

**Recurrence Config Examples**:

**Daily** (every N days):
```json
{ "recurrence_pattern": "daily", "recurrence_config": { "interval": 1 } }
```

**Weekly** (specific days of week):
```json
{ "recurrence_pattern": "weekly", "recurrence_config": { "days_of_week": [0, 2, 4], "interval": 1 } }
```

**Monthly** (specific day of month):
```json
{ "recurrence_pattern": "monthly", "recurrence_config": { "day_of_month": 15, "interval": 1 } }
```

**Yearly** (specific month and day):
```json
{ "recurrence_pattern": "yearly", "recurrence_config": { "month": 1, "day_of_month": 15 } }
```

#### Get Template Details

**Endpoint**: `GET /api/v1/client/organisation/tickets/recurring/{id}/`

**Authentication**: Required

**Permissions**: Requires `view_tickets` permission

#### Update Template

**Endpoint**: `PATCH /api/v1/client/organisation/tickets/recurring/{id}/` or `PUT /api/v1/client/organisation/tickets/recurring/{id}/`

**Authentication**: Required

**Permissions**: Requires `update_tickets` permission

#### Delete Template

**Endpoint**: `DELETE /api/v1/client/organisation/tickets/recurring/{id}/`

**Authentication**: Required

**Permissions**: Requires `delete_tickets` permission

#### Pause Template

**Endpoint**: `POST /api/v1/client/organisation/tickets/recurring/{id}/pause`

**Authentication**: Required

**Permissions**: Requires `update_tickets` permission

#### Resume Template

**Endpoint**: `POST /api/v1/client/organisation/tickets/recurring/{id}/resume`

**Authentication**: Required

**Permissions**: Requires `update_tickets` permission

#### Get Ticket Instances

**Endpoint**: `GET /api/v1/client/organisation/tickets/recurring/{id}/instances/`

**Authentication**: Required

**Permissions**: Requires `view_tickets` permission

**Description**: Get all ticket instances generated from this template.

**Notes**:
- Tickets generated from templates have `recurring_template` and `occurrence_date` fields set
- When a recurring ticket is closed, it automatically creates a timesheet (existing functionality)
- The management command `generate_recurring_tickets` should be run daily (via cron) to generate tickets

---

### Attendance Management (Clock In/Out)

The Attendance API provides endpoints for employees to clock in and out, and for managers/HR to view attendance records. The system tracks daily attendance records with clock in and clock out times, location data, and device information.

**Key Features:**
- Employees can clock themselves in/out
- One attendance record per employee per day (reduces database records)
- Automatic validation to prevent duplicate clock ins/outs
- Location tracking for both clock in and clock out (optional latitude/longitude)
- IP address and device information logging for both actions
- Permission-based access control
- Current clock status checking
- Automatic hours calculation

#### TypeScript Interfaces

```typescript
interface AttendanceRecord {
  id: number;
  employee: EmployeeProfileNested;
  organisation: number;
  date: string;  // Date (YYYY-MM-DD)
  clock_in_time?: string;  // ISO datetime
  clock_out_time?: string;  // ISO datetime
  clock_in_location?: string;
  clock_out_location?: string;
  clock_in_latitude?: number;
  clock_in_longitude?: number;
  clock_out_latitude?: number;
  clock_out_longitude?: number;
  notes?: string;
  clock_in_ip_address?: string;
  clock_out_ip_address?: string;
  clock_in_device_info?: string;
  clock_out_device_info?: string;
  hours_worked?: number;  // Calculated from clock_in_time and clock_out_time
  is_clocked_in: boolean;  // true if clocked in but not out
  is_present: boolean;  // true if has clock_in_time
  created: string;
  updated: string;
}

interface AttendanceRecordList {
  id: number;
  employee: number;
  employee_name: string;
  employee_email: string;
  employee_position: string;
  date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  clock_in_location?: string;
  clock_out_location?: string;
  hours_worked?: number;
  is_clocked_in: boolean;
  is_present: boolean;
  created: string;
}

interface ClockStatus {
  is_clocked_in: boolean;
  date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  record_id?: number;
  hours_worked?: number;
}

interface ClockInOutRequest {
  location?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  clocked_at?: string;  // Optional custom timestamp (defaults to now)
  date?: string;  // Optional date for clock in (defaults to today, only used for clock_in)
}
```

#### Get Your Own Attendance Records

**Endpoint**: `GET /api/v1/client/organisation/attendance/me`

**Authentication**: Required

**Permissions**: All employees can access this endpoint to view their own attendance

**Description**: Returns attendance records for the logged-in user only. This is the primary endpoint for employees to view their own attendance history with date filtering.

**Query Parameters**:
- `date_from` - Filter records from this date (ISO format, YYYY-MM-DD)
- `date_to` - Filter records up to this date (ISO format, YYYY-MM-DD)
- `present_only` - Filter to only show records where you clocked in (`true`/`false`)
- `incomplete_only` - Filter to only show records where you clocked in but not out (`true`/`false`)

**Example Request**:
```typescript
// Get your own attendance records
const response = await apiClient.get('/client/organisation/attendance/me');

// Get your attendance for a date range
const response = await apiClient.get(
  '/client/organisation/attendance/me?date_from=2024-01-01&date_to=2024-01-31'
);

// Get only incomplete records (clocked in but not out)
const response = await apiClient.get('/client/organisation/attendance/me?incomplete_only=true');
```

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 10,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "employee": 3,
      "employee_name": "John Doe",
      "employee_email": "john@example.com",
      "employee_position": "Software Engineer",
      "date": "2024-01-15",
      "clock_in_time": "2024-01-15T09:00:00Z",
      "clock_out_time": "2024-01-15T17:30:00Z",
      "clock_in_location": "Office Building A",
      "clock_out_location": "Office Building A",
      "hours_worked": 8.5,
      "is_clocked_in": false,
      "is_present": true,
      "created": "2024-01-15T09:00:00Z"
    }
  ],
  "summary": {
    "total_records": 42,
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-01-31",
      "days": 31
    },
    "personal_attendance_rate": 93.5,
    "personal_average_hours": 7.8,
    "personal_total_hours": 241.8,
    "personal_on_time_percentage": 85.7,
    "days_worked": 29,
    "days_missed": 2,
    "on_time_count": 24,
    "late_count": 4
  }
}
```

**Summary Fields** (Personal):
- `total_records` - Total number of attendance records for you
- `date_range` - The date range used for calculations (`from`, `to`, `days`)
- `personal_attendance_rate` - Percentage of days you clocked in
- `personal_average_hours` - Average hours worked per day
- `personal_total_hours` - Total hours worked in the date range
- `personal_on_time_percentage` - Percentage of on-time clock-ins (before 9:30 AM)
- `days_worked` - Number of days you clocked in
- `days_missed` - Number of days you did not clock in
- `on_time_count` - Number of times clocked in on time
- `late_count` - Number of times clocked in late

#### List All Attendance Records

**Endpoint**: `GET /api/v1/client/organisation/attendance/`

**Authentication**: Required

**Permissions**: Requires `view_attendance` permission to access this endpoint

**Description**: Returns attendance records for all employees in the organization. This endpoint is only accessible to users with the `view_attendance` permission (typically HR, managers, etc.). For personal attendance, use the `/me` endpoint instead.

**Query Parameters**:
- `employee` - Filter by employee ID
- `date_from` - Filter records from this date (ISO format, YYYY-MM-DD)
- `date_to` - Filter records up to this date (ISO format, YYYY-MM-DD)
- `present_only` - Filter to only show records where employee clocked in (`true`/`false`)
- `incomplete_only` - Filter to only show records where employee clocked in but not out (`true`/`false`)

**Example Request**:
```typescript
// Get all attendance records
const response = await apiClient.get('/client/organisation/attendance/');

// Get records for specific employee
const response = await apiClient.get('/client/organisation/attendance/?employee=5');

// Get records for a date range
const response = await apiClient.get(
  '/client/organisation/attendance/?date_from=2024-01-01&date_to=2024-01-31'
);

// Get only incomplete records (clocked in but not out)
const response = await apiClient.get('/client/organisation/attendance/?incomplete_only=true');
```

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 10,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "employee": 3,
      "employee_name": "John Doe",
      "employee_email": "john@example.com",
      "employee_position": "Software Engineer",
      "date": "2024-01-15",
      "clock_in_time": "2024-01-15T09:00:00Z",
      "clock_out_time": "2024-01-15T17:30:00Z",
      "clock_in_location": "Office Building A",
      "clock_out_location": "Office Building A",
      "hours_worked": 8.5,
      "is_clocked_in": false,
      "is_present": true,
      "created": "2024-01-15T09:00:00Z"
    },
    {
      "id": 2,
      "employee": 3,
      "employee_name": "John Doe",
      "employee_email": "john@example.com",
      "employee_position": "Software Engineer",
      "date": "2024-01-16",
      "clock_in_time": "2024-01-16T09:00:00Z",
      "clock_out_time": null,
      "clock_in_location": "Office Building A",
      "clock_out_location": null,
      "hours_worked": null,
      "is_clocked_in": true,
      "is_present": true,
      "created": "2024-01-16T09:00:00Z"
    }
  ],
  "summary": {
    // Summary content varies based on user permissions
    // See "Summary Field" section below for details
  }
}
```

**Summary Field**:

The `summary` field is automatically included in the response and provides organization-wide attendance statistics (since this endpoint requires `view_attendance` permission):

**Organization-wide summary**:
```json
{
  "summary": {
    "total_records": 150,
    "total_employees": 25,
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-01-31",
      "days": 31
    },
    "average_hours_per_day": 7.5,
    "total_hours_worked": 5812.5,
    "attendance_rate": 95.5,
    "on_time_percentage": 87.3,
    "most_punctual_employees": [
      {
        "employee_id": 5,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "punctuality_score": 98.5,
        "on_time_count": 20,
        "total_count": 21
      }
    ],
    "least_punctual_employees": [
      {
        "employee_id": 8,
        "name": "John Doe",
        "email": "john@example.com",
        "punctuality_score": 65.2,
        "on_time_count": 15,
        "total_count": 23
      }
    ]
  }
}
```

**Summary Fields Explanation**:

**Organization-wide summary** (for `/` endpoint - requires `view_attendance` permission):
- `total_records` - Total number of attendance records in the date range
- `total_employees` - Number of unique employees with attendance records
- `date_range` - The date range used for calculations (`from`, `to`, `days`)
- `average_hours_per_day` - Average hours worked per employee per day
- `total_hours_worked` - Total hours worked by all employees
- `attendance_rate` - Percentage of employees who clocked in at least once
- `on_time_percentage` - Overall percentage of on-time clock-ins (before 9:30 AM)
- `most_punctual_employees` - Top 5 most punctual employees with their scores
- `least_punctual_employees` - Bottom 5 least punctual employees with their scores

**Notes**:
- The `/me` endpoint is for personal attendance and is accessible to all employees
- The `/` endpoint is for viewing all attendance and requires `view_attendance` permission
- The summary is calculated based on the filtered queryset (respects `date_from`, `date_to`, `employee`, `present_only`, and `incomplete_only` filters)
- If no date filters are provided, the summary defaults to the last 30 days
- Punctuality is determined by clocking in before 9:30 AM (9:00 AM expected time + 30 minute grace period)
- Hours worked are calculated from `clock_in_time` and `clock_out_time` in the same record
- Each attendance record represents one day's attendance (one record per employee per day)

#### Get Attendance Record Details

**Endpoint**: `GET /api/v1/client/organisation/attendance/{id}`

**Authentication**: Required

**Permissions**: Same as list endpoint

**Response**:
```json
{
  "id": 1,
  "employee": {
    "id": 3,
    "account": {
      "id": 3,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "phone_number": "+1234567890"
    },
    "position": "Software Engineer",
    "department": "Engineering"
  },
  "organisation": 1,
  "date": "2024-01-15",
  "clock_in_time": "2024-01-15T09:00:00Z",
  "clock_out_time": "2024-01-15T17:30:00Z",
  "clock_in_location": "Office Building A",
  "clock_out_location": "Office Building A",
  "clock_in_latitude": 40.7128,
  "clock_in_longitude": -74.0060,
  "clock_out_latitude": 40.7128,
  "clock_out_longitude": -74.0060,
  "notes": "Working from office",
  "clock_in_ip_address": "192.168.1.1",
  "clock_out_ip_address": "192.168.1.1",
  "clock_in_device_info": "Mozilla/5.0...",
  "clock_out_device_info": "Mozilla/5.0...",
  "hours_worked": 8.5,
  "is_clocked_in": false,
  "is_present": true,
  "created": "2024-01-15T09:00:00Z",
  "updated": "2024-01-15T17:30:00Z"
}
```

#### Clock In

**Endpoint**: `POST /api/v1/client/organisation/attendance/clock_in`

**Authentication**: Required

**Permissions**: User must be an employee of the organisation

**Description**: Clock in for the current authenticated user. Creates or updates today's attendance record with clock in time. Validates that the user is not already clocked in for today.

**Request Body** (all fields optional):
```json
{
  "location": "Office Building A",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "notes": "Starting work",
  "clocked_at": "2024-01-15T09:00:00Z"  // Optional, defaults to current time
}
```

**Example Request**:
```typescript
// Basic clock in
const response = await apiClient.post('/client/organisation/attendance/clock_in', {});

// Clock in with location
const response = await apiClient.post('/client/organisation/attendance/clock_in', {
  location: 'Office Building A',
  latitude: 40.7128,
  longitude: -74.0060,
  notes: 'Starting work'
});
```

**Response**: Returns the created attendance record (same format as Get Attendance Record Details)

**Error Responses**:
- `400 Bad Request` - User is already clocked in for today (has clock_in_time but no clock_out_time)
- `400 Bad Request` - User must be an employee of the organisation

**Note**: If a record for today already exists (e.g., from a previous clock in that was clocked out), the clock_in_time will be updated. If the user is currently clocked in (has clock_in_time but no clock_out_time), the request will be rejected.

#### Clock Out

**Endpoint**: `POST /api/v1/client/organisation/attendance/clock_out`

**Authentication**: Required

**Permissions**: User must be an employee of the organisation

**Description**: Clock out for the current authenticated user. Validates that the user is currently clocked in.

**Request Body** (all fields optional):
```json
{
  "location": "Office Building A",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "notes": "Ending work",
  "clocked_at": "2024-01-15T17:30:00Z"  // Optional, defaults to current time
}
```

**Example Request**:
```typescript
// Basic clock out
const response = await apiClient.post('/client/organisation/attendance/clock_out', {});

// Clock out with location
const response = await apiClient.post('/client/organisation/attendance/clock_out', {
  location: 'Office Building A',
  latitude: 40.7128,
  longitude: -74.0060,
  notes: 'Ending work'
});
```

**Response**: Returns the created attendance record (same format as Get Attendance Record Details)

**Error Responses**:
- `400 Bad Request` - User must clock in first before clocking out (no clock_in_time for today)
- `400 Bad Request` - User is already clocked out for today (has clock_out_time)
- `400 Bad Request` - Clock out time must be after clock in time

**Note**: The clock out action updates today's attendance record. If no record exists for today, the request will be rejected (user must clock in first).

#### Get Current Clock Status

**Endpoint**: `GET /api/v1/client/organisation/attendance/status`

**Authentication**: Required

**Permissions**: User must be an employee of the organisation

**Description**: Get the current clock status for the authenticated user. Returns whether the user is currently clocked in or out, along with the last action.

**Example Request**:
```typescript
const response = await apiClient.get('/client/organisation/attendance/status');
```

**Response**:
```json
{
  "is_clocked_in": true,
  "date": "2024-01-15",
  "clock_in_time": "2024-01-15T09:00:00Z",
  "clock_out_time": null,
  "record_id": 1,
  "hours_worked": null
}
```

**Response Fields**:
- `is_clocked_in` - Boolean indicating if user is currently clocked in (has clock_in_time but no clock_out_time for today)
- `date` - Today's date
- `clock_in_time` - Timestamp when user clocked in today (null if not clocked in)
- `clock_out_time` - Timestamp when user clocked out today (null if not clocked out)
- `record_id` - ID of today's attendance record (null if no record exists)
- `hours_worked` - Hours worked today (null if not clocked out yet)

#### Get Calendar Events

**Endpoint**: `GET /api/v1/client/organisation/attendance/calendar`

**Authentication**: Required

**Permissions**: User must be an employee of the organisation

**Description**: Get calendar events combining holidays, attendance records, timesheets, and approved leave requests. 
- **Holidays**: All organization holidays (visible to everyone)
- **Attendance**: Logged-in user's attendance records only
- **Timesheets**: Logged-in user's timesheets only  
- **Leave requests**: All approved leave requests (everyone can see who is on leave)

Returns events for the specified date range (defaults to current year). This endpoint is useful for displaying a unified calendar view of all work-related events.

**Query Parameters**:
- `year` - Year to get events for (defaults to current year). Example: `2024`

**Example Request**:
```typescript
// Get calendar events for current year
const response = await apiClient.get('/client/organisation/attendance/calendar');

// Get calendar events for a specific year
const response = await apiClient.get('/client/organisation/attendance/calendar?year=2024');
```

**Response**:
```json
[
  {
    "id": "holiday_1",
    "title": "New Year's Day",
    "start_date": "2024-01-01",
    "end_date": "2024-01-01",
    "type": "holiday",
    "color": "#FF6B6B",
    "description": "New Year's Day celebration",
    "holiday_type": "public"
  },
  {
    "id": "attendance_5",
    "title": "Attendance: Jan 15 (8.5h)",
    "start_date": "2024-01-15",
    "end_date": "2024-01-15",
    "type": "attendance",
    "color": "#4ECDC4",
    "clock_in_time": "2024-01-15T09:00:00Z",
    "clock_out_time": "2024-01-15T17:30:00Z",
    "hours_worked": 8.5,
    "is_complete": true
  },
  {
    "id": "attendance_6",
    "title": "Attendance: Jan 16 (Incomplete)",
    "start_date": "2024-01-16",
    "end_date": "2024-01-16",
    "type": "attendance",
    "color": "#FFC107",
    "clock_in_time": "2024-01-16T09:00:00Z",
    "clock_out_time": null,
    "hours_worked": null,
    "is_complete": false
  },
  {
    "id": "timesheet_10",
    "title": "Ticket TKT-001: Fixed login bug",
    "start_date": "2024-01-15",
    "end_date": "2024-01-15",
    "type": "timesheet",
    "color": "#9B59B6",
    "hours_spent": 3.5,
    "task_description": "Fixed login bug in authentication module",
    "ticket_number": "TKT-001",
    "project_name": "Website Redesign",
    "is_auto_created": true
  },
  {
    "id": "leave_1",
    "title": "John Doe - Vacation",
    "start_date": "2024-02-15",
    "end_date": "2024-02-20",
    "type": "leave",
    "color": "#4ECDC4",
    "employee_id": 3,
    "employee_name": "John Doe",
    "leave_type": "vacation",
    "leave_type_display": "Vacation",
    "duration_days": 6
  }
]
```

**Response Fields**:

**Common Fields** (all event types):
- `id` - Unique identifier for the event (format: `{type}_{id}`)
- `title` - Display title for the event
- `start_date` - Start date of the event (YYYY-MM-DD)
- `end_date` - End date of the event (YYYY-MM-DD)
- `type` - Type of event: `"holiday"`, `"attendance"`, `"timesheet"`, or `"leave"`
- `color` - Hex color code for calendar display

**Holiday Events** (`type: "holiday"`):
- `description` - Description of the holiday
- `holiday_type` - Type of holiday (e.g., `"public"`, `"regional"`)

**Attendance Events** (`type: "attendance"`):
- `clock_in_time` - ISO timestamp when user clocked in (null if not clocked in)
- `clock_out_time` - ISO timestamp when user clocked out (null if not clocked out)
- `hours_worked` - Number of hours worked (null if not clocked out)
- `is_complete` - Boolean indicating if attendance is complete (has both clock_in and clock_out)

**Timesheet Events** (`type: "timesheet"`):
- `hours_spent` - Number of hours spent on the task
- `task_description` - Description of the task/work performed
- `ticket_number` - Ticket number if linked to a ticket (null otherwise)
- `project_name` - Project name if linked to a project (null otherwise)
- `is_auto_created` - Boolean indicating if timesheet was auto-created from a ticket

**Leave Events** (`type: "leave"`):
- `employee_id` - ID of the employee on leave
- `employee_name` - Name of the employee on leave
- `leave_type` - Type of leave (e.g., `"vacation"`, `"sick"`, `"personal"`)
- `leave_type_display` - Human-readable leave type (e.g., `"Vacation"`, `"Sick Leave"`)
- `duration_days` - Number of days the leave spans (inclusive of start and end dates)
- `title` - Display title showing employee name and leave type (e.g., `"John Doe - Vacation"`)

**Color Coding**:
- **Holidays**: `#FF6B6B` (Red) - Organization holidays
- **Attendance (Complete)**: `#4ECDC4` (Teal) - Days with complete clock in/out
- **Attendance (Incomplete)**: `#FFC107` (Yellow) - Days with clock in but no clock out
- **Timesheets**: `#9B59B6` (Purple) - Timesheet entries
- **Leave Requests**: `#4ECDC4` (Teal) - Approved leave requests (can span multiple days)

**Notes**:
- Events are sorted by `start_date` in ascending order
- Only attendance records with `clock_in_time` are included (days without clock-in are not shown)
- Only **approved** leave requests are included in the calendar
- **Attendance and timesheets** are filtered to the logged-in user only
- **Leave requests** show all approved leaves for the organization (everyone can see who is on leave)
- Date range defaults to the current year if `year` parameter is not provided
- Multiple events can occur on the same date (e.g., attendance + timesheet + leave on the same day)
- Leave events can span multiple days (from `start_date` to `end_date`, inclusive)

**Example: Frontend Clock In/Out Component**

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface ClockStatus {
  is_clocked_in: boolean;
  last_action: 'clock_in' | 'clock_out' | null;
  last_clocked_at: string | null;
  last_record_id: number | null;
}

export function ClockInOutButton() {
  const [status, setStatus] = useState<ClockStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await apiClient.get('/client/organisation/attendance/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch clock status:', error);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      // Get user's current location (optional)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const response = await apiClient.post('/client/organisation/attendance/clock_in', {
        location: 'Office',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        notes: 'Starting work'
      });

      await fetchStatus(); // Refresh status
      alert('Clocked in successfully!');
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert(error.response.data.error || 'Failed to clock in');
      } else {
        alert('Failed to clock in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const response = await apiClient.post('/client/organisation/attendance/clock_out', {
        location: 'Office',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        notes: 'Ending work'
      });

      await fetchStatus(); // Refresh status
      alert('Clocked out successfully!');
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert(error.response.data.error || 'Failed to clock out');
      } else {
        alert('Failed to clock out');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return <div>Loading...</div>;
  }

  return (
    <div className="clock-in-out">
      <div className="status">
        <p>Status: {status.is_clocked_in ? '🟢 Clocked In' : '🔴 Clocked Out'}</p>
        {status.last_clocked_at && (
          <p>Last action: {new Date(status.last_clocked_at).toLocaleString()}</p>
        )}
      </div>
      
      {status.is_clocked_in ? (
        <button onClick={handleClockOut} disabled={loading}>
          {loading ? 'Processing...' : 'Clock Out'}
        </button>
      ) : (
        <button onClick={handleClockIn} disabled={loading}>
          {loading ? 'Processing...' : 'Clock In'}
        </button>
      )}
    </div>
  );
}
```

**Important Notes**:
- All attendance endpoints automatically filter by the current organization (from subdomain)
- The `organisation` and `employee` fields are automatically set - don't include them in requests
- Clock in/out actions are validated to prevent duplicate actions
- Location tracking is optional but recommended for accurate attendance records
- IP address and device information are automatically captured
- Users can only clock themselves in/out (not other employees)
- Managers/HR with `view_attendance` permission can view all attendance records
- All clock actions are logged in the audit trail
- The system prevents clocking out if not clocked in, and vice versa

---

### Leave Management

The Leave Management API provides endpoints for employees to request time off and for HR/managers to approve or reject those requests. The system also manages organization-wide holidays and provides a calendar endpoint that combines holidays and approved leave requests for easy calendar visualization.

**Key Features:**
- Employees can create leave requests for multiple days
- Leave requests require HR approval before being active
- Support for various leave types (sick, vacation, personal, etc.)
- Organization-wide holiday management
- Combined calendar endpoint for holidays and approved leaves
- Permission-based access control

#### TypeScript Interfaces

```typescript
interface LeaveRequest {
  id: number;
  employee: EmployeeProfileNested;
  organisation: number;
  leave_type: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'unpaid' | 'other';
  leave_type_display: string;
  start_date: string;  // ISO date
  end_date: string;  // ISO date
  duration_days: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  status_display: string;
  reason?: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;  // ISO datetime
  rejection_reason?: string;
  created: string;
  updated: string;
}

interface LeaveRequestList {
  id: number;
  employee: number;
  employee_name: string;
  employee_email: string;
  employee_position: string;
  leave_type: string;
  leave_type_display: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: string;
  status_display: string;
  reason?: string;
  approved_at?: string;
  created: string;
}

interface Holiday {
  id: number;
  organisation: number;
  name: string;
  date: string;  // ISO date
  holiday_type: 'national' | 'company' | 'regional';
  holiday_type_display: string;
  description?: string;
  is_recurring: boolean;
  created_by?: number;
  created_by_name?: string;
  created: string;
  updated: string;
}

interface CalendarEvent {
  id: string;  // 'holiday_{id}' or 'leave_{id}'
  title: string;
  start_date: string;  // ISO date
  end_date: string;  // ISO date
  type: 'holiday' | 'leave';
  color: string;  // Color for calendar display
  employee_id?: number;
  employee_name?: string;
  leave_type?: string;
}
```

#### List Leave Requests

**Endpoint**: `GET /api/v1/client/organisation/leave/requests/`

**Authentication**: Required

**Permissions**: 
- **HR and Super Admin** (with `manage_leave_requests` permission): Can see all leave requests
- **All other users**: Can only see their own leave requests

**Query Parameters**:
- `employee` - Filter by employee ID
- `status` - Filter by status (`pending`, `approved`, `rejected`, `cancelled`)
- `leave_type` - Filter by leave type
- `date_from` - Filter requests ending on or after this date
- `date_to` - Filter requests starting on or before this date

**Example Request**:
```typescript
// Get all leave requests
const response = await apiClient.get('/client/organisation/leave/requests/');

// Get pending requests
const response = await apiClient.get('/client/organisation/leave/requests/?status=pending');

// Get requests for specific employee
const response = await apiClient.get('/client/organisation/leave/requests/?employee=5');
```

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 10,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "employee": 3,
      "employee_name": "John Doe",
      "employee_email": "john@example.com",
      "employee_position": "Software Engineer",
      "leave_type": "vacation",
      "leave_type_display": "Vacation",
      "start_date": "2024-02-15",
      "end_date": "2024-02-20",
      "duration_days": 6,
      "status": "pending",
      "status_display": "Pending",
      "reason": "Family vacation",
      "created": "2024-01-15T10:00:00Z"
    }
  ],
  "summary": {
    // Summary content varies based on user permissions
    // See "Summary Field" section below for details
  }
}
```

**Summary Field**:

The `summary` field is automatically included in the response and provides leave request statistics. The content depends on the user's permissions:

**For HR and Super Admin (with `manage_leave_requests` permission - Organization-wide summary)**:
```json
{
  "summary": {
    "total_requests": 45,
    "total_employees": 20,
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-12-31",
      "days": 366
    },
    "status_breakdown": {
      "pending": {
        "count": 5,
        "label": "Pending"
      },
      "approved": {
        "count": 30,
        "label": "Approved"
      },
      "rejected": {
        "count": 5,
        "label": "Rejected"
      },
      "cancelled": {
        "count": 5,
        "label": "Cancelled"
      }
    },
    "leave_type_breakdown": {
      "vacation": {
        "count": 20,
        "label": "Vacation"
      },
      "sick": {
        "count": 10,
        "label": "Sick Leave"
      },
      "personal": {
        "count": 15,
        "label": "Personal"
      }
    },
    "total_days_requested": 180,
    "total_days_approved": 150,
    "average_days_per_request": 4.0,
    "approval_rate": 85.7,
    "most_leave_takers": [
      {
        "employee_id": 5,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "total_days": 25,
        "request_count": 5
      }
    ],
    "least_leave_takers": [
      {
        "employee_id": 8,
        "name": "John Doe",
        "email": "john@example.com",
        "total_days": 3,
        "request_count": 1
      }
    ]
  }
}
```

**For all other users (Personal summary - only their own leaves)**:
```json
{
  "summary": {
    "total_requests": 5,
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-12-31",
      "days": 366
    },
    "status_breakdown": {
      "pending": {
        "count": 1,
        "label": "Pending"
      },
      "approved": {
        "count": 3,
        "label": "Approved"
      },
      "rejected": {
        "count": 0,
        "label": "Rejected"
      },
      "cancelled": {
        "count": 1,
        "label": "Cancelled"
      }
    },
    "leave_type_breakdown": {
      "vacation": {
        "count": 3,
        "label": "Vacation"
      },
      "sick": {
        "count": 1,
        "label": "Sick Leave"
      },
      "personal": {
        "count": 1,
        "label": "Personal"
      }
    },
    "personal_total_days_requested": 20,
    "personal_total_days_approved": 15,
    "personal_average_days_per_request": 4.0,
    "personal_approval_rate": 100.0,
    "personal_pending_count": 1,
    "personal_approved_count": 3,
    "personal_rejected_count": 0,
    "personal_cancelled_count": 1
  }
}
```

**Summary Fields Explanation**:

**Organization-wide summary** (HR/Super Admin):
- `total_requests` - Total number of leave requests in the date range
- `total_employees` - Number of unique employees with leave requests
- `date_range` - The date range used for calculations (`from`, `to`, `days`)
- `status_breakdown` - Breakdown of requests by status (pending, approved, rejected, cancelled)
- `leave_type_breakdown` - Breakdown of requests by leave type
- `total_days_requested` - Total days requested across all requests
- `total_days_approved` - Total days approved
- `average_days_per_request` - Average days per request
- `approval_rate` - Percentage of approved requests (approved / (approved + rejected))
- `most_leave_takers` - Top 5 employees by approved leave days
- `least_leave_takers` - Bottom 5 employees by approved leave days

**Personal summary** (All other users):
- `total_requests` - Total number of user's leave requests
- `date_range` - The date range used for calculations
- `status_breakdown` - Breakdown of user's requests by status
- `leave_type_breakdown` - Breakdown of user's requests by leave type
- `personal_total_days_requested` - Total days requested by the user
- `personal_total_days_approved` - Total days approved for the user
- `personal_average_days_per_request` - Average days per user's request
- `personal_approval_rate` - User's approval rate
- `personal_pending_count` - Count of pending requests
- `personal_approved_count` - Count of approved requests
- `personal_rejected_count` - Count of rejected requests
- `personal_cancelled_count` - Count of cancelled requests

**Notes**:
- The summary is calculated based on the filtered queryset (respects `date_from`, `date_to`, `employee`, `status`, and `leave_type` filters)
- If no date filters are provided, the summary defaults to the current year
- Only HR and Super Admin can see organization-wide summaries; all other users see only their personal summaries
- The summary automatically adapts based on user permissions and visibility rules

**Notes**:
- The summary is calculated based on the filtered queryset (respects `date_from`, `date_to`, `employee`, `status`, and `leave_type` filters)
- If no date filters are provided, the summary defaults to the current year (January 1 to today)
- Leave requests that overlap with the date range are included in calculations
- Approval rate is calculated as: `approved / (approved + rejected) * 100`
- The summary automatically adapts based on the user's permissions

#### Create Leave Request

**Endpoint**: `POST /api/v1/client/organisation/leave/requests/`

**Authentication**: Required

**Permissions**: User must be an employee of the organisation

**Description**: Create a new leave request. The request will be in `pending` status and require approval.

**Request Body**:
```json
{
  "leave_type": "vacation",
  "start_date": "2024-02-15",
  "end_date": "2024-02-20",
  "reason": "Family vacation"
}
```

**Example Request**:
```typescript
const response = await apiClient.post('/client/organisation/leave/requests/', {
  leave_type: 'vacation',
  start_date: '2024-02-15',
  end_date: '2024-02-20',
  reason: 'Family vacation'
});
```

**Response**: Returns the created leave request (same format as Get Leave Request Details)

**Error Responses**:
- `400 Bad Request` - End date must be after or equal to start date
- `400 Bad Request` - Start date cannot be in the past

#### Get Leave Request Details

**Endpoint**: `GET /api/v1/client/organisation/leave/requests/{id}`

**Authentication**: Required

**Permissions**: Same as list endpoint

**Response**:
```json
{
  "id": 1,
  "employee": {
    "id": 3,
    "account": {
      "id": 3,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe"
    },
    "position": "Software Engineer",
    "department": "Engineering"
  },
  "organisation": 1,
  "leave_type": "vacation",
  "leave_type_display": "Vacation",
  "start_date": "2024-02-15",
  "end_date": "2024-02-20",
  "duration_days": 6,
  "status": "approved",
  "status_display": "Approved",
  "reason": "Family vacation",
  "approved_by": 5,
  "approved_by_name": "Jane Smith",
  "approved_at": "2024-01-16T09:00:00Z",
  "rejection_reason": null,
  "created": "2024-01-15T10:00:00Z",
  "updated": "2024-01-16T09:00:00Z"
}
```

#### Approve Leave Request

**Endpoint**: `POST /api/v1/client/organisation/leave/requests/{id}/approve`

**Authentication**: Required

**Permissions**: Requires `manage_leave_requests` or `approve_leave_requests` permission

**Description**: Approve a pending leave request. Only pending requests can be approved.

**Example Request**:
```typescript
const response = await apiClient.post('/client/organisation/leave/requests/1/approve');
```

**Response**: Returns the updated leave request with `status: "approved"`

**Error Responses**:
- `403 Forbidden` - User does not have permission to approve leave requests
- `400 Bad Request` - Leave request is already approved/rejected

#### Reject Leave Request

**Endpoint**: `POST /api/v1/client/organisation/leave/requests/{id}/reject`

**Authentication**: Required

**Permissions**: Requires `manage_leave_requests` or `approve_leave_requests` permission

**Description**: Reject a pending leave request. Only pending requests can be rejected.

**Request Body** (optional):
```json
{
  "rejection_reason": "Insufficient leave balance"
}
```

**Example Request**:
```typescript
const response = await apiClient.post('/client/organisation/leave/requests/1/reject', {
  rejection_reason: 'Insufficient leave balance'
});
```

**Response**: Returns the updated leave request with `status: "rejected"`

**Error Responses**:
- `403 Forbidden` - User does not have permission to reject leave requests
- `400 Bad Request` - Leave request is already approved/rejected

#### Cancel Leave Request

**Endpoint**: `POST /api/v1/client/organisation/leave/requests/{id}/cancel`

**Authentication**: Required

**Permissions**: User must be the employee who created the request

**Description**: Cancel a leave request. Only the employee who created it can cancel it. Can cancel pending or approved requests as long as the end_date has not passed. This allows cancellation of partially taken leaves (where the leave has started but not yet ended).

**Example Request**:
```typescript
const response = await apiClient.post('/client/organisation/leave/requests/1/cancel');
```

**Response**: Returns the updated leave request with `status: "cancelled"`

**Error Responses**:
- `403 Forbidden` - User can only cancel their own leave requests
- `400 Bad Request` - Cannot cancel a leave request that has been rejected
- `400 Bad Request` - Cannot cancel a leave request that is already cancelled
- `400 Bad Request` - Cannot cancel a leave request that has already ended (end_date is in the past)

**Notes**:
- Leaves can be cancelled as long as `end_date >= today`, even if the leave has already started (partially taken)
- Example: If leave is Jan 1-10 and today is Jan 5, it can still be cancelled because end_date (Jan 10) hasn't passed
- Once the end_date has passed, the leave cannot be cancelled

#### List Holidays

**Endpoint**: `GET /api/v1/client/organisation/leave/holidays/`

**Authentication**: Required

**Permissions**: All employees can view holidays

**Query Parameters**:
- `date_from` - Filter holidays from this date
- `date_to` - Filter holidays up to this date
- `type` - Filter by holiday type (`national`, `company`, `regional`, `international`)
- `country_code` - Filter by ISO 3166-1 alpha-2 country code (e.g. `GH`, `US`) for national holidays (international holidays have no country_code)

**Example Request**:
```typescript
// Get all holidays
const response = await apiClient.get('/client/organisation/leave/holidays/');

// Get holidays for current year
const year = new Date().getFullYear();
const response = await apiClient.get(
  `/client/organisation/leave/holidays/?date_from=${year}-01-01&date_to=${year}-12-31`
);
```

**Response**:
```json
[
  {
    "id": 1,
    "organisation": 1,
    "name": "New Year's Day",
    "date": "2024-01-01",
    "holiday_type": "national",
    "holiday_type_display": "National Holiday",
    "country_code": "GH",
    "description": "New Year celebration",
    "is_recurring": true,
    "created_by": 5,
    "created_by_name": "Jane Smith",
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-01-01T00:00:00Z"
  }
]
```

**Note**: Holidays are **automatically generated** when you update the organisation's personalisation countries (`PATCH /personalisation/current/` with `countries`). The system generates national holidays for the **current year** based on the countries you operate in. You can then use the management API to remove any holidays you don't want to observe.

#### Create Holiday

**Endpoint**: `POST /api/v1/client/organisation/leave/holidays/`

**Authentication**: Required

**Permissions**: Requires `manage_holidays` permission

**Description**: Create a new organization holiday. Use `holiday_type`: `national`, `company`, `regional`, or `international`. For `international`, leave `country_code` null (holidays that cut across multiple countries, e.g. New Year).

**Request Body**:
```json
{
  "name": "New Year's Day",
  "date": "2024-01-01",
  "holiday_type": "national",
  "description": "New Year celebration",
  "is_recurring": true
}
```

**Example Request**:
```typescript
const response = await apiClient.post('/client/organisation/leave/holidays/', {
  name: "New Year's Day",
  date: '2024-01-01',
  holiday_type: 'national',
  description: 'New Year celebration',
  is_recurring: true
});
```

**Response**: Returns the created holiday

#### Generate Holidays from Countries

**Endpoint**: `POST /api/v1/client/organisation/leave/holidays/generate/`

**Authentication**: Required

**Permissions**: Business owner or `manage_holidays` permission

**Description**: Generate national holidays for the organisation based on the countries configured in personalisation (`OrganisationPersonalisation.countries`). This endpoint is useful for:
- Manually triggering holiday generation (e.g. after updating countries)
- Regenerating holidays for a specific year
- Refreshing holidays after adding new countries

**Request Body** (all fields optional):
```json
{
  "year": 2026,
  "years_ahead": 1,
  "delete_existing_national": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `year` | integer | Year for generation (defaults to current year) |
| `years_ahead` | integer | How many years ahead to generate (default: 0 = current year only) |
| `delete_existing_national` | boolean | If `true`, deletes existing NATIONAL holidays before generating (default: `false`) |

**Example Request**:
```typescript
// Generate holidays for current year only (default)
const response = await apiClient.post('/client/organisation/leave/holidays/generate/');

// Generate holidays for 2026 only
const response = await apiClient.post('/client/organisation/leave/holidays/generate/', {
  year: 2026,
  years_ahead: 0
});

// Regenerate (delete existing NATIONAL holidays first, then generate)
const response = await apiClient.post('/client/organisation/leave/holidays/generate/', {
  delete_existing_national: true
});
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Generated 25 holidays.",
  "created": 25,
  "deleted": 0
}
```

**Note**: 
- Holidays are automatically generated for the **current year** when you update `countries` in personalisation (`PATCH /personalisation/current/`).
- **International**: If a holiday (same date + name) appears in **all** of your countries, one **international** record is created (`holiday_type: "international"`, `country_code: null`).
- **National (individual)**: If a holiday appears in only **some** of your countries (e.g. 2 out of 4), **one national record per country** that has it is created (each with that `country_code`). So you get individual entries per country when it doesn’t apply to all.
- Only generated types are NATIONAL and INTERNATIONAL (COMPANY and REGIONAL are preserved).
- Filter by `?country_code=GH` for national holidays from one country, or `?type=international` for holidays that apply to all your countries.
- To generate for future years, use `year` and `years_ahead` parameters (e.g. `year: 2027, years_ahead: 0`).

#### Get Calendar Events

**Endpoint**: `GET /api/v1/client/organisation/leave/holidays/calendar`

**Authentication**: Required

**Permissions**: All employees can view calendar events

**Description**: Get combined calendar events (holidays + approved leave requests) for easy calendar visualization. This is the main endpoint for plotting events on a calendar.

**Query Parameters**:
- `year` - Year to get events for (defaults to current year)
- `employee` - Filter leave requests by employee ID (optional)

**Example Request**:
```typescript
// Get calendar events for current year
const response = await apiClient.get('/client/organisation/leave/holidays/calendar');

// Get calendar events for specific year
const response = await apiClient.get('/client/organisation/leave/holidays/calendar?year=2024');

// Get calendar events for specific employee
const response = await apiClient.get('/client/organisation/leave/holidays/calendar?employee=5');
```

**Response**:
```json
[
  {
    "id": "holiday_1",
    "title": "New Year's Day",
    "start_date": "2024-01-01",
    "end_date": "2024-01-01",
    "type": "holiday",
    "color": "#FF6B6B",
    "employee_id": null,
    "employee_name": null,
    "leave_type": null
  },
  {
    "id": "leave_1",
    "title": "John Doe - Vacation",
    "start_date": "2024-02-15",
    "end_date": "2024-02-20",
    "type": "leave",
    "color": "#4ECDC4",
    "employee_id": 3,
    "employee_name": "John Doe",
    "leave_type": "vacation"
  }
]
```

**Example: Frontend Calendar Component**

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  type: 'holiday' | 'leave';
  color: string;
  employee_id?: number;
  employee_name?: string;
  leave_type?: string;
}

export function LeaveCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async (year?: number) => {
    setLoading(true);
    try {
      const url = year 
        ? `/client/organisation/leave/holidays/calendar?year=${year}`
        : '/client/organisation/leave/holidays/calendar';
      
      const response = await apiClient.get(url);
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert API events to FullCalendar format
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start_date,
    end: event.end_date,
    backgroundColor: event.color,
    borderColor: event.color,
    extendedProps: {
      type: event.type,
      employee_id: event.employee_id,
      employee_name: event.employee_name,
      leave_type: event.leave_type,
    }
  }));

  return (
    <div className="leave-calendar">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        loading={loading}
        eventContent={(eventInfo) => (
          <div style={{ color: eventInfo.event.backgroundColor }}>
            {eventInfo.event.title}
          </div>
        )}
      />
    </div>
  );
}
```

**Important Notes**:
- All leave endpoints automatically filter by the current organization (from subdomain)
- The `organisation` and `employee` fields are automatically set - don't include them in requests
- Leave requests start in `pending` status and require approval
- Only pending requests can be approved, rejected, or cancelled
- Employees can only cancel their own pending requests
- HR/managers with `manage_leave_requests` or `approve_leave_requests` permission can approve/reject requests
- Holidays are organization-wide and visible to all employees
- The calendar endpoint combines holidays and approved leave requests for easy visualization
- All leave actions are logged in the audit trail
- Leave types include: sick, vacation, personal, maternity, paternity, bereavement, unpaid, other

### Recommended Endpoints (To Be Implemented)

The following endpoints should be implemented in the backend. This documentation provides the expected structure:

#### Knowledge Base Articles

**List Articles**
- `GET /api/v1/articles/`
- Query params: `?visibility=public&category=1&page=1`

**Get Article**
- `GET /api/v1/articles/{id}/`

**Create Article**
- `POST /api/v1/articles/`
- Request body:
```json
{
  "title": "How to reset password",
  "content": "<p>Article content in HTML/Markdown</p>",
  "category": 1,
  "visibility": "public"
}
```

**Update Article**
- `PATCH /api/v1/articles/{id}/`

**Delete Article**
- `DELETE /api/v1/articles/{id}/`

#### Notifications

**List Notifications**
- `GET /api/v1/notifications/`
- Query params: `?read=false&page=1`

**Mark as Read**
- `POST /api/v1/notifications/{id}/mark_read/`

**Mark All as Read**
- `POST /api/v1/notifications/mark_all_read/`

#### Organization

**Get Current Organization**
- `GET /api/v1/organisation/` - Get organization details for current subdomain

**Update Organization**
- `PATCH /api/v1/organisation/`

#### User Profile

**Get Current User**
- `GET /api/v1/profile/` - Get current authenticated user

**Update Profile**
- `PATCH /api/v1/profile/`

**Change Password**
- `POST /api/v1/profile/change_password/`
- Request body: `{ "old_password": "old", "new_password": "new" }`

---

### Timesheet Management

The Timesheet API provides endpoints for employees to track time spent on tasks. Timesheets can be linked to tickets and projects, and are automatically created when tickets are closed or resolved.

**Key Features:**
- Employees can manually create timesheet entries
- Timesheets are automatically created when tickets are closed or resolved
- Timesheets can be linked to tickets and projects
- Track hours spent on tasks
- Filter by employee, ticket, project, and date range

**Base Path**: `/api/v1/client/organisation/timesheet/`

#### TypeScript Interfaces

```typescript
interface Timesheet {
  id: number;
  employee: EmployeeProfileNested;
  organisation: number;
  ticket?: TicketNested;
  project?: ProjectNested;
  deliverable?: DeliverableNested;
  task_description: string;
  hours_spent: number;
  date_worked: string;  // Date (YYYY-MM-DD)
  is_auto_created: boolean;
  notes?: string;
  created: string;
  updated: string;
}

interface DeliverableNested {
  id: number;
  name: string;
  project_name?: string;
  due_date?: string;  // Date (YYYY-MM-DD)
}

interface TimesheetList {
  id: number;
  employee: number;
  employee_name: string;
  employee_email: string;
  employee_position: string;
  ticket?: number;
  ticket_number?: string;
  ticket_subject?: string;
  project?: number;
  project_name?: string;
  deliverable?: number;
  deliverable_name?: string;
  task_description: string;
  hours_spent: number;
  date_worked: string;
  is_auto_created: boolean;
  created: string;
}

interface TimesheetCreateRequest {
  ticket_id?: number;
  project_id?: number;
  deliverable_id?: number;
  task_description: string;
  hours_spent: number;
  date_worked: string;  // Date (YYYY-MM-DD)
  notes?: string;
}
```

#### List Timesheets

**Endpoint**: `GET /api/v1/client/organisation/timesheet/`

**Authentication**: Required

**Permissions**: 
- **Super Admin** (with `view_all_timesheets` permission): Can see all timesheets
- **HR** (with `manage_leave_requests` permission): Can see all timesheets
- **Manager/Project Manager/Team Lead** (with `manage_projects` permission or assigned as project manager): Can see their own timesheets + timesheets for projects they manage
- **Employee**: Can only see their own timesheets

**Query Parameters**:
- `employee` - Filter by employee ID
- `ticket` - Filter by ticket ID
- `project` - Filter by project ID
- `deliverable` - Filter by deliverable ID
- `date_from` - Filter timesheets from this date (ISO format, YYYY-MM-DD)
- `date_to` - Filter timesheets up to this date (ISO format, YYYY-MM-DD)
- `is_auto_created` - Filter by auto-created status (`true`/`false`)

**Example Request**:
```typescript
// Get all timesheets
const response = await apiClient.get('/client/organisation/timesheet/');

// Get timesheets for specific employee
const response = await apiClient.get('/client/organisation/timesheet/?employee=5');

// Get timesheets for a specific ticket
const response = await apiClient.get('/client/organisation/timesheet/?ticket=10');

// Get timesheets for a specific project
const response = await apiClient.get('/client/organisation/timesheet/?project=2');

// Get timesheets for a specific deliverable
const response = await apiClient.get('/client/organisation/timesheet/?deliverable=5');

// Get timesheets for a date range
const response = await apiClient.get(
  '/client/organisation/timesheet/?date_from=2024-01-01&date_to=2024-01-31'
);

// Get only manually created timesheets
const response = await apiClient.get('/client/organisation/timesheet/?is_auto_created=false');
```

**Response**:
```json
{
  "links": {
    "next": null,
    "previous": null
  },
  "count": 10,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "employee": 3,
      "employee_name": "John Doe",
      "employee_email": "john@example.com",
      "employee_position": "Software Engineer",
      "ticket": 5,
      "ticket_number": "PC-0000005",
      "ticket_subject": "Fix login bug",
      "project": 2,
      "project_name": "Website Redesign",
      "deliverable": null,
      "deliverable_name": null,
      "task_description": "Completed ticket: Fix login bug",
      "hours_spent": 2.5,
      "date_worked": "2024-01-15",
      "is_auto_created": true,
      "created": "2024-01-15T17:30:00Z"
    },
    {
      "id": 2,
      "employee": 3,
      "employee_name": "John Doe",
      "employee_email": "john@example.com",
      "employee_position": "Software Engineer",
      "ticket": null,
      "ticket_number": null,
      "ticket_subject": null,
      "project": 2,
      "project_name": "Website Redesign",
      "deliverable": 5,
      "deliverable_name": "User Authentication Module",
      "task_description": "Code review and testing",
      "hours_spent": 1.5,
      "date_worked": "2024-01-16",
      "is_auto_created": false,
      "created": "2024-01-16T10:00:00Z"
    }
  ],
  "summary": {
    // Summary content varies based on user permissions
    // See "Summary Field" section below for details
  }
}
```

**Summary Field**:

The `summary` field is automatically included in the response and provides timesheet statistics. The content depends on the user's permissions:

**For Super Admin and HR (Organization-wide summary)**:
```json
{
  "summary": {
    "total_timesheets": 150,
    "total_employees": 25,
    "total_hours": 1200.5,
    "average_hours_per_timesheet": 8.0,
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-01-31",
      "days": 31
    },
    "project_breakdown": {
      "2": {
        "project_id": 2,
        "project_name": "Website Redesign",
        "count": 45,
        "total_hours": 360.0
      },
      "3": {
        "project_id": 3,
        "project_name": "Mobile App",
        "count": 30,
        "total_hours": 240.0
      },
      "no_project": {
        "project_id": null,
        "project_name": "No Project",
        "count": 75,
        "total_hours": 600.5
      }
    },
    "employee_breakdown": {
      "3": {
        "employee_id": 3,
        "email": "john@example.com",
        "count": 20,
        "total_hours": 160.0
      },
      "5": {
        "employee_id": 5,
        "email": "jane@example.com",
        "count": 25,
        "total_hours": 200.0
      }
    },
    "top_contributors": [
      {
        "employee_id": 5,
        "email": "jane@example.com",
        "count": 25,
        "total_hours": 200.0
      },
      {
        "employee_id": 3,
        "email": "john@example.com",
        "count": 20,
        "total_hours": 160.0
      }
    ]
  }
}
```

**For Manager/Project Manager/Team Lead (Own + Managed Projects summary)**:
```json
{
  "summary": {
    "total_timesheets": 45,
    "own_timesheets": 15,
    "managed_project_timesheets": 30,
    "total_hours": 360.0,
    "own_total_hours": 120.0,
    "managed_project_total_hours": 240.0,
    "average_hours_per_timesheet": 8.0,
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-01-31",
      "days": 31
    },
    "project_breakdown": {
      "2": {
        "project_id": 2,
        "project_name": "Website Redesign",
        "count": 20,
        "total_hours": 160.0
      },
      "3": {
        "project_id": 3,
        "project_name": "Mobile App",
        "count": 10,
        "total_hours": 80.0
      }
    }
  }
}
```

**For Employee (Personal summary - only their own timesheets)**:
```json
{
  "summary": {
    "total_timesheets": 15,
    "total_hours": 120.0,
    "average_hours_per_timesheet": 8.0,
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-01-31",
      "days": 31
    },
    "project_breakdown": {
      "2": {
        "project_id": 2,
        "project_name": "Website Redesign",
        "count": 10,
        "total_hours": 80.0
      },
      "no_project": {
        "project_id": null,
        "project_name": "No Project",
        "count": 5,
        "total_hours": 40.0
      }
    }
  }
}
```

**Summary Fields Explanation**:

**Organization-wide summary** (Super Admin/HR):
- `total_timesheets` - Total number of timesheets in the date range
- `total_employees` - Number of unique employees with timesheets
- `total_hours` - Total hours worked across all timesheets
- `average_hours_per_timesheet` - Average hours per timesheet entry
- `date_range` - The date range used for calculations (`from`, `to`, `days`)
- `project_breakdown` - Breakdown of timesheets by project (includes `no_project` for timesheets without a project)
- `employee_breakdown` - Breakdown of timesheets by employee
- `top_contributors` - Top 5 employees by total hours worked

**Manager/Project Manager summary**:
- `total_timesheets` - Total timesheets (own + managed projects)
- `own_timesheets` - Count of user's own timesheets
- `managed_project_timesheets` - Count of timesheets for projects they manage
- `total_hours` - Total hours (own + managed projects)
- `own_total_hours` - Hours from user's own timesheets
- `managed_project_total_hours` - Hours from managed project timesheets
- `average_hours_per_timesheet` - Average hours per timesheet entry
- `date_range` - The date range used for calculations
- `project_breakdown` - Breakdown by managed projects only

**Personal summary** (Employee):
- `total_timesheets` - Total number of user's timesheets
- `total_hours` - Total hours worked by the user
- `average_hours_per_timesheet` - Average hours per timesheet entry
- `date_range` - The date range used for calculations
- `project_breakdown` - Breakdown of user's timesheets by project

**Notes**:
- The summary is calculated based on the filtered queryset (respects `date_from`, `date_to`, `employee`, `ticket`, `project`, and `is_auto_created` filters)
- If no date filters are provided, the summary defaults to the current month
- Project breakdown includes a `no_project` entry for timesheets not linked to any project
- The summary automatically adapts based on user permissions and visibility rules

#### Create Timesheet

**Endpoint**: `POST /api/v1/client/organisation/timesheet/`

**Authentication**: Required

**Permissions**: User must be an employee of the organisation

**Description**: Create a new timesheet entry to track time spent on a task. Can be linked to a ticket and/or project.

**Request Body**:
```json
{
  "ticket_id": 5,
  "project_id": 2,
  "deliverable_id": 5,
  "task_description": "Code review and testing",
  "hours_spent": 1.5,
  "date_worked": "2024-01-16",
  "notes": "Reviewed pull request #123"
}
```

**Required Fields**:
- `task_description` - Description of the task/work performed
- `hours_spent` - Number of hours spent (must be greater than 0)
- `date_worked` - Date when the work was performed (YYYY-MM-DD)

**Optional Fields**:
- `ticket_id` - ID of the ticket this timesheet is linked to
- `project_id` - ID of the project this timesheet is linked to (auto-set from ticket if not provided)
- `deliverable_id` - ID of the project deliverable this timesheet is linked to (must belong to the specified project)
- `notes` - Additional notes about the work performed

**Example Request**:
```typescript
// Create timesheet linked to a ticket
const response = await apiClient.post('/client/organisation/timesheet/', {
  ticket_id: 5,
  task_description: 'Fixed login bug',
  hours_spent: 2.5,
  date_worked: '2024-01-15',
  notes: 'Debugged authentication issue'
});

// Create timesheet linked to a project (without ticket)
const response = await apiClient.post('/client/organisation/timesheet/', {
  project_id: 2,
  task_description: 'Code review',
  hours_spent: 1.0,
  date_worked: '2024-01-16'
});

// Create timesheet linked to a project and deliverable
const response = await apiClient.post('/client/organisation/timesheet/', {
  project_id: 2,
  deliverable_id: 5,
  task_description: 'Implement authentication module',
  hours_spent: 4.0,
  date_worked: '2024-01-16',
  notes: 'Completed user authentication feature'
});

// Create standalone timesheet
const response = await apiClient.post('/client/organisation/timesheet/', {
  task_description: 'Team meeting',
  hours_spent: 0.5,
  date_worked: '2024-01-16'
});
```

**Response**: Returns the created timesheet (same format as Get Timesheet Details)

**Error Responses**:
- `400 Bad Request` - Hours spent must be greater than 0
- `400 Bad Request` - Ticket does not belong to this organisation
- `400 Bad Request` - Project does not belong to this organisation
- `400 Bad Request` - Deliverable must belong to the specified project
- `400 Bad Request` - Deliverable does not belong to this organisation
- `400 Bad Request` - User must be an employee of this organisation

#### Get Timesheet Details

**Endpoint**: `GET /api/v1/client/organisation/timesheet/{id}`

**Authentication**: Required

**Permissions**: Same as list endpoint

**Response**:
```json
{
  "id": 1,
  "employee": {
    "id": 3,
    "account": {
      "id": 3,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe"
    },
    "position": "Software Engineer",
    "department": "Engineering"
  },
  "organisation": 1,
  "ticket": {
    "id": 5,
    "ticket_number": "PC-0000005",
    "subject": "Fix login bug",
    "status": "closed",
    "priority": "high"
  },
      "project": {
        "id": 2,
        "name": "Website Redesign",
        "client_name": "Acme Corporation",
        "status": "active"
      },
      "deliverable": {
        "id": 5,
        "name": "User Authentication Module",
        "project_name": "Website Redesign",
        "due_date": "2024-02-01"
      },
      "task_description": "Completed ticket: Fix login bug",
      "hours_spent": 2.5,
      "date_worked": "2024-01-15",
      "is_auto_created": true,
      "notes": "Auto-generated from ticket PC-0000005",
      "created": "2024-01-15T17:30:00Z",
      "updated": "2024-01-15T17:30:00Z"
    }
```

#### Update Timesheet

**Endpoint**: `PATCH /api/v1/client/organisation/timesheet/{id}` (partial update)
**Endpoint**: `PUT /api/v1/client/organisation/timesheet/{id}` (full update)

**Authentication**: Required

**Permissions**: 
- Users with `update_tickets` permission can update any timesheet
- Users without permission can only update their own timesheets

**Request Body**:
```json
{
  "hours_spent": 3.0,
  "task_description": "Updated description",
  "notes": "Additional work was required"
}
```

**Response**: Returns the updated timesheet

**Error Responses**:
- `400 Bad Request` - You can only update your own timesheets (if user doesn't have permission)
- `400 Bad Request` - Hours spent must be greater than 0

#### Delete Timesheet

**Endpoint**: `DELETE /api/v1/client/organisation/timesheet/{id}`

**Authentication**: Required

**Permissions**: 
- Users with `update_tickets` permission can delete any timesheet
- Users without permission can only delete their own timesheets

**Response**: `204 No Content`

**Error Responses**:
- `400 Bad Request` - You can only delete your own timesheets (if user doesn't have permission)

#### Auto-Creation from Tickets

When a ticket is closed or resolved (status changed to `"resolved"` or `"closed"`), a timesheet entry is automatically created with the following characteristics:

- **Employee**: The ticket's `assigned_to` (only if ticket is assigned to an employee)
- **Ticket**: Linked to the closed ticket
- **Project**: Inherited from the ticket's project (if any)
- **Deliverable**: Not auto-set (can be manually linked if needed)
- **Task Description**: `"Completed ticket: {ticket.subject}"`
- **Hours Spent**: Calculated from when ticket status changed to "in-progress" to when it was closed/resolved (capped at 24 hours, minimum 0.1 hours)
- **Date Worked**: The date when the ticket was closed
- **Is Auto Created**: `true`
- **Notes**: `"Auto-generated from ticket {ticket_number}"`

**Important Notes**:
- Timesheets are **only** created if:
  - The ticket is assigned to an employee (`assigned_to` is not null)
  - The ticket was in "in-progress" status at some point (`in_progress_at` is not null)
- If a ticket is not assigned when closed, no timesheet is created (employees can manually create one if needed)
- If a ticket is closed without ever being in "in-progress" status, no timesheet is created
- Only one auto-created timesheet is created per ticket (prevents duplicates)
- If a ticket is reopened and closed again, no new timesheet is created
- Auto-created timesheets can be manually updated or deleted like regular timesheets
- The hours calculation is based on the time between when the ticket entered "in-progress" status and when it was closed/resolved

**Example Flow**:
1. Ticket is created on `2024-01-15 09:00:00`
2. Ticket is closed on `2024-01-15 17:30:00`
3. Timesheet is auto-created with:
   - `hours_spent`: 8.5 (calculated from duration)
   - `date_worked`: `2024-01-15`
   - `is_auto_created`: `true`

---

## Next.js Integration Guide

### 1. Project Setup

**Steps:**
1. Create a new Next.js project with TypeScript and Tailwind CSS:
   ```bash
   npx create-next-app@latest snapdesk-frontend --typescript --tailwind --app
   ```
2. Install required dependencies:
   ```bash
   npm install axios
   # Optional: for state management
   npm install zustand
   # Optional: for form handling
   npm install react-hook-form
   # Optional: for notifications
   npm install react-hot-toast
   ```

### 1.5. Docker Setup for Frontend

**What to Create:**

1. **Dockerfile** (for production):
   - Use Node.js 18 Alpine as base image
   - Multi-stage build (deps → builder → runner)
   - Copy package files and install dependencies
   - Build the Next.js application
   - Copy built files to production image
   - Run as non-root user
   - Expose port 3000

2. **Dockerfile.dev** (for development with hot reload):
   - Simpler setup for development
   - Mount source code as volume
   - Run `npm run dev` for hot reload
   - Expose port 3000

3. **docker-compose.yml**:
   - Frontend service configuration
   - Environment variables for API base URL
   - Volume mounts for development
   - Port mapping (3000:3000)
   - Network configuration (connect to backend if needed)

4. **.dockerignore**:
   - Exclude node_modules, .next, .git, env files
   - Reduces build context size

**Key Configuration:**
- Set `output: 'standalone'` in `next.config.js` for Docker production builds
- Use environment variables for API base URL
- For development, mount source code as volume for hot reload
- For production, copy built files into image

**Commands:**
```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production build
docker-compose build
docker-compose up -d

# View logs
docker-compose logs -f frontend
```

### 2. Environment Variables

**Action Required:**

**For Local Development:**
1. Create a `.env.local` file in your Next.js project root
2. Add the following variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:9000/api/v1
   NEXT_PUBLIC_MAIN_DOMAIN=snapdesk.com
   ```

**For Docker Development:**
1. Add environment variables to `docker-compose.yml`:
   ```yaml
   environment:
     - NEXT_PUBLIC_API_BASE_URL=http://localhost:9000/api/v1
     - NEXT_PUBLIC_MAIN_DOMAIN=snapdesk.com
   ```
   Or use an `.env` file and reference it in docker-compose.yml

**For Docker Production:**
1. Set environment variables in Dockerfile or docker-compose.yml
2. Or use Docker secrets/environment files for sensitive data

**Note**: 
- Use port **9000** if the backend is running via Docker (recommended)
- Use port 8000 only if running Django locally without Docker
- When frontend runs in Docker, ensure it can reach the backend (use service name or host.docker.internal)

### 3. API Client Setup

**What to Build:**
1. Create an API client utility (`lib/api-client.ts` or similar) that:
   - Uses axios or fetch to make HTTP requests
   - Sets the base URL from environment variables
   - Automatically adds the `Authorization: Bearer {token}` header to all requests
   - Handles token refresh when receiving 401 responses
   - Stores tokens in localStorage (or httpOnly cookies for production)
   - Includes `withCredentials: true` for CORS

**Key Features to Implement:**
- Request interceptor: Add JWT token from localStorage to Authorization header
- Response interceptor: Handle 401 errors by attempting token refresh
- Error handling: Redirect to login if refresh fails
- Token storage: Store access_token and refresh_token securely
- **Separate API clients for staff and client** (recommended):
  - `clientApiClient`: For `/api/v1/client/` endpoints
  - `staffApiClient`: For `/api/v1/staff/` endpoints
  - Each uses different token storage keys (e.g., `client_access_token` vs `staff_access_token`)

**Example: Separate API Clients**
```typescript
// lib/client-api-client.ts
import axios from 'axios';

const clientApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL + '/client',
  withCredentials: true,
});

// Add token from client storage
clientApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('client_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// lib/staff-api-client.ts
const staffApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL + '/staff',
  withCredentials: true,
});

// Add token from staff storage
staffApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('staff_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 4. Authentication Service

**What to Build:**
1. Create an authentication service (`services/auth.service.ts` or similar) with methods for:
   - **Client Authentication:**
     - `signup(data)`: POST to `/api/v1/client/auth/account/signup`
     - `login(phoneNumber, password)`: POST to `/api/v1/client/auth/account/login`
       - Extract tokens from response headers: `set-auth-token` and `set-refresh-token`
       - Store tokens in localStorage
     - `businessLogin(phoneNumber, password, organisationIdentifier)`: POST to `/api/v1/client/auth/account/business_login`
       - `organisationIdentifier` can be organisation ID, name, or subdomain
     - `sendVerificationCode(phoneNumber)`: POST to `/api/v1/client/auth/account/send_verification_code`
     - `businessSendVerificationCode(phoneNumber, organisationIdentifier)`: POST to `/api/v1/client/auth/account/business_send_verification_code`
       - `organisationIdentifier` can be organisation ID, name, or subdomain
   - **Staff Authentication:**
     - `staffSendVerificationCode(email)`: POST to `/api/v1/staff/auth/account/send_verification_code`
     - `staffLogin(email, code)`: POST to `/api/v1/staff/auth/account/login`
       - Extract tokens from response headers: `set-auth-token` and `set-refresh-token`
       - Store tokens in localStorage (consider separate storage keys for staff vs client)
   - **Common:**
     - `logout()`: Clear tokens from storage
     - `getToken()`: Retrieve access token (client or staff)
     - `isAuthenticated()`: Check if user is logged in
     - `isStaffUser()`: Check if logged in user is a staff member

**Important Notes:**
- Tokens are returned in response headers, not the body
- Access token should be included in `Authorization: Bearer {token}` header
- In development:
  - Client OTP code is typically `"0000"` (4 digits)
  - Staff verification code is typically `"000000"` (6 digits)
- Consider using separate token storage keys for staff vs client users (e.g., `staff_access_token` vs `client_access_token`)
- Staff and client tokens use different authentication classes, so tokens are not interchangeable

### 5. Authentication State Management

**What to Build:**
1. Create a React hook (`hooks/useAuth.ts` or similar) that:
   - Manages current user state
   - Provides login/logout functions
   - Checks authentication status on mount
   - Fetches user profile when authenticated (once profile endpoint is implemented)

2. Consider using a state management library (Zustand, Redux, or Context API) to:
   - Store user data globally
   - Share authentication state across components
   - Persist user data in localStorage/sessionStorage

### 6. Protected Routes

**What to Build:**
1. Create a `ProtectedRoute` component that:
   - Checks if user is authenticated
   - Shows loading state while checking
   - Redirects to `/login` if not authenticated
   - Renders children if authenticated

2. Wrap protected pages with this component:
   ```tsx
   <ProtectedRoute>
     <Dashboard />
   </ProtectedRoute>
   ```

3. Alternatively, use Next.js middleware to protect routes at the route level

---

## TypeScript Types

**What to Create:**
1. Create TypeScript type definitions file (`types/index.ts` or similar) with interfaces for:

**Authentication Types:**
- `LoginRequest`: `{ phone_number: string, password: string }`
- `BusinessLoginRequest`: Extends LoginRequest with `organisation: string`
- `SignupRequest`: All signup fields (see API endpoint documentation)
- `UserResponse`: User data structure returned from login/signup

**Data Model Types:**
- `Organisation`: Organization/company data
- `Address`: Address information
- `EmployeeProfile`: Full employee profile data (see interface above)
- `EmployeeProfileList`: Minimal employee data for list views (see interface above)
- `Ticket`: Ticket object with status, priority, etc.
- `Category`: Ticket/article category
- `TicketComment`: Comment on a ticket
- `KnowledgebaseArticle`: Knowledge base article
- `Notification`: Notification object

**Staff Types:**
```typescript
interface StaffUser {
  id: number;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  username?: string;
  email?: string;
  is_staff: boolean;
}

interface StaffPermission {
  id: number;
  name: string;
  description?: string;
  created: string;
  updated: string;
}

interface StaffRole {
  id: number;
  name: string;
  description?: string;
  permissions: StaffPermission[];
  created: string;
  updated: string;
}

interface StaffProfile {
  id: number;
  staff_user: StaffUser;
  role?: StaffRole;
  created: string;
  updated: string;
}
```

**Enum Types:**
- `TicketStatus`: `'open' | 'in-progress' | 'resolved' | 'closed'`
- `TicketPriority`: `'low' | 'medium' | 'high' | 'urgent'`
- `AccountType`: `'user' | 'employee' | 'business_owner' | 'other'`
- `OrganisationPlan`: `'free' | 'pro' | 'enterprise'`
- `ArticleVisibility`: `'internal' | 'public'`
- `NotificationType`: `'ticket_created' | 'ticket_assigned' | 'ticket_closed'`

**Request/Response Types:**
- `CreateTicketRequest`: Fields needed to create a ticket
- `UpdateTicketRequest`: Fields for updating a ticket
- `CreateArticleRequest`: Fields for creating an article
- `PaginatedResponse<T>`: Generic paginated response wrapper
- `ApiError`: Error response structure

**How to Use:**
- Reference the API endpoint documentation below for exact field names and types
- Use these types throughout your application for type safety
- Update types as new endpoints are added to the backend

---

## Error Handling

### Error Response Format

The API returns errors in the following format:

```json
{
  "detail": "Error message",
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

### What to Implement

**Error Handler Utility:**
1. Create an error handler utility (`utils/error-handler.ts` or similar) that:
   - Extracts error messages from API error responses
   - Handles different error formats (detail, errors object, etc.)
   - Provides user-friendly messages for common HTTP status codes:
     - `401`: Unauthorized - redirect to login
     - `403`: Forbidden - permission denied
     - `404`: Not found
     - `422`: Validation errors - show field-specific errors
     - `500`: Server error
   - Returns a single string message for display to users

**Usage Pattern:**
- Wrap all API calls in try-catch blocks
- Use the error handler to extract user-friendly messages
- Display errors using toast notifications or inline form errors
- Handle validation errors by showing field-specific messages

**Example Flow:**
1. API call fails
2. Error handler extracts message
3. Show error to user (toast, alert, or form field error)
4. For 401 errors, automatically attempt token refresh or redirect to login

---

## Multi-Tenancy

### Subdomain Detection

SnapDesk uses subdomain-based multi-tenancy. The organization is determined from the subdomain in the request.

### Implementation Options

**Option 1: Subdomain Routing (Recommended for Production)**

**What to Do:**
1. Create Next.js middleware (`middleware.ts` in project root) that:
   - Extracts subdomain from the request hostname
   - Stores subdomain in request headers or context
   - Handles main domain and localhost cases
   - Routes requests appropriately

2. Update your API client to:
   - Detect subdomain from `window.location.hostname` (client-side)
   - Construct API URL with subdomain: `https://{subdomain}.snapdesk.com/api/v1`
   - Fall back to environment variable for localhost/development

**Option 2: Environment-Based (For Development)**

**What to Do:**
1. Set subdomain in environment variables:
   ```
   NEXT_PUBLIC_SUBDOMAIN=acme
   ```
2. Use this in your API client to construct the base URL

**Important Notes:**
- In development, you may need to use the main API URL without subdomain
- The backend middleware automatically detects organization from subdomain
- For localhost development with Docker, use: `http://localhost:9000/api/v1` ⚠️ **Port 9000**
- For localhost development without Docker, use: `http://localhost:8000/api/v1`
- For production with subdomains, use: `https://{subdomain}.snapdesk.com/api/v1`

---

## Example Implementations

### Login Page

**What to Build:**
1. Create a login page (`app/login/page.tsx` or `pages/login.tsx`) with:
   - **For Client Users:**
     - Form fields for phone number and password/OTP
     - Submit handler that calls `authService.login()`
     - Loading state during authentication
     - Error handling with user-friendly messages
     - Redirect to dashboard on successful login
     - Link to signup page
   - **For Staff Users (Separate Page or Toggle):**
     - Form fields for email and 6-digit code
     - Submit handler that calls `authService.staffLogin()`
     - "Send Code" button that calls `authService.staffSendVerificationCode()` before login
     - Loading state and error handling
     - Redirect to staff dashboard on successful login

**Key Features:**
- **Client Login:**
  - Phone number input (with country code support recommended)
  - Password/OTP input field (4 digits)
  - "Send OTP" button that calls `sendVerificationCode()` before login
- **Staff Login:**
  - Email input field
  - 6-digit code input field
  - "Send Code" button that calls `staffSendVerificationCode()` before login
- **Common:**
  - Form validation
  - Loading indicators
  - Error message display
  - Toggle between client and staff login modes (optional)

### Signup Page

**What to Build:**
1. Create a signup page with form fields for:
   - Phone number (required)
   - Email (optional)
   - First name, last name (optional)
   - Gender (optional)
   - Account type (required dropdown)
   - Business name (required if account_type is "business_owner")
   - Business email (required)
   - Address fields (optional)

2. On submit:
   - Call `authService.signup()` with form data
   - Show success message
   - Optionally auto-send verification code
   - Redirect to login or OTP verification page

### Tickets List Page

**What to Build:**
1. Create a tickets list component/page that:
   - Fetches tickets from `GET /api/v1/tickets/` (once implemented)
   - Displays tickets in a table or card layout
   - Shows ticket status, priority, subject, description
   - Implements pagination using the `links`, `count`, and `total_pages` from response
   - Includes filters for status, priority, category
   - Has a "Create Ticket" button/link
   - Shows loading state while fetching
   - Handles empty state (no tickets)

**Display Elements:**
- **Ticket Number** (e.g., `PC-0000001`) - Auto-generated, unique identifier for easy reference
- Ticket ID (internal database ID)
- Subject (as link to detail page)
- Status badge (color-coded)
- Priority badge (color-coded)
- **Overdue indicator** - Show badge/icon if `is_overdue === true`
- **Time remaining/overdue** - Display countdown timer or overdue time using `time_remaining_seconds`
- Assigned to (if assigned)
- Created date
- Expected completion date (from `expected_completion_at`)
- Actions (view, edit, delete)

**Note**: Use `ticket_number` for display to users as it's more readable and meaningful than the internal `id`. The ticket number format (`ABBREV-0000001`) makes it easy to identify which organization a ticket belongs to.

**Example: Displaying Overdue Tickets**

```typescript
// Ticket List Component with Overdue Detection
import { TicketList } from '@/types';

export function TicketListComponent({ tickets }: { tickets: TicketList[] }) {
  return (
    <div>
      {tickets.map(ticket => (
        <div key={ticket.id} className={ticket.is_overdue ? 'border-red-500' : ''}>
          <div className="flex items-center justify-between">
            <div>
              <h3>{ticket.subject}</h3>
              <p>#{ticket.ticket_number}</p>
            </div>
            <div className="flex gap-2">
              {/* Overdue Badge */}
              {ticket.is_overdue && (
                <Badge color="red">Overdue</Badge>
              )}
              
              {/* Priority Badge */}
              <Badge color={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
              
              {/* Status Badge */}
              <Badge color={getStatusColor(ticket.status)}>
                {ticket.status}
              </Badge>
            </div>
          </div>
          
          {/* Time Remaining Display */}
          {ticket.time_remaining_seconds !== null && (
            <div className="mt-2">
              {ticket.is_overdue ? (
                <span className="text-red-600">
                  {formatOverdueTime(ticket.time_remaining_seconds)} overdue
                </span>
              ) : (
                <span className="text-green-600">
                  {formatTimeRemaining(ticket.time_remaining_seconds)} remaining
                </span>
              )}
            </div>
          )}
          
          {/* Expected Completion Date */}
          {ticket.expected_completion_at && (
            <p className="text-sm text-gray-500">
              Due: {new Date(ticket.expected_completion_at).toLocaleString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Helper function to format time remaining
function formatTimeRemaining(seconds: number): string {
  if (seconds < 0) {
    return formatOverdueTime(seconds);
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Helper function to format overdue time
function formatOverdueTime(seconds: number): string {
  const overdueSeconds = Math.abs(seconds);
  const hours = Math.floor(overdueSeconds / 3600);
  const minutes = Math.floor((overdueSeconds % 3600) / 60);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Filter and sort tickets by urgency
function sortTicketsByUrgency(tickets: TicketList[]): TicketList[] {
  return [...tickets].sort((a, b) => {
    // Overdue tickets first
    if (a.is_overdue && !b.is_overdue) return -1;
    if (!a.is_overdue && b.is_overdue) return 1;
    
    // Then by time remaining (most urgent first)
    if (a.time_remaining_seconds === null) return 1;
    if (b.time_remaining_seconds === null) return -1;
    
    return a.time_remaining_seconds - b.time_remaining_seconds;
  });
}
```

**Example: Countdown Timer Component**

```typescript
// Real-time countdown timer component
import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  initialSeconds: number | null;
  isOverdue: boolean;
}

export function CountdownTimer({ initialSeconds, isOverdue }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  
  useEffect(() => {
    if (seconds === null || seconds === undefined) return;
    
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev === null || prev === undefined) return null;
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (seconds === null) {
    return <span>Closed</span>;
  }
  
  const hours = Math.floor(Math.abs(seconds) / 3600);
  const minutes = Math.floor((Math.abs(seconds) % 3600) / 60);
  const secs = Math.abs(seconds) % 60;
  
  return (
    <div className={isOverdue ? 'text-red-600' : 'text-green-600'}>
      {isOverdue ? '⚠️ ' : '⏱️ '}
      {hours.toString().padStart(2, '0')}:
      {minutes.toString().padStart(2, '0')}:
      {secs.toString().padStart(2, '0')}
      {isOverdue ? ' overdue' : ' remaining'}
    </div>
  );
}
```

### Ticket Detail Page

**What to Build:**
1. Create a ticket detail page that:
   - Fetches ticket details from `GET /api/v1/client/organisation/tickets/{ticket_number}`
   - Uses `ticket_number` (e.g., `PC-0000001`) instead of internal `id` in the URL
   - Displays all ticket information
   - Shows ticket comments
   - Allows adding new comments
   - Allows updating ticket (status, priority, assignment)
   - Shows ticket history/audit log (if available)

### Create Ticket Form

**What to Build:**
1. Create a ticket creation form/modal with:
   - Subject input (required)
   - Description textarea (required)
   - Priority dropdown (default: "medium")
   - Category dropdown (optional, if categories endpoint exists)
   - Submit button
   - Form validation
   - Success/error handling

2. On submit:
   - Call `POST /api/v1/tickets/` (once implemented)
   - Show success message
   - Redirect to ticket detail or refresh list
   - Clear form on success

### Dashboard

**What to Build:**
1. Create a **role-aware dashboard page** that:
   - Checks the `role_focus` field from the API response
   - Renders different components based on the role
   - Displays role-specific metrics, breakdowns, and performance indicators

2. **Dashboard Structure by Role:**

   **Super Admin Dashboard:**
   - Metric Cards: Total Employees, Total Tickets, Tickets Closed (30 days)
   - Additional Metrics: Knowledge Base Articles, Categories, Roles
   - Organization Overview: Ticket status, Employees by department
   - Performance: Organization-wide metrics (closure rate, response time, new hires)

   **HR Dashboard:**
   - Metric Cards: Total Employees, New Hires (30 days), Employees with Manager
   - Additional Metrics: Total Tickets, Reports, Total Roles
   - Employee Breakdown: By department, by role
   - Performance: Onboarding rate, manager coverage, recent hires

   **IT Support Dashboard:**
   - Metric Cards: Assigned to Me, Total Tickets, On-Time Closure Rate
   - Additional Metrics: Knowledge Base Articles, Published Articles, Categories
   - Ticket Breakdown: By status, by priority
   - Performance: Response time, first response rate, resolution rate

   **Manager Dashboard:**
   - Metric Cards: Team Size, Team Tickets, Total Tickets
   - Additional Metrics: Reports, Knowledge Base, Categories
   - Team Breakdown: Team ticket status, all ticket status
   - Performance: Team on-time closure rate, team response rate

   **Employee Dashboard:**
   - Metric Cards: My Tickets, My Open Tickets, My In Progress
   - Additional Metrics: Knowledge Base Articles, Categories
   - My Ticket Breakdown: By status, by priority
   - Performance: Resolution rate, closed/resolved tickets

   **General Dashboard:**
   - Adapts based on available permissions
   - Shows metrics based on what the user can access

3. **Fetch data from:**
   - **Dashboard Summary Endpoint**: `GET /api/v1/client/organisation/dashboard/summary`
   - This single endpoint returns all role-specific data

**Example Implementation**:
```typescript
// Fetch dashboard data with role-aware handling
const fetchDashboardData = async () => {
  try {
    const response = await apiClient.get('/client/organisation/dashboard/summary');
    const data = response.data;
    
    // Check role_focus to determine dashboard type
    switch (data.role_focus) {
      case 'super_admin':
        // Render Super Admin dashboard
        renderSuperAdminDashboard(data as SuperAdminDashboardSummary);
        break;
        
      case 'hr':
        // Render HR dashboard
        renderHRDashboard(data as HRDashboardSummary);
        break;
        
      case 'it_support':
        // Render IT Support dashboard
        renderITSupportDashboard(data as ITSupportDashboardSummary);
        break;
        
      case 'manager':
        // Render Manager dashboard
        renderManagerDashboard(data as ManagerDashboardSummary);
        break;
        
      case 'employee':
        // Render Employee dashboard
        renderEmployeeDashboard(data as EmployeeDashboardSummary);
        break;
        
      default:
        // Render General dashboard
        renderGeneralDashboard(data as GeneralDashboardSummary);
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  }
};

// Example: HR Dashboard Component
const renderHRDashboard = (data: HRDashboardSummary) => {
  // Display first 3 metrics (role-specific)
  const { total_employees, new_hires_30_days, employees_with_manager } = data.metrics;
  
  // Display next 3 metrics (additional permissions)
  const additionalMetrics = {
    total_tickets: data.metrics.total_tickets,
    reports_available: data.metrics.reports_available,
    total_roles: data.metrics.total_roles
  };
  
  // Display employee breakdown
  const { by_department, by_role } = data.employee_breakdown;
  
  // Display HR performance
  const { onboarding_rate, manager_coverage, recent_hires_90_days } = data.hr_performance;
};
```

**Key Implementation Points:**
1. **Always check `role_focus`**: Use this field to determine which dashboard to render
2. **First 3 Metrics**: These are always role-specific and should be prominently displayed
3. **Next 3 Metrics**: These are optional and based on additional permissions - check if they exist before displaying
4. **Breakdown Sections**: Each role has different breakdown sections - render appropriate charts/visualizations
5. **Performance Metrics**: Each role has unique performance metrics - use role-specific labels

**Role-Based Data Filtering:**
The dashboard automatically filters data based on the user's role and permissions:
- **Super Admin**: Sees everything (all employees, all tickets, all metrics)
- **HR**: Sees all employees, can view tickets but not manage them
- **IT Support**: Sees all tickets, focuses on assigned tickets and ticket performance
- **Manager**: Sees team members and their tickets, plus all tickets
- **Employee**: Sees only their own tickets and personal metrics
- **Custom Roles**: See data based on their specific permissions

This ensures each user sees relevant data appropriate to their role, maintaining data privacy and security.

### Knowledge Base

**What to Build:**
1. Create knowledge base pages:
   - **Article List Page**: Display all articles with filtering
   - **Article Detail Page**: Show full article content
   - **Article Creation/Editing**: Form for authorized users (requires `create_knowledge_base` or `update_knowledge_base` permission)
   - **Category Navigation**: Browse articles by category

2. **Key Features**:
   - Search functionality (searches title and content)
   - Filter by category
   - Filter by visibility (internal/public)
   - Filter by author
   - Rich text content display (HTML/Markdown)
   - Article versioning display
   - Publish/unpublish functionality

3. **Fetch Articles**:
   ```typescript
   // List all articles
   const response = await apiClient.get('/client/organisation/knowledgebase/', {
     params: {
       visibility: 'public',  // or 'internal'
       category: 2,
       search: 'password reset'
     }
   });
   const articles = response.data.data;
   
   // Get article details
   const article = await apiClient.get(`/client/organisation/knowledgebase/${articleId}`);
   ```

4. **Create Article**:
   ```typescript
   const newArticle = await apiClient.post('/client/organisation/knowledgebase/', {
     title: 'How to reset your password',
     content: '<h1>Password Reset Guide</h1><p>Follow these steps...</p>',
     visibility: 'internal',  // Start as internal, publish later
     category_id: 2,
     // author_id defaults to current user if not provided
   });
   ```

5. **Update Article**:
   ```typescript
   const updatedArticle = await apiClient.patch(`/client/organisation/knowledgebase/${articleId}`, {
     title: 'Updated title',
     content: '<h1>Updated content</h1>',
     visibility: 'public',
     category_id: 3
   });
   // Note: version is automatically incremented
   ```

6. **Publish/Unpublish**:
   ```typescript
   // Publish article (make public)
   await apiClient.post(`/client/organisation/knowledgebase/${articleId}/publish`);
   
   // Unpublish article (make internal)
   await apiClient.post(`/client/organisation/knowledgebase/${articleId}/unpublish`);
   ```

7. **Permission Checks**:
   ```typescript
   // Check permissions before showing create/edit buttons
   import { hasPermission } from '@/utils/permissions';
   
   {hasPermission(user, 'create_knowledge_base') && (
     <button onClick={handleCreateArticle}>Create Article</button>
   )}
   
   {hasPermission(user, 'update_knowledge_base') && (
     <button onClick={handleEditArticle}>Edit Article</button>
   )}
   
   {hasPermission(user, 'publish_knowledge_base') && (
     <button onClick={handlePublishArticle}>Publish</button>
   )}
   ```

8. **Display Article with Version**:
   ```typescript
   export function ArticleDetail({ article }: { article: KnowledgebaseArticle }) {
     return (
       <div>
         <div className="flex items-center justify-between">
           <h1>{article.title}</h1>
           <div className="flex gap-2">
             {/* Visibility Badge */}
             <Badge color={article.visibility === 'public' ? 'green' : 'gray'}>
               {article.visibility}
             </Badge>
             
             {/* Version Badge */}
             <Badge>v{article.version}</Badge>
           </div>
         </div>
         
         {/* Article Content */}
         <div 
           className="prose max-w-none"
           dangerouslySetInnerHTML={{ __html: article.content }}
         />
         
         {/* Article Metadata */}
         <div className="mt-4 text-sm text-gray-500">
           <p>By {article.author.full_name}</p>
           <p>Created: {new Date(article.created).toLocaleString()}</p>
           <p>Last updated: {new Date(article.updated).toLocaleString()}</p>
           {article.category && <p>Category: {article.category.name}</p>}
         </div>
       </div>
     );
   }
   ```

**Important Notes**:
- Articles are automatically filtered by organization
- Public articles can be viewed by anyone, internal articles are restricted to organization members
- The `version` field auto-increments on each update (for tracking changes)
- Use a rich text editor (e.g., TinyMCE, Quill, or Tiptap) for the content field
- The `author` defaults to the current user when creating articles
- Categories are shared with tickets (same Category model)
- All operations are logged in the audit trail

### Notifications

**What to Build:**
1. Create notifications component/page:
   - Notification list/dropdown
   - Mark as read functionality
   - Real-time updates (polling or WebSocket)
   - Badge showing unread count
   - Link to related ticket/article

### User Profile

**What to Build:**
1. Create profile page with:
   - Display current user information
   - Edit profile form
   - Change password form
   - Organization information (if applicable)
   - Logout button

### Staff Organization Management

**What to Build:**
1. Create staff organization management pages:
   - **Organization List Page**: 
     - Display all organizations in a table or card layout
     - Filters for name, subdomain, plan
     - Search functionality
     - Pagination support
     - "Create Organization" button (if user has permission)
   - **Organization Detail Page**:
     - Display full organization information
     - Edit organization form (if user has permission)
     - View organization settings
     - Organization statistics/metrics (if available)
   - **Create/Edit Organization Form**:
     - Name input (required)
     - Subdomain input (required, only on create)
     - Email input
     - Plan dropdown (free, pro, enterprise)
     - Settings JSON editor
     - Email domain input
     - Allowed auth methods multi-select
     - **Owner Assignment** (for create):
       - Toggle between "Existing Account" and "Create New Account"
       - If existing: Account ID selector/search
       - If new: Form fields for owner account (phone_number, email, first_name, last_name, etc.)
     - Address fields (optional, for organization)
     - Form validation
     - Success/error handling

**Key Features:**
- Check user permissions before showing create/edit buttons
- Use `StaffAuthentication` for API calls
- Handle permission errors gracefully (show appropriate error messages)
- Filter and search organizations
- Display organization plan badges
- Show organization creation/update dates

**Example Implementation:**
```typescript
// Fetch organizations list
const fetchOrganizations = async () => {
  try {
    const response = await staffApiClient.get('/staff/organisation/', {
      params: { plan: 'free', name: searchTerm }
    });
    setOrganizations(response.data.data);
  } catch (error) {
    handleError(error);
  }
};

// Create organization
const createOrganization = async (data: CreateOrganizationRequest) => {
  try {
    const response = await staffApiClient.post('/staff/organisation/', data);
    // Show success message and redirect
    router.push(`/staff/organizations/${response.data.id}`);
  } catch (error) {
    // Handle validation errors
    if (error.response?.status === 400) {
      setFormErrors(error.response.data);
    }
  }
};
```

---

## Additional Resources

### API Documentation

When the backend is running via Docker:
- **Swagger UI**: `http://localhost:9000/api/v1/swagger/`
- **ReDoc**: `http://localhost:9000/api/v1/redoc/`
- **OpenAPI JSON**: `http://localhost:9000/api/v1/swagger.json`
- **Health Check**: `http://localhost:9000/health`

**Note**: Replace port 9000 with 8000 if running without Docker.

### Testing the API

You can test the API using:
- **Postman**: Import the OpenAPI schema
- **curl**: Command-line tool
- **Swagger UI**: Interactive API documentation

### Next Steps

1. **Implement Missing Endpoints**: The backend needs to implement the ticket, article, and notification endpoints
2. **Add Real-time Features**: Consider WebSocket integration for real-time notifications
3. **File Uploads**: Implement attachment upload endpoints
4. **Search**: Add search functionality for tickets and articles
5. **Analytics**: Implement dashboard with metrics endpoints

---

## Support

For questions or issues:
- Email: info@moonsquare.co
- API Documentation: `/api/v1/swagger/`

---

**Last Updated**: 2024
**API Version**: v1

