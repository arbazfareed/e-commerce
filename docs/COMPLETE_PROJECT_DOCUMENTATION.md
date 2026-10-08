# IndusCart Complete Project Documentation

**Status:** Full-stack e-commerce application for local development, LAN/mobile
testing, Docker deployment, and Capacitor Android builds.

## 1. Executive summary

IndusCart provides a React storefront and protected administration workspace
backed by an Express API and MongoDB. Customers can browse products, choose a
Pakistan or international market, manage cart variants, place orders, and view
order history. Administrators can manage products, stock, visibility, orders,
analytics, support, COD, courier settings, and store configuration.

The same frontend can run in a browser, inside Docker/Nginx, or as an Android
application through Capacitor.

## 2. Technology stack

| Layer | Technology |
|---|---|
| Customer/admin UI | React 18, React Router 6 |
| Development/build | Vite 5, npm |
| API | Node.js, Express 5 |
| Database | MongoDB through Mongoose |
| Authentication | JWT and bcrypt |
| Uploads | Multer and `backend/uploads/` |
| Containers | Docker Compose and Nginx |
| Mobile | Capacitor Android |
| Validation | Node test runner, Vitest, Selenium, manual QA |

## 3. Repository map

```text
backend/
  server.js                 Express setup, middleware, routes, health endpoints
  config/                   Environment, database, and secret configuration
  routes/                   HTTP route definitions
  controllers/              Request handling and application workflows
  models/                   MongoDB schemas and persistence rules
  services/                 Email and courier integrations
  utils/                    Domain calculations and reusable helpers
  middleware/               Authentication, upload checks, and metrics
  scripts/                  Admin bootstrap/reset and database backup/restore
  test/                     Node.js unit and API integration tests
  uploads/                  Local product-image storage
frontend/
  src/App.jsx               Route composition and access guards
  src/components/           Shared UI, with focused submodules where useful
  src/context/              Authentication and cart state
  src/pages/                Route-level screens and feature modules
    admin/dashboard/        Admin dashboard widgets
    cart/                    Cart sections and styles
    home/                    Storefront sections and styles
    register/                Registration modules
    support/                 Admin/customer support modules
  src/utils/                Shared API configuration and domain helpers
  src/tests/                Vitest and Testing Library regression tests
  android/                  Capacitor Android project
docs/                       Requirements, architecture, operations, QA, guides
docker-compose.yml          MongoDB, API, and frontend container stack
```

See the [Code Organization Guide](./CODE_ORGANIZATION.md) for the expanded
frontend/backend module map, request flow, design patterns, and guidance for
placing future changes.

## 4. Architecture

See [Architecture](./ARCHITECTURE.md) for Mermaid system, deployment,
request-flow, and data-model diagrams. See [Project Showcase](./PROJECT_SHOWCASE.md)
for customer/admin journeys and the route map.

The primary runtime flow is:

1. A browser or Android WebView loads the React application.
2. React calls the Express API using `VITE_API_URL`.
3. Protected routes validate a JWT and, for admin operations, administrator access.
4. Controllers validate business rules and read or write MongoDB models.
5. Product images are served from the backend upload directory.
6. Order creation rechecks server-side prices, stock, visibility, and variants.

## 5. Main features

### Customer features

- Product discovery, search, filtering, and sorting
- Pakistan/PKR and international/USD market modes
- Product images, descriptions, categories, brands, models, colours, and sizes
- Variant-aware cart quantity and removal behavior
- Guest COD checkout and signed-in customer checkout
- Promo coupons, account wishlist, and verified-purchase reviews
- Registration, login, session verification, and logout
- Order history, order tracking details, printable invoices, support, and
  responsive mobile layout
- Self-service password recovery by expiring email link

### Admin features

- Protected dashboard with sales and inventory summaries
- Product creation, editing, deletion, hiding, and image upload
- Dynamic categories and subcategories
- Stock and variant management
- Order review and fulfillment status updates
- Sales analytics and manual cash-sale records
- COD fee and threshold configuration
- Courier provider configuration
- Support ticket handling
- Coupon management and review moderation
- Manual shipment references, customer password-reset assistance, and
  spreadsheet-safe product/order exports

## 5.1 Requirements and acceptance examples

The implementation-level requirement IDs, full acceptance summaries, and
scope statuses are maintained in the [Software Requirements Document](./SRD.md).
The following requirements describe the current product boundary:

| Requirement area | Implemented behavior and acceptance boundary |
|---|---|
| Identity and access | Shopper and administrator sign-in are role-separated; protected API actions enforce JWT/admin authorization. Registration requires an eight-character password. |
| Product discovery | Public catalog supports search, categories/subcategories, price filters, sort, market selection, and pagination. Hidden products do not appear in public results. |
| Catalog administration | Admin can manage product content, visibility, stock, variants, price, discount dates, and image set. Image files must be JPG/JPEG/PNG/WEBP, signature-checked, at most five files and 5 MiB each. |
| Cart and checkout | Guest cart is browser-persisted; customer cart is account-persisted. Guest COD and authenticated checkout use API-reloaded products and server-calculated price, stock, variants, market eligibility, shipping, and fees. |
| Promotions | Coupon eligibility includes configured activity, currency, minimum, expiry, and usage limit. The order endpoint rechecks eligibility and usage. |
| Customer retention | Signed-in customers can maintain a wishlist. A review requires a delivered purchase and administrator moderation before public display. |
| Fulfillment | Order statuses are validated against the enum; cancellation restores stock only before shipment. Admin can record manual courier/tracking details, but no automated carrier dispatch is promised. |
| Payments | COD/cash status is represented. Gateway choices do not make payment capture, webhooks, refunds, or reconciliation available. |
| Support and recovery | Guest/customer tickets and admin reply/status workflows are persisted. Customer password reset uses a generic request response and a hashed, single-use 20-minute token when email is configured. |
| Administration and operations | Admin can inspect analytics/low-stock data, record manual cash sales, configure checkout settings, print authorized invoices, and export currently loaded order/product data to CSV. |
| Runtime and platforms | Browser storefront/admin, Docker Compose, health/metrics endpoints, backup/restore scripts, CI validation, and Capacitor Android packaging exist; production hosting/recovery objectives are not supplied by these features. |

### Use-case examples

The full use-case specifications (actors, preconditions, primary flow,
alternate/error flow, and postconditions) are in [`SRD.md`](./SRD.md), section
5.1. Examples of the intended acceptance behavior:

1. **Guest checkout:** Given a guest has a valid in-stock cart and COD is
   enabled, when the guest enters required contact/address data and places the
   order, then the API rechecks catalog prices, variants, stock, destination,
   coupons, shipping, and COD fees before persisting an order. Invalid data or
   unavailable stock creates no successful order.
2. **Admin inventory update:** Given an authenticated administrator, when the
   administrator edits stock or product visibility, then the change is saved,
   hidden items disappear from public results, and a later checkout uses the
   current database stock/price.
3. **Password recovery:** Given a customer requests a reset, when an eligible
   customer follows the emailed reset link within 20 minutes, then a valid new
   password is stored and the token cannot be reused. The public request
   response does not reveal whether the email exists.
4. **Verified product review:** Given a customer has a delivered order
   containing a product, when they submit one review for it, then the review
   awaits administrator moderation and is not public before approval.
5. **Manual shipment tracking:** Given an administrator records a courier,
   reference, and safe HTTPS tracking URL, then authorized customer order
   details can show those values; the system does not claim to have booked a
   shipment or received carrier updates.

### Non-functional requirements and measurable boundaries

These are repository-backed constraints, not guarantees of production uptime
or service levels. Unmeasured deployment targets are explicitly marked
**Not established** in [`SRD.md`](./SRD.md), section 7.

| Attribute | Current code-backed requirement |
|---|---|
| Configuration safety | `MONGO_URI` and `JWT_SECRET` are required. Staging/production reject JWT secrets shorter than 32 characters and known placeholders. |
| Request protection | Helmet headers; optional CORS origin allow-list; JSON body limit 1 MiB. |
| Abuse limits | General auth 30/IP/15 min; failed admin login 5/IP/15 min; password-reset request 5/IP/15 min. Rate-limit state is process-local. |
| Recovery token | Hashed at rest, single-use, expires after 20 minutes; public response is generic. |
| Image inputs | Admin-only JPG/JPEG/PNG/WEBP; both file metadata and binary signature are checked; max five per request and 5 MiB per image. |
| Catalog response size | Paginated filtered/search results default to 24 and are capped at 48 items per page. |
| Checkout integrity | API recalculates price/discount/shipping/fees and checks product visibility, market, variants, and stock before order creation. High-concurrency transaction/compensation behavior remains future work. |
| Health and metrics | Liveness route responds for the process; readiness returns 503 without MongoDB; Prometheus metrics endpoint is exposed. No uptime or latency SLA is configured. |
| Persistence | MongoDB and Docker named volumes persist data; backup/restore scripts exist. Off-host encrypted schedule, RPO/RTO, and restore-drill targets are not established. |
| Accessibility and compatibility | Responsive layouts and selected accessible-control tests exist. Full WCAG conformance and a complete browser/device matrix are not established. |
| Maintainability | Node test runner, Vitest, syntax/build checks, and CI exist. There is no configured coverage percentage gate. |

### Test coverage and execution

The complete test-by-test inventory, 30-case manual regression matrix, command
results template, and known coverage gaps are in the [Testing Guide](./TESTING_GUIDE.md).
Run these repository commands from PowerShell before release:

```powershell
cd backend
npm run check
npm test

cd ..\frontend
npm test
npm run build
```

These commands establish only the result of that run. Mongo-backed cases may
skip if MongoDB is unavailable, and the Selenium browser smoke test is
opt-in. A successful test suite does not certify payment capture, automated
courier booking, production availability, backup recovery, or complete
accessibility.

## 6. Configuration

Create private environment files from the committed examples.

### Backend: `backend/.env`

```env
MONGO_URI=mongodb://127.0.0.1:27017/induscart
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=replace-with-resend-api-key
EMAIL_FROM="IndusCart <no-reply@your-verified-domain.com>"
```

For production, use a unique JWT secret of at least 32 characters and configure
`CORS_ORIGINS`. Never commit credentials, database URIs containing passwords,
API keys, or signing keystores.
Customer password-reset emails require a Resend API key and a sender address
verified by Resend. The emailed link is single-use and expires after 20 minutes.

### Frontend: `frontend/.env`

```env
VITE_API_URL=http://localhost:5000
```

For a phone on the same Wi-Fi network, use the computer's LAN address instead
of `localhost`.

## 7. Local setup

```powershell
cd backend
Copy-Item .env.example .env
npm ci

cd ..\frontend
Copy-Item .env.example .env
npm ci
```

Run the API and frontend in separate terminals:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm start
```

Open `http://localhost:3000`. The API health endpoints are:

- `http://localhost:5000/health/live`
- `http://localhost:5000/health/ready`

For exact phone and Android instructions, see [Local Run Guide](./LOCAL_RUN_GUIDE.md).

## 8. Docker deployment

Set `JWT_SECRET` in the root `.env`, then run:

```powershell
docker compose up --build
```

Docker starts MongoDB, the API, and the Nginx frontend. The named volumes
`mongo_data` and `uploads_data` persist data. Do not use `docker compose down -v`
unless deleting all database records and uploads is intentional.

## 9. Android build

The Android app reuses the web frontend through Capacitor:

```powershell
cd frontend
npm run android:build
```

The debug APK is written to
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

For a signed release, configure `android/keystore.properties` privately and
follow [Android Guide](./ANDROID_GUIDE.md). GitHub Actions can build an
installable debug APK when the repository variable `VITE_API_URL` contains the
public HTTPS API URL.

## 10. Validation

Run checks locally before sharing a change:

```powershell
cd backend
npm run check
npm test

cd ..\frontend
npm test
npm run build
```

GitHub Actions runs backend syntax validation and tests plus frontend
tests/builds on pushes and pull requests. Test files are also kept for local
validation.
Pull requests from the same repository targeting `main` are configured for
squash auto-merge after required checks pass; fork pull requests are excluded.

For auto-merge to complete, enable **Allow auto-merge** in the repository's
GitHub settings and configure a `main` branch protection rule requiring the
checks **Backend validation** and **Frontend validation**. Keep required
reviews enabled if human approval is part of your release policy.

## 11. Security and operational requirements

- Use a long, unique production JWT secret.
- Restrict `CORS_ORIGINS` to trusted production domains.
- Put the API and website behind HTTPS before accepting real customers.
- Move product uploads to object storage for production scale.
- Use a managed MongoDB deployment with scheduled encrypted backups.
- Add monitoring for API errors, readiness failures, backups, and login abuse.
- Add a real payment provider only with server-side payment intents and webhook
  signature verification.
- Review the privacy, terms, and returns documents with qualified local advice.

## 12. Known limitations

- Payment-method selection is not the same as payment capture.
- Product uploads are local unless an object-storage migration is completed.
- Courier dispatch requires real provider credentials and an enabled adapter.
- Public hosting, HTTPS, monitoring, and scheduled backups are deployment work.
- The DOCX copy in the repository should be regenerated from this Markdown
  document when a DOCX export tool is available.

## 13. Future improvement roadmap

### Priority 1 — required for real customers

1. Add admin MFA/passkeys, a shared rate-limit store, trusted-proxy configuration,
  and security audit events. Current shopper/admin login endpoints are role-
  separated; admin throttling is process-local and IP-based, not distributed-
  attack protection.
2. Deploy the API to a public HTTPS host and set `VITE_API_URL` to it. Add a
  separate admin hostname only if operational isolation requires it; retain
  API role checks regardless of host or icon visibility.
3. Configure managed MongoDB backups, restore drills, monitoring, and alerts.
  Test backup restoration before storing real customer/order data.
4. Move product images from local disk to S3-compatible storage or Cloudinary
  before running multiple API instances.
5. Add a real payment provider with server-created intents, signed/idempotent
  webhooks, reconciliation, refunds, and order-cancellation rules.
6. Replace draft legal pages with reviewed local privacy, consumer, tax, and
  returns policies before taking real orders.

### Priority 2 — reliability and growth

1. Add API request validation with a schema library and consistent error codes.
2. Add pagination and database indexes for admin orders and analytics; product search/filter pagination is implemented.
3. Use MongoDB transactions (on a replica-set-capable deployment) or a tested
  idempotent compensation design for stock, coupon, and order writes; cover
  simultaneous last-item checkouts.
4. Add automated end-to-end checkout tests using a test payment provider and
  error tracking with sensitive-data filtering.
5. Add role-based admin permissions and an audit trail instead of relying only
  on one `isAdmin` flag.
6. Use a shared Redis-backed rate-limit store only when multiple API instances
  or cross-instance limits are required; avoid adding a cache/queue stack early.

### Priority 3 — product experience

1. Add abandoned-cart recovery and notifications; coupons, verified reviews, wishlists, invoices, low-stock alerts, and server-side product browsing are implemented.
2. Add courier tracking webhooks and customer delivery notifications.
3. Add image optimization, lazy loading, and CDN caching.
4. Add accessibility audits and localization beyond PKR/USD.
5. Define returns, refunds, warranty, tax, and dispute workflows before
  implementing them; model status ownership, eligibility, inventory effects,
  and payment-provider reconciliation explicitly.
6. Publish a signed Android release through Google Play after security review.

### Technology and cost decision rules

- Keep the React/Vite + Express monolith and MongoDB/Mongoose for the current
  product stage. A separate admin hostname is optional isolation, not a security
  substitute; do not split microservices without measured scaling/team needs.
- Keep MongoDB while the document model and existing team skills fit. Prefer
  indexes, backups, replica-set transactions, and query measurement before a
  database migration. Consider PostgreSQL only if relational reporting,
  accounting, or cross-entity constraints justify the migration cost.
- Treat local disk uploads as single-instance development storage. For
  multi-instance production, use S3-compatible storage/Cloudinary and account
  for image egress and backup retention.
- Build a monthly cost estimate from API compute, database/storage/backups,
  image storage/egress, domain/DNS, email/monitoring, payment transaction fees,
  courier charges, and CI/build minutes. Free/shared tiers may suit demos, but
  sleeping services, limited backups, and no SLA are not production readiness.
- Recheck provider pricing in the target region before launch; estimates change
  and payment/courier fees scale with orders. Set budget alerts and a monthly
  usage review instead of adopting Redis, Kubernetes, or a queue by default.

## 14. Documentation index

- [README](../README.md)
- [Project Showcase](./PROJECT_SHOWCASE.md)
- [Documentation Index](./DOCUMENTATION_INDEX.md)
- [Software Requirements Document](./SRD.md)
- [API Reference](./API_REFERENCE.md)
- [Architecture](./ARCHITECTURE.md)
- [Technical Guide](./TECHNICAL_GUIDE.md)
- [Code Organization Guide](./CODE_ORGANIZATION.md)
- [User Guide](./USER_GUIDE.md)
- [Local Run Guide](./LOCAL_RUN_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Android Guide](./ANDROID_GUIDE.md)
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md)
- [Release Checklist](./RELEASE_CHECKLIST.md)
- [Privacy Policy draft](./PRIVACY_POLICY.md)
- [Terms of Service draft](./TERMS_OF_SERVICE.md)
- [Returns and Refunds draft](./RETURNS_AND_REFUNDS.md)
