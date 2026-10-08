# IndusCart Code Organization Guide

This guide explains where application behavior lives, how the frontend and
backend are divided, and which patterns to follow when adding or changing a
feature. It describes the repository as it is implemented; it is not a claim
that every module is already small or fully isolated.

## 1. How to use this guide

Start here when you need to find a screen, API operation, domain rule, or test.
Use the linked documents for the authoritative details in each area:

| Question | Source of truth |
|---|---|
| What does the product promise to do? | [Software Requirements Document](./SRD.md) |
| How does a customer or admin use it? | [User Guide](./USER_GUIDE.md) |
| Which API routes and fields exist? | [API Reference](./API_REFERENCE.md) |
| How do services and data flow between layers? | [Architecture](./ARCHITECTURE.md) |
| How can behavior be verified? | [Testing Guide](./TESTING_GUIDE.md) |
| How is the project run or deployed? | [Local Run Guide](./LOCAL_RUN_GUIDE.md), [Production Deployment](./PRODUCTION_DEPLOYMENT.md) |

## 2. Repository map

```text
backend/
  server.js                 Express setup, middleware, route mounting, health
  config/                   Environment, database, and secret-vault setup
  routes/                   HTTP paths, middleware, and controller binding
  controllers/              Request handling and application workflows
  models/                   Mongoose schemas and persistence rules
  services/                 External integrations, such as email and couriers
  utils/                    Reusable domain calculations and validation helpers
  middleware/               Authentication, upload checks, and metrics
  scripts/                  Admin bootstrap/reset and database backup/restore
  test/                     Node.js unit and API integration tests
  uploads/                  Local product-image files

frontend/src/
  App.jsx                   Route composition and route guards
  components/               Shared UI; larger components may have focused files
  context/                  App-wide authentication and cart state
  pages/                    Route-level screens
    admin/                  Admin sections, shared controls, API, and styles
      dashboard/            Focused dashboard panels
    cart/                   Cart screen composition and styles
    home/                   Storefront sections and styles
    register/               Registration form and styles
    support/                Admin/customer support screens and ticket cards
  utils/                    Shared API configuration and domain helpers
  tests/                    Vitest and Testing Library regression tests

docs/                       Requirements, architecture, operations, QA, and guides
```

## 3. Frontend boundaries

### Routes and shared state

- [`frontend/src/App.jsx`](../frontend/src/App.jsx) selects the shopper,
  admin-only, or shared portal routes and applies the route guards.
- [`frontend/src/context/AuthContext.jsx`](../frontend/src/context/AuthContext.jsx)
  owns the signed-in user and authentication actions.
- [`frontend/src/context/CartContext.jsx`](../frontend/src/context/CartContext.jsx)
  owns shared cart behavior.
- [`frontend/src/utils/axiosConfig.js`](../frontend/src/utils/axiosConfig.js)
  configures the API client and related URL behavior.

### Feature composition

Route-level files remain the entry points, with focused UI modules grouped by
feature where that makes the screen easier to understand:

| Feature entry point | Focused modules |
|---|---|
| `pages/HomePage.jsx` | `pages/home/` |
| `pages/CartPage.jsx` | `pages/cart/` |
| `pages/RegisterPage.jsx` | `pages/register/` |
| `pages/SupportPage.jsx` | `pages/support/` |
| `pages/AdminPage.jsx` | `pages/admin/` and `pages/admin/dashboard/` |
| `components/Navbar.jsx` | `components/navbar/` |
| `components/ProductCard.jsx` | `components/productCard/` |

The admin page coordinates shared data and navigation; section components own
the markup for dashboard, products, adding products, orders, settings, and
support. The dashboard's inventory, revenue, order-status, market-split,
performance, recommendations, and regional-campaign views are split into
focused modules under `pages/admin/dashboard/`.

### API and domain helpers

Use the configured API client rather than creating unrelated request defaults.
Admin requests that are shared by admin sections are grouped in
`pages/admin/adminApi.js`. Feature-specific screens may keep their own request
calls when that is the established boundary.

Keep reusable calculations and normalization separate from JSX when they
represent domain rules. Examples include:

- `frontend/src/utils/currencyUtils.js` and `shippingUtils.js`
- `frontend/src/utils/supportUtils.js`
- `backend/utils/zoneShipping.js`
- `backend/utils/salesAnalytics.js` and `orderStatus.js`

## 4. Backend request flow

The typical API path is:

```text
HTTP request
  -> backend/server.js middleware and mounted route
  -> backend/routes/<feature>Routes.js
  -> backend/controllers/<feature>Controller.js
  -> backend/models/<Domain>.js and/or backend/services/<integration>.js
  -> JSON response
```

Not every endpoint needs every layer. A small pure calculation belongs in a
utility; an external provider integration belongs in a service; HTTP-specific
status codes and request/response handling belong at the route/controller
boundary. Keep authentication and authorization enforced on the server even
when a frontend route is hidden.

## 5. Patterns used in this repository

These are pragmatic patterns already visible in the code, not a mandate to
introduce a framework or a formal design-pattern hierarchy:

| Pattern | How it is used | Example |
|---|---|---|
| Layered request handling | Routes bind HTTP paths, controllers handle requests, models persist data, and selected services integrate external systems. | `backend/routes/`, `controllers/`, `models/`, `services/` |
| Feature-oriented decomposition | Related screens and supporting modules are kept together by product area. | `frontend/src/pages/admin/dashboard/`, `pages/cart/`, `pages/support/` |
| Component composition | A route-level screen composes smaller display and interaction components. | `HomePage.jsx`, `CartPage.jsx`, `AdminDashboard.jsx` |
| Shared application context | State that is needed across routes is exposed through React context. | `AuthContext.jsx`, `CartContext.jsx` |
| Pure domain functions | Calculations and normalization can be tested without rendering a screen or starting an HTTP server. | `currencyUtils.js`, `zoneShipping.js`, `orderStatus.js` |
| Shared API client / feature API helpers | Common request configuration is centralized; related admin operations have named functions. | `axiosConfig.js`, `pages/admin/adminApi.js` |

For a new feature, extend the closest existing pattern first. Avoid adding
global state, another API client, or extra abstraction layers unless the new
behavior actually requires them.

## 6. Where to make a change

| Change | Preferred location |
|---|---|
| Add or change a URL or access guard | `frontend/src/App.jsx` |
| Change shared shopper/admin identity or cart behavior | `frontend/src/context/` |
| Change a feature screen | Its route-level page or focused feature module |
| Change a shared visual component | `frontend/src/components/` |
| Add an admin API operation used by multiple admin modules | `frontend/src/pages/admin/adminApi.js` |
| Add frontend currency, shipping, or support logic | `frontend/src/utils/` or the feature helper already in use |
| Add an API endpoint | `backend/routes/`, then its controller and model/service as required |
| Add a business calculation | A focused backend utility with direct unit tests |
| Change request validation, identity, or permissions | Backend middleware/controller, with API tests |
| Change environment or persistence setup | `backend/config/` and the corresponding environment documentation |
| Change expected behavior | Update the closest regression test and relevant requirement/user/API document |

### Change checklist

1. Trace the current route or API behavior before moving code.
2. Keep rendering, HTTP transport, persistence, and domain calculations in the
   boundaries used by adjacent features.
3. Preserve URL, request/response, and persisted-data compatibility unless a
   behavior change is explicitly intended.
4. Add a regression test for the behavior changed, not just for the new helper.
5. Update the relevant source document and this guide if module ownership or
   architecture changes.

## 7. Validation commands

Run commands from the relevant package directory:

```powershell
# Backend
cd backend
npm run check
npm test

# Frontend
cd ..\frontend
npm test
npm run build
```

The backend check runs Node syntax checks; backend tests use Node's built-in
test runner. Frontend tests use Vitest, and the production build uses Vite.
Use focused test files during iteration, then run the complete applicable
suite before merging. See the [Testing Guide](./TESTING_GUIDE.md) for coverage
and manual checks.

## 8. Current boundaries and limitations

- `AdminPage.jsx` remains the admin workspace coordinator. Its cross-section
  state and routing have not all been moved into independent state containers.
- Some feature pages make API requests directly through the shared API client;
  not every request has a separate service module.
- The backend is a modular monolith, not a set of independently deployed
  services.
- The folder layout is intended to make responsibilities easier to locate.
  It does not imply that every file has the same size or level of isolation.

Treat this guide as an implementation map. Update it when module ownership,
route composition, or request boundaries change.
