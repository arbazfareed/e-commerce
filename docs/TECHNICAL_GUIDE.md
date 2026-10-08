# IndusCart Technical Guide

## 1. System overview

IndusCart is split into two applications:

- `frontend/`: React 18 and Vite storefront/admin interface.
- `backend/`: Express API, Mongoose models, authentication, orders, support,
  settings, uploads, backups, and courier configuration.
- MongoDB stores users, products, orders, support tickets, and settings.

The frontend calls the backend through `VITE_API_URL`. The backend reads
`MONGO_URI`, `JWT_SECRET`, `PORT`, and optional `CORS_ORIGINS`.

For the detailed source map, module responsibilities, and patterns currently
used in the code, see the [Code Organization Guide](./CODE_ORGANIZATION.md).

## 2. Main technology

| Area | Technology |
|---|---|
| UI | React 18 |
| Routing | React Router 6 |
| Frontend build | Vite |
| API | Express 5 |
| Database access | Mongoose |
| Database | MongoDB-compatible provider |
| Authentication | JWT and bcrypt |
| Uploads | Multer and `backend/uploads/` |
| Container runtime | Docker Compose |
| Web server | Nginx for the production frontend container |
| Validation | Local npm checks and manual QA |

## 3. Important request flow

1. A browser loads the Vite-built React application.
2. React sends API requests to `VITE_API_URL`.
3. Express validates authentication and request data.
4. Mongoose reads or updates MongoDB.
5. Product images are served from `/uploads`.
6. The server, not the browser, rechecks product price, visibility, stock, and
   variants when an order is placed.

## 4. Security and data protection

- JWT secrets are required at startup.
- Staging and production require a unique secret of at least 32 characters.
- CORS can be restricted with `CORS_ORIGINS`.
- JSON request bodies are limited to 1 MB.
- Hidden products are excluded from customer-facing catalog routes.
- Admin credentials are created through the environment-driven
  `npm run admin:bootstrap` command.
- Default hardcoded admin scripts were removed.
- Database backup and restore scripts are available in `backend/scripts/`.

## 5. Local development

Create `backend/.env` and `frontend/.env` from their `.env.example` files.
Then run:

```powershell
cd backend
npm ci
npm run dev
```

In a second terminal:

```powershell
cd frontend
npm ci
npm start
```

Use `http://localhost:3000`.

## 6. Automated validation

```powershell
cd backend
npm run check
npm test

cd ..\frontend
npm run check
```

The backend tests cover environment validation and API live/readiness health
behavior. The frontend check produces a production build.

## 7. Docker deployment

Copy the root `.env.example` to `.env`, set a real `JWT_SECRET`, and run:

```powershell
docker compose up --build
```

Compose starts MongoDB, the backend, and Nginx-served frontend. The named
`mongo_data` and `uploads_data` volumes persist database records and images.
`docker compose down -v` deletes those volumes and must not be used casually.

Health endpoints:

- `/health/live`: process is running.
- `/health/ready`: process is running and MongoDB is connected.

## 8. Known limitations and next production work

- Docker Desktop is required to execute Compose locally.
- Product uploads are local files; production should use object storage such as
  S3-compatible storage or Cloudinary.
- Payment and courier providers need real production credentials.
- HTTPS, domain DNS, monitoring, and alerting should be completed before taking
  real payments. Admin login has a five-failure-per-IP limiter, but its store is
  process-local; use a shared store and trusted proxy configuration when scaling.
- The frontend build still reports a non-blocking large-bundle warning.

## 9. Full source map and UML guide

The implementation-based, GitHub-renderable diagrams are maintained in
[`UML_DIAGRAMS.md`](./UML_DIAGRAMS.md). They include the repository/package map,
frontend route and guard structure, backend layers and authorization, actual
Mongo relationships, checkout/order lifecycle, and customer password-reset
email and role-separated admin-login lifecycles. Start with sections 17–27 for
the detailed source map and flows; sections 1–16 preserve the original UML
views.

For a practical "where should this change go?" map and examples of the
feature-oriented, component-composition, layered-request, and pure-domain
function patterns used by the implementation, see
[`CODE_ORGANIZATION.md`](./CODE_ORGANIZATION.md).

| Source area | Files matched | Main contents |
|---|---:|---|
| `backend/**/*.{js,json,md}` | 68 | Express entry point, config, routes, controllers, middleware, Mongoose models, services, utilities, scripts, tests and manifests |
| `frontend/src/**/*.{js,jsx,ts,tsx,css}` | 100 | Router, pages, shared components, contexts, API/domain utilities, styles and tests |

These are scoped workspace file counts, not LOC counts, checked on
2026-10-08. Backend counts exclude `node_modules`, backups, and uploads;
frontend counts include only the listed source extensions under `frontend/src`.
Generated builds, Android intermediates, and binary assets are excluded. For a
module-by-module map, see [`CODE_ORGANIZATION.md`](./CODE_ORGANIZATION.md); for
requirements-level models, see [`SRD.md`](./SRD.md); for deployment and system
overview, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).
