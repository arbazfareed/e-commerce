# IndusCart User Guide

## What this project is

IndusCart is an online shop with a customer website and a private admin
workplace. Customers can browse products, choose variants, add items to a
cart, place orders, and track them. Admins can manage the catalog, orders,
store settings, and support.

For implementation status, phase IDs, technical evidence, and the future-work
list, see the [Phased Delivery Plan](./PROJECT_DELIVERY_PLAN.md).

## What changed from the earlier version

Before the improvements, the project had more manual setup, less responsive
mobile behavior, hardcoded admin setup information, and no complete automated
deployment path.

Now it has:

- A responsive storefront and admin panel.
- A mobile menu that stays separated from the IndusCart heading.
- Dynamic categories and subcategories.
- Brand, model, colour, size, stock, visibility, and market fields.
- Product details, sorting, filtering, cart variants, and order validation.
- COD and courier settings.
- Secure environment-based admin creation.
- MongoDB backup and restore commands.
- Docker Compose support.
- Health checks and local validation commands.

## How a normal person runs it

### Option A: normal development mode

1. Install Node.js LTS and MongoDB.
2. Copy the backend environment template to `backend/.env`.
3. Copy the frontend environment template to `frontend/.env`.
4. Open one terminal and start the backend.
5. Open another terminal and start the frontend.
6. Open `http://localhost:3000` in a browser.

The exact commands are:

```powershell
cd backend
npm ci
npm run dev
```

Second terminal:

```powershell
cd frontend
npm ci
npm start
```

### Option B: Docker Desktop

1. Install Docker Desktop.
2. Copy the root `.env.example` to `.env`.
3. Put a long private value in `JWT_SECRET`.
4. Run `docker compose up --build`.
5. Open `http://localhost:3000`.

To stop it, press `Ctrl+C`. Do not use `docker compose down -v` unless all
Docker database records and uploaded images may be deleted.

## How the admin works

An administrator selects the shield icon on the storefront home page or opens
`/admin/login` directly. The admin can:

- See dashboard totals.
- Add, edit, hide, and remove products.
- Define categories without changing source code.
- Add colours, sizes, brands, and models.
- Manage stock and market visibility.
- Review and update orders.
- Configure COD and courier settings.
- Enable or disable the international market.
- Review support information.

Create the first admin from the backend terminal:

```powershell
$env:ADMIN_NAME="Store Admin"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="use-a-strong-password-here"
npm run admin:bootstrap
```

Shopper accounts use `/login`; that endpoint cannot issue an administrator
session. The administrator login uses a separate API endpoint, verifies the
account's admin role on the server, and applies a stricter failed-login limit.

## What happens when code is shared with another developer

The other developer should:

1. Read this guide and `TECHNICAL_GUIDE.md`.
2. Install dependencies with `npm ci` in both application folders.
3. Create private `.env` files from the examples.
4. Run the backend checks and frontend build.
5. Use the health endpoints to confirm API availability.
6. Review the architecture and release documentation before sharing changes.

The code structure, package manifests, environment examples, tests, Docker
files, and README give an automated tool enough information to identify the
stack, install dependencies, build the frontend, run backend tests, and inspect
deployment configuration. Secrets and local database contents are deliberately
not included in the repository.

## What is working now

- Local development mode.
- Responsive customer and admin interfaces.
- MongoDB-backed catalog and order flow.
- Local network/mobile testing.
- Docker Compose configuration.
- Backend health/readiness checks.
- Backend automated tests.
- Frontend production build.
- Local backend checks and frontend production builds.

## What is not included yet

- A hosted public domain.
- A cloud image-storage account.
- Real payment gateway credentials.
- Real courier API credentials.
- Production HTTPS and monitoring.
- A production backup scheduler.

These are deployment and business-service decisions, not missing core
application features.

## Nontechnical handoff

The shopper and admin websites are separate local portals that share one API
and database. Customers can currently browse and place COD orders; administrators
can maintain products, inventory, orders, settings, analytics, and support.
Online payment capture, automatic courier booking, refunds, and a public
production deployment are not yet available. Review the phased plan before
promising a launch date or integration to customers.

## Technical handoff

Use `README.md` and `START_HERE.md` for local startup, `ARCHITECTURE.md` and
`UML_DIAGRAMS.md` for system behavior, and `TESTING_GUIDE.md` for validation.
Use private `.env` files for credentials. Before production, close the
deployment and security gates in `PRODUCTION_DEPLOYMENT.md`; do not treat local
build/test success as production sign-off.
