# IndusCart Project Showcase

IndusCart is more than a product list: it includes a customer storefront, a
protected admin workspace, local and international pricing, order controls,
support tools, Docker deployment, and an Android wrapper.

## Product at a glance

| Experience | What users can do |
|---|---|
| Storefront | Browse, search, filter, sort, and view visible products |
| Market modes | Shop in Pakistan/PKR mode or international/USD mode |
| Product details | Review images, variants, stock, descriptions, and delivery information |
| Cart and checkout | Select quantities and variants, review totals, address, and payment method |
| Customer account | Register, sign in, verify a session, and view orders |
| Admin workspace | Manage products, inventory, visibility, orders, analytics, settings, and support |
| Mobile | Open the responsive website on a phone or package it with Capacitor for Android |

## Customer journey

```mermaid
journey
    title IndusCart customer journey
    section Discover
      Open the storefront: 5: Customer
      Choose local or global market: 4: Customer
      Search and filter products: 5: Customer
    section Decide
      View product details and variants: 5: Customer
      Add selected item to cart: 5: Customer
      Review cart totals: 4: Customer
    section Order
      Sign in or register: 4: Customer
      Enter delivery details: 4: Customer
      Submit order: 4: Customer
      Track order status: 4: Customer
```

## Admin journey

```mermaid
flowchart LR
    Login[Sign in] --> Dashboard[Dashboard]
    Dashboard --> Products[Products]
    Dashboard --> Add[Add product]
    Dashboard --> Orders[Orders]
    Dashboard --> Settings[Store settings]
    Dashboard --> Support[Support]
    Products --> Visibility[Show or hide products]
    Products --> Variants[Manage stock and variants]
    Add --> Images[Upload up to five images]
    Orders --> Status[Update fulfillment status]
    Orders --> Analytics[Review sales analytics]
    Settings --> COD[Configure COD]
    Settings --> Courier[Configure courier provider]
```

## Routes worth knowing

| Route | Audience | Purpose |
|---|---|---|
| `/` | Everyone | Storefront and product discovery |
| `/login` | Everyone | Sign in |
| `/register` | Everyone | Create an account |
| `/cart` | Customer | Review cart and begin checkout |
| `/orders` | Customer | View customer orders and manually supplied shipment tracking details |
| `/support` | Customer | Contact support and review help content |
| `/admin` | Admin | Dashboard and management workspace |
| `/admin/products` | Admin | Catalog and visibility management |
| `/admin/add` | Admin | Create a product with images and variants |
| `/admin/orders` | Admin | Review and update fulfillment |
| `/admin/settings` | Admin | COD, courier, shipping, and store configuration |

Protected routes redirect unauthenticated users to `/login`; admin routes also
require an administrator account.

## Capabilities that are easy to miss

- **Two-market catalog:** products can be Pakistan-only or globally visible,
  while the storefront switches between PKR and USD presentation. International
  mode intentionally hides Pakistan-only products even when All Products is
  selected.
- **Dynamic taxonomy:** administrators can create new categories and
  subcategories without editing source code.
- **Variant-safe cart:** colour and size/variant selections remain separate,
  so two variants of one product cannot overwrite each other. Cart data is
  stored in the current browser, not synchronized across devices.
- **Recently viewed stays useful:** active category/search filters do not erase
  browsing history; deleted or hidden products are excluded.
- **Server-side order protection:** the API rechecks visibility, stock,
  variants, and database prices during checkout instead of trusting browser
  values.
- **Product lifecycle controls:** products can be hidden from customers without
  deleting their records.
- **Configurable COD:** administrators can enable COD, set flat or percentage
  fees, and define a free-COD threshold. International threshold currency
  handling remains a known policy gap.
- **Payment honesty:** non-COD methods are order metadata until a real gateway
  captures payment; orders expose a separate payment status.
- **Courier status visibility:** admins can enter a carrier, tracking number,
  and secure tracking link for customers. This is manual reference data; carrier
  booking, labels, and live tracking events still require an API adapter.
- **Server-backed support:** guests/customers can submit tickets and admins can
  reply or update status through the Mongo-backed support API.
- **Safer product uploads:** the API enforces five JPG/JPEG/PNG/WEBP images,
  5 MiB each, with extension/MIME/signature checks.
- **Operational analytics:** the admin area includes revenue, order, inventory,
  market, and sales analytics views.
- **Persistent local media:** product uploads are served by the backend and can
  be persisted with the Docker `uploads_data` volume; shared object storage is
  recommended before multi-instance production deployment.
- **Health endpoints:** `/health/live` checks process availability and
  `/health/ready` checks database readiness.
- **Database portability:** changing `MONGO_URI` moves the app between local
  MongoDB and compatible managed providers.
- **Android reuse:** Capacitor packages the same React storefront rather than
  maintaining a separate mobile codebase.

## Where to explore the implementation

- Frontend routes and composition: `frontend/src/App.jsx`
- Customer storefront: `frontend/src/pages/HomePage.jsx`
- Admin workspace: `frontend/src/pages/AdminPage.jsx`
- API entry point: `backend/server.js`
- API routes: `backend/routes/`
- Database models: `backend/models/`
- API security: `backend/middleware/authMiddleware.js`
- Docker runtime: `docker-compose.yml`
- Architecture diagrams: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- UML views: [`UML_DIAGRAMS.md`](./UML_DIAGRAMS.md)
- Implemented/partial/missing functionality: [`FEATURE_COVERAGE.md`](./FEATURE_COVERAGE.md)

## Recommended GitHub reading order

1. [`README.md`](../README.md) for setup and common commands.
2. [`DOCUMENTATION_INDEX.md`](./DOCUMENTATION_INDEX.md) for the document map.
3. [`SRD.md`](./SRD.md) for requirements and release status.
4. [`ARCHITECTURE.md`](./ARCHITECTURE.md) for system diagrams.
5. [`API_REFERENCE.md`](./API_REFERENCE.md) for implemented backend routes.
6. [`USER_GUIDE.md`](./USER_GUIDE.md) for customer and admin workflows.
7. [`LOCAL_RUN_GUIDE.md`](./LOCAL_RUN_GUIDE.md) for browser, phone, and APK use.
8. [`PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) before a public launch.
