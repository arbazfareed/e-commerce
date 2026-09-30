# IndusCart

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=20232a)](./frontend/package.json)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](./frontend/package.json)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](./backend/package.json)
[![MongoDB](https://img.shields.io/badge/MongoDB-ready-47A248?logo=mongodb&logoColor=white)](./docker-compose.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](./LICENSE)

> IndusCart is a Pakistan-focused, full-stack commerce platform with a separate
> shopper storefront and role-protected admin portal. Built with React, Vite,
> Capacitor, Express, and MongoDB, it supports customer accounts, local and
> international catalog modes, COD checkout, server-validated orders, inventory
> management, analytics, and support workflows. Online payment capture and live
> courier booking are not yet integrated.

Local development runs the shopper portal at `http://localhost:3000`, the
admin-only portal at `http://localhost:3001`, and the shared API at
`http://localhost:5000`.

### Explore the project

- **[Project Showcase](./docs/PROJECT_SHOWCASE.md)** — user journeys, route map, and capabilities that are easy to miss
- **[Feature Coverage](./docs/FEATURE_COVERAGE.md)** — implemented, partial, and missing use cases plus next steps
- **[Complete Project Documentation](./docs/COMPLETE_PROJECT_DOCUMENTATION.md)** — consolidated project reference and recommendations
- **[Documentation Index](./docs/DOCUMENTATION_INDEX.md)** — SRD, API, architecture, testing, deployment, and policy documents
- **[Software Requirements Document](./docs/SRD.md)** — scope, requirements, acceptance criteria, and release gates
- **[UML Diagrams](./docs/UML_DIAGRAMS.md)** — GitHub-rendered source inventory/counts, frontend routes, backend authorization, domain relationships, deployment, checkout, support, uploads, password-reset email sequence/state, and UML views
- **[API Reference](./docs/API_REFERENCE.md)** — implemented routes, auth levels, fields, and limitations
- **[Architecture diagrams](./docs/ARCHITECTURE.md)** — Mermaid system, deployment, request-flow, and data diagrams
- **[Technical Guide](./docs/TECHNICAL_GUIDE.md)** — code structure and security model
- **[User Guide](./docs/USER_GUIDE.md)** — customer and admin workflows
- **[Local Run Guide](./docs/LOCAL_RUN_GUIDE.md)** — desktop, phone, and Android instructions
- **[Production Deployment](./docs/PRODUCTION_DEPLOYMENT.md)** — launch checklist and limitations
- **[Contributing](./CONTRIBUTING.md)** — validation and pull request guidelines
- **[Security Policy](./SECURITY.md)** — safe secret handling and vulnerability reporting
- **[GitHub and Cost Guide](./docs/GITHUB_AND_COST_GUIDE.md)** — repository settings, low-cost hosting, and release strategy

IndusCart is an e-commerce application with:

- A Vite + React frontend in [`frontend/`](./frontend/)
- An Express + Mongoose API in [`backend/`](./backend/)
- MongoDB for users, products, orders, and support tickets

## Current scope and limitations

- Signed-in customer carts and wishlists are stored in MongoDB; guest carts
    remain browser-local until login.
- COD is the only available checkout payment method. Online payment capture,
    refunds, and payment webhooks are not integrated.
- Admins can enter manual courier tracking details, but automatic provider
    booking and live carrier updates are not integrated.
- Product images are stored on the backend's local disk (or the Docker uploads
    volume). Multi-instance production hosting should move uploads to shared object
    storage before deployment.
- Catalog search, price filters, sorting, and pagination run server-side.

Additional documentation:

- [Customer Policy Drafts](./docs/PRIVACY_POLICY.md) — privacy, terms, and returns documents

Android APK support is included through Capacitor. Build the APK locally using
the steps in the [Android Guide](./docs/ANDROID_GUIDE.md).

## Prerequisites

- Node.js LTS and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

The local shopper portal runs on `http://localhost:3000`; the separate local
admin-only portal runs on `http://localhost:3001` and both use the API on
`http://localhost:5000`. `VITE_API_URL` in `frontend/.env` selects the API.
Product image files are persisted in
`backend/uploads/` and served by the API; keep that directory with the backend
when moving or deploying the application.

## First-time setup

From the repository root:

```powershell
cd backend
Copy-Item .env.example .env
notepad .env
npm ci

cd ..\frontend
Copy-Item .env.example .env
npm ci
```

Set `MONGO_URI` and `JWT_SECRET` in `backend/.env`. For a local MongoDB
installation, the default value is:

```env
MONGO_URI=mongodb://127.0.0.1:27017/induscart
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret
```

The application is intentionally database-provider neutral. The current
default remains local MongoDB, but moving later only requires changing
`MONGO_URI`; application routes and models do not change. MongoDB Atlas is the
easiest managed option, and any provider that supports a standard MongoDB
connection string can be used.

For a managed provider, replace only the URI in `backend/.env`:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/induscart
```

Do not commit that URI because it contains credentials. Whitelist the backend
server IP in the provider's network settings and create a database user with
access to the `induscart` database.

For production, also set a long random `JWT_SECRET` (at least 32 characters).
You may restrict browser access with comma-separated origins:

```env
NODE_ENV=production
JWT_SECRET=use-a-long-random-secret-here
CORS_ORIGINS=https://your-store.example,https://admin.your-store.example
```

Leave `CORS_ORIGINS` unset for the current local development and Wi-Fi setup.

For frontend development, set `VITE_API_URL` in `frontend/.env`. The committed
template defaults to `http://localhost:5000`; use the computer's LAN address
when testing from a phone.

## Run in development

For a no-command Windows start, see [`docs/START_HERE.md`](./docs/START_HERE.md)
and double-click `START-SHOPPER.cmd` or `START-ADMIN.cmd` in the repository
root. Both launchers share the existing frontend and API and reuse services
already running. `START-LOCAL.cmd` is the shared launcher underneath. Or open
two PowerShell windows to start services manually.

**Terminal 1 - API:**

```powershell
cd "C:\Users\ZS computers\Documents\e-commerce\backend"
npm run dev
```

**Terminal 2 - frontend:**

```powershell
cd "C:\Users\ZS computers\Documents\e-commerce\frontend"
npm start
```

Open <http://localhost:3000>. The API health response is available at
<http://localhost:5000/>.

## Create the first admin user

With `backend/.env` configured and MongoDB running, set the credentials only in
your current terminal session:

```powershell
cd backend
$env:ADMIN_NAME="Store Admin"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="use-a-strong-password-here"
npm run admin:bootstrap
```

The bootstrap command never prints the password, refuses to overwrite an
existing account, and does not store credentials in source control. Sign in at
`/admin/login` (or choose the shield icon on the storefront home page). Shopper
login at `/login` cannot issue administrator sessions.

If the existing administrator password is unknown, reset it without exposing
it in source control:

```powershell
cd backend
$env:ADMIN_EMAIL="admin@induscart.com"
$env:ADMIN_PASSWORD="use-a-new-strong-password-here"
npm run admin:reset-password
```

## COD and courier settings

Admins can open the **Settings** tab in `/admin` to:

- Enable or disable Cash on Delivery
- Choose a flat PKR COD fee or a percentage fee
- Set an optional PKR order threshold above which COD is free
- Select PostEx, Trax, TCS, or Leopards and save the provider API key

Checkout reads the public COD settings and hides COD when it is disabled.
Orders apply the configured COD fee on the server. Courier dispatch is protected
behind the selected provider and only runs when the provider credentials are
configured; unsupported or unconfigured providers are safely skipped.

## Mobile testing on the same Wi-Fi

The app can be opened on a phone without a domain. Connect the phone and
computer to the same Wi-Fi, find the computer IPv4 address with `ipconfig`,
then configure the frontend with the backend computer address:

```env
# frontend/.env
VITE_API_URL=http://YOUR_COMPUTER_IP:5000
```

Start both services so they listen on the network:

```powershell
# Terminal 1
cd "C:\Users\ZS computers\Documents\e-commerce\backend"
npm.cmd run dev

# Terminal 2
cd "C:\Users\ZS computers\Documents\e-commerce\frontend"
npm.cmd start -- --host 0.0.0.0
```

Open this single link on the phone (replace the IP if yours differs):

<http://YOUR_COMPUTER_IP:3000>

If Windows Firewall blocks the phone, run PowerShell as Administrator and allow
TCP ports 3000 and 5000. Both terminals must remain open while testing.

## Application guide

### Customer journey

1. Open the shop and choose Pakistan (PKR) or International (USD) mode.
2. Search, filter by category, or browse the product collection.
3. Open a product to review its gallery, description, stock, market visibility,
   delivery information, and price.
4. Add the desired quantity to the cart.
5. Complete the address and payment steps at checkout.
6. Track the order from the Orders page.

### Admin journey

1. Sign in through `/login` with an administrator account.
2. Use Dashboard for revenue, orders, inventory, and market summaries.
3. Use Products to edit or remove existing products.
4. Use Add Product to upload up to five images and set category, prices,
   subcategory, brand, model, colours, sizes/variants, stock, weight,
   description, shop visibility, and Pakistan/global visibility.
5. Use Orders to update fulfillment status.
6. Use Settings to configure COD and courier provider settings.

### Data and uploads

Products, users, orders, and settings are stored in MongoDB. Uploaded files are
stored in `backend/uploads/` and product records store their filenames. When
moving the project to another computer, move both the MongoDB data and the
`backend/uploads/` directory, or replace local uploads with cloud storage
before production deployment.

## Automated testing coverage

This project now includes a layered QA setup to cover the main risk areas without
rewriting the app:

- Backend unit tests for pricing, environment/password validation, order-status
    transitions, and image-signature checks
- Integration tests for API health and routing behavior using the real Express app
- UI and text tests for the React storefront and navigation state
- Browser smoke tests with Selenium for end-to-end verification of a loaded page
- Manual QA documentation for desktop, mobile, and admin flows

The testing additions are kept close to the existing app structure and build
setup so they can be expanded later without changing the business logic.

### Frontend test commands

```powershell
cd frontend
npm test
npm run test:watch
npm run test:ui
```

### Backend test commands

```powershell
cd backend
npm test
npm run test:integration
npm run test:selenium
```

### Browser and mobile smoke checklist

- Open the UI on localhost and verify the home page loads and the expected text is visible.
- Confirm login, registration, cart, and order navigation redirect correctly.
- Validate the admin route is protected when no user is signed in.
- Repeat the same flow on a mobile browser using the LAN IP from the local run guide.

## Docker Compose

Docker Desktop can run the API, frontend, and MongoDB together without changing
the application code:

```powershell
docker compose up --build
```

Open <http://localhost:3000>. The API is available at
<http://localhost:5000/health/ready>. MongoDB data and uploaded product files
are stored in named Docker volumes. Stop the stack with `Ctrl+C`, or use
`docker compose down`; do not add `-v` unless you intentionally want to delete
the database and uploads. Compose reads `JWT_SECRET`, and optionally
`DOCKER_MONGO_URI`, `VITE_API_URL`, and `CORS_ORIGINS`, from the root `.env`.

## Automated checks

Run these before sharing a build or deploying:

```powershell
cd backend
npm ci
npm run check
npm test

cd ..\frontend
npm ci
npm run check
```

## Android APK

Install Android Studio, an Android SDK, Java 21, and ensure Android SDK tools
are available for local APK generation.
From `frontend/`, configure `VITE_API_URL` to a backend URL reachable by the
phone, then run:

```powershell
npm run android:build
```

The debug APK is created at:

```text
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

For a Play Store bundle, create a private signing keystore and copy
`frontend/android/keystore.properties.example` to
`frontend/android/keystore.properties`. Then run:

```powershell
npm run android:release
```

The signed bundle is created at:

```text
frontend/android/app/build/outputs/bundle/release/app-release.aab
```

The keystore and `keystore.properties` are ignored by Git. Keep multiple
encrypted backups of the keystore and its passwords; Google Play updates must
continue using the same signing identity.

The Android project is generated from the web build and is not required for
normal browser development. Build it locally by following the
[Android Guide](./docs/ANDROID_GUIDE.md).

### Database backup and migration

Install the MongoDB Database Tools once so `mongodump` and `mongorestore` are
available in PowerShell. Then run:

```powershell
cd backend
npm run db:backup
```

The backup is written to `backend/backups/` and is ignored by Git. To restore a
backup into whichever MongoDB URI is currently configured:

```powershell
npm run db:restore -- .\backups\YOUR_BACKUP_FOLDER
```

Migration to a cheaper or managed MongoDB-compatible provider is therefore:

1. Run `npm run db:backup` while the old database is configured.
2. Change only `MONGO_URI` in `backend/.env`.
3. Run `npm run db:restore -- .\backups\YOUR_BACKUP_FOLDER`.
4. Copy `backend/uploads/` to the new backend host, or configure cloud storage.
5. Start the backend normally.

The frontend, routes, models, admin panel, and existing local setup remain
unchanged.

### Dynamic catalog behavior

The shop only displays categories and subcategories that are present on visible
products. Admin can type a completely new category or subcategory; it does not
need to exist in a preset list. If a subcategory is left blank, the product
still uses its main category normally. Brand, model, colour, and size/variant
values are optional and appear on product cards, detail pages, and cart items
when provided.

Products can be hidden from the shop without deleting them. Hidden products
remain available in the Admin Products list and can be made visible again with
the **Show this product in the shop** control.

### Frontend structure

The admin area keeps page-level state and screen composition in
`frontend/src/pages/AdminPage.jsx`. Shared admin configuration is kept in
`frontend/src/pages/admin/adminConfig.js`, while reusable controls such as
status badges, market selectors, image upload previews, category selection,
and toast notifications are in
`frontend/src/pages/admin/AdminPrimitives.jsx`. New admin controls should be
added to the primitives module when they are reused; page-specific data
loading and mutations should remain in the page or a dedicated hook.

Admin HTTP operations are isolated in
`frontend/src/pages/admin/adminApi.js`. This keeps endpoint paths, multipart
form construction, and API error extraction out of the UI markup and makes
future automated testing or endpoint changes safer.

Admin sections use browser history routes:

```text
/admin
/admin/products
/admin/add
/admin/orders
/admin/settings
```

The last opened admin section is remembered only in that browser's local
storage, so reopening the admin panel returns to the same workspace on that
device. No device fingerprint or personal device information is collected.
Browser Back and Forward navigate between admin sections normally.

### Cart and order integrity

Cart quantity, removal, and updates identify an item by product plus its
selected colour and size/variant. This prevents two variants of the same
product from changing each other. Order items also persist those selections.
The cart itself is browser-local: it persists in that browser's local storage,
does not sync between devices, and is removed if that browser's site data is
cleared.
When an order is submitted, the backend re-checks product visibility, stock,
variant availability, quantity, and the database price instead of trusting
values sent by the browser.

### Configuration reference

| Variable | Location | Purpose |
|---|---|---|
| `MONGO_URI` | `backend/.env` | MongoDB connection string |
| `PORT` | `backend/.env` | API port, normally `5000` |
| `JWT_SECRET` | `backend/.env` | Secret used to sign sessions |
| `VITE_API_URL` | `frontend/.env` | Backend URL used by browser API/image requests |

## Useful commands

```powershell
# Frontend production build
cd frontend
npm run build

# Backend without automatic restart
cd ..\backend
npm start
```

Do not commit `backend/.env`; it is ignored by Git. When the frontend is opened
from another PC, create `frontend/.env` before building/running it and point
the browser to the backend machine's reachable address:

```env
VITE_API_URL=http://YOUR_COMPUTER_IP:5000
```

The same `VITE_API_URL` is used for API calls and `/uploads/...` image URLs, so
images do not incorrectly resolve to the viewer's own `localhost`. Ensure the
backend port is reachable through the host firewall and that `backend/uploads/`
and the MongoDB database are persisted/shared with the backend deployment.
