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
| `/orders` | Customer | View customer orders |
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
  while the storefront switches between PKR and USD presentation.
- **Dynamic taxonomy:** administrators can create new categories and
  subcategories without editing source code.
- **Variant-safe cart:** colour and size/variant selections remain separate,
  so two variants of one product cannot overwrite each other.
- **Server-side order protection:** the API rechecks visibility, stock,
  variants, and database prices during checkout instead of trusting browser
  values.
- **Product lifecycle controls:** products can be hidden from customers without
  deleting their records.
- **Configurable COD:** administrators can enable COD, set flat or percentage
  fees, and define a free-COD threshold.
- **Operational analytics:** the admin area includes revenue, order, inventory,
  market, and sales analytics views.
- **Persistent media:** product uploads are served by the backend and can be
  persisted with the Docker `uploads_data` volume.
- **Health endpoints:** `/health/live` checks process availability and
  `/health/ready` checks database readiness.
- **Database portability:** changing `MONGO_URI` moves the app between local
  MongoDB and a compatible managed provider.
- **Android reuse:** the Capacitor app packages the same React storefront
  instead of maintaining a separate mobile codebase.

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

## Recommended GitHub reading order

1. [`README.md`](../README.md) for setup and common commands.
2. [`ARCHITECTURE.md`](./ARCHITECTURE.md) for system diagrams.
3. [`USER_GUIDE.md`](./USER_GUIDE.md) for customer and admin workflows.
4. [`LOCAL_RUN_GUIDE.md`](./LOCAL_RUN_GUIDE.md) for browser, phone, and APK use.
5. [`PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) before a public launch.
