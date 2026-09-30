# IndusCart Software Requirements Document

**Version:** 1.0  
**Audit basis:** Repository implementation reviewed September 2026  
**Status:** Functional MVP / pre-production

## 1. Purpose

IndusCart is a Pakistan-focused e-commerce platform with an international
selling mode. It provides a customer storefront, account authentication,
variant-aware cart and checkout, order status tracking, support tickets, and a
protected administrator workspace.

This document defines the current scope, requirements, acceptance criteria,
constraints, and release gaps. A requirement marked **Implemented** is present
in the repository. **Partial** means the user interface or data model exists
but the complete external integration or operational behavior is missing.
**Planned** means it should not be presented as available functionality.

## 2. Goals and stakeholders

### Goals

1. Let customers discover visible products and place validated orders.
2. Support Pakistan/PKR and international/USD catalog presentation.
3. Give administrators control over catalog, inventory, orders, settings, and
   operational analytics.
4. Keep the same React application usable in browsers, Docker, and Android.
5. Protect prices, stock, authentication, and administrator operations on the
   server.

### Stakeholders

| Stakeholder | Primary needs |
|---|---|
| Customer | Discover products, select variants, order, track status, get support |
| Administrator | Manage products, stock, orders, settings, analytics, tickets |
| Fulfillment operator | Process order statuses, COD, shipping, and future courier dispatch |
| Business owner | Control market availability, pricing, policies, and integrations |
| Developer/maintainer | Run, test, document, deploy, back up, and recover the system |

## 3. Scope

### In scope

- Responsive React/Vite storefront and admin UI
- User registration, login, JWT session verification, and admin authorization
- Product catalog, categories, dynamic subcategories, images, variants, stock,
  visibility, discounts, and local/global market rules
- Server-side product search, price filters, sorting, and pagination
- Persistent guest cart and account-synced customer cart with product/color/size identity
- Guest COD checkout with contact details and authenticated account checkout
- Customer self-service, email-based password reset with a single-use expiring token
- Admin-managed promo coupons with server-side eligibility and usage verification
- Verified-purchase product reviews with administrator moderation
- Customer wishlist and printable invoices/packing slips
- Low-stock customer badges and administrator alerts
- Server-side order validation, zone shipping, COD fees, stock decrement, and
  order status lifecycle
- Customer and guest support tickets with admin replies/status updates
- Sales analytics and manual cash-sale recording
- MongoDB persistence, local uploads, Docker Compose, health checks, backups,
  Capacitor Android packaging, and GitHub validation/APK workflows

### Out of scope for the current release

- Real payment capture, webhooks, refunds, and payment reconciliation
- Real courier booking, labels, tracking, and delivery webhooks
- Automated returns/refunds workflow
- Email/SMS/push notifications beyond account recovery
- Public production hosting, object storage, monitoring, and legal sign-off
- Multi-vendor settlement and automated returns/refunds workflow

## 4. SRS visual models

These diagrams are intentionally based on the implemented repository. They use
GitHub-compatible Mermaid and should be updated when requirements or routes
change. UML guidance separates structural views such as class/component models
from behavioral views such as use case, activity, sequence, and state models;
the data-flow view below documents movement between actors, processes, and
stores.

### 4.1 Use-case view

```mermaid
flowchart LR
      Customer([Customer])
      Guest([Guest])
      Admin([Administrator])
      Courier([Future courier provider])
      Payment([Future payment provider])

      subgraph IndusCart[IndusCart system]
            Browse((Browse catalog))
            Account((Register / sign in))
            Cart((Manage cart))
            Order((Place and view orders))
            Support((Submit support ticket))
            Manage((Manage products and stock))
            Fulfill((Update order status))
            Analyze((View sales analytics))
            Configure((Configure COD and courier settings))
            Capture((Capture online payment))
            Dispatch((Book shipment and track delivery))
      end

      Guest --> Browse
      Guest --> Account
      Guest --> Support
      Customer --> Browse
      Customer --> Account
      Customer --> Cart
      Customer --> Order
      Customer --> Support
      Admin --> Manage
      Admin --> Fulfill
      Admin --> Analyze
      Admin --> Configure
      Payment -. planned integration .-> Capture
      Courier -. planned integration .-> Dispatch
```

`Capture` and `Dispatch` are deliberately shown as future integrations, not
as completed capabilities.

### 4.2 Checkout activity diagram

```mermaid
flowchart TD
      Start((Start)) --> Cart[Customer opens cart]
      Cart --> Auth{Authenticated?}
      Auth -- No --> GuestContact[Enter name, email, optional phone]
      Auth -- Yes --> Address[Enter street, city, country]
      GuestContact --> Address
      Address --> Items[Submit products, variants, and payment method]
      Items --> Validate[API validates request]
      Validate --> Available{Products visible,<br/>variants valid,<br/>stock available?}
      Available -- No --> Reject[Return validation error]
      Available -- Yes --> Price[Reload database prices and calculate discount]
      Price --> Market{Local product allowed<br/>for destination?}
      Market -- No --> Reject
      Market -- Yes --> Shipping[Calculate country/city zone shipping]
      Shipping --> COD{COD selected and enabled?}
      COD -- Yes --> CODFee[Calculate configured COD fee]
      COD -- No --> Total[Calculate final total]
      CODFee --> Total
      Total --> Reserve[Decrement stock and create order]
      Reserve --> Dispatch[Attempt optional courier dispatch asynchronously]
      Dispatch --> Confirm[Return order confirmation]
      Reject --> End((End))
      Confirm --> End
```

### 4.3 Checkout sequence diagram

```mermaid
sequenceDiagram
      actor Customer
      participant UI as React cart
      participant API as Express orders API
      participant Product as Product model
      participant Settings as System settings
      participant Order as Order model
      participant Courier as Courier service

      Customer->>UI: Submit address, items, variants, payment method
      UI->>API: POST /api/orders with optional JWT and guest contact when signed out
      API->>Product: Reload each product
      Product-->>API: Visibility, stock, price, variants, weight
      API->>Settings: Read COD configuration
      Settings-->>API: COD availability and fee rules
      API->>API: Validate market, calculate discount, shipping, total
      API->>Product: Decrement stock
      API->>Order: Create order snapshot
      Order-->>API: Persisted order
      API--)Courier: Attempt optional dispatch
      API-->>UI: 201 order confirmation
      UI-->>Customer: Show order status
```

### 4.4 Domain class model

```mermaid
classDiagram
      class User {
         +ObjectId id
         +String name
         +String username
         +String email
         +String password
         +String passwordResetTokenHash
         +Date passwordResetExpiresAt
         +Boolean isAdmin
      }
      class Product {
         +ObjectId id
         +String name
         +String category
         +String subcategory
         +Number pricePKR
         +Number priceUSD
         +Number discountPercent
         +Boolean isVisible
         +Boolean isLocal
         +Number stock
         +Number weightKg
         +String[] images
      }
      class Order {
         +ObjectId id
         +ObjectId user
         +Number productTotal
         +Number shippingFee
         +Number codFee
         +Number totalPrice
         +String paymentMethod
         +String paymentStatus
         +String courierDispatchStatus
         +String status
      }
      class OrderItem {
         +ObjectId product
         +String name
         +Number price
         +Number originalPrice
         +Number discountPercent
         +Number quantity
         +Number weightKg
         +String selectedColor
         +String selectedSize
      }
      class SupportTicket {
         +ObjectId id
         +ObjectId user
         +String email
         +String status
         +String message
         +String adminReply
      }
      class SystemSettings {
         +String key
         +Boolean internationalEnabled
         +Boolean codEnabled
         +String codFeeMode
         +Number codFee
         +String courierProvider
      }
      User "0..1" --> "0..*" Order : owns (guest order has null user)
      Order "1" *-- "1..*" OrderItem : embeds
      OrderItem "0..*" --> "0..1" Product : optional source reference
      User "0..1" --> "0..*" SupportTicket : submits
      SystemSettings ..> Order : read during checkout
```

   `User.password` is the field name stored by the model and contains a bcrypt
   hash. `OrderItem` is embedded in an Order; manual cash items can have a null
   Product reference, and guest support tickets have a null User reference.
   `SystemSettings` is read while calculating an order but is not stored as a
   direct Order relationship.

### 4.5 Level-1 data-flow diagram

```mermaid
flowchart LR
      Customer[Customer / guest]
      Admin[Administrator]
      Browser[React browser or Android WebView]
      API((Express API processes))
      Auth[(JWT identity)]
      Mongo[(MongoDB collections)]
      Files[(Uploads storage)]
      Config[(Environment and store settings)]
      FuturePay[Future payment gateway]
      FutureCourier[Future courier API]

      Customer -->|catalog, account, cart, order, support data| Browser
      Admin -->|management commands and reports| Browser
      Browser -->|REST requests and JWT| API
      API -->|verify token and admin role| Auth
      API -->|users, products, orders, tickets| Mongo
      API -->|product image files| Files
      API -->|environment/COD settings| Config
      API -. planned payment requests .-> FuturePay
      API -. planned shipment requests .-> FutureCourier
      API -->|JSON responses and health status| Browser
```

### 4.6 Order state diagram

```mermaid
stateDiagram-v2
      [*] --> Pending
      Pending --> Processing: admin accepts
      Pending --> Cancelled: admin cancels
      Processing --> Shipped: fulfillment dispatched
      Processing --> Cancelled: admin cancels
      Shipped --> Delivered: delivery completed
      Shipped --> Cancelled: exceptional cancellation
      Delivered --> [*]
      Cancelled --> [*]
```

This diagram describes the intended fulfillment journey. The current admin/API
still permits any enumerated status value; it does not enforce this graph.

### 4.7 Diagram coverage and missing views

| View | Status | Notes |
|---|---|---|
| Use case | Added | Actors and implemented/planned interactions |
| Activity | Added | Checkout validation and order creation |
| Sequence | Added | Browser-to-API checkout collaboration |
| Class/domain | Added | Mongoose domain model relationships |
| Object/instance snapshot | Added | Illustrative user/order/ticket/browser-state instance view in `UML_DIAGRAMS.md` |
| Package | Added | Mermaid package-group view of frontend/backend responsibilities |
| ER/data model | Added | See `ARCHITECTURE.md` |
| Data flow | Added | Level-1 actors, processes, stores, integrations |
| State machine | Added | Order lifecycle |
| Component/deployment | Added | `ARCHITECTURE.md` and `UML_DIAGRAMS.md` |
| Communication/collaboration | Added | Numbered message view in `UML_DIAGRAMS.md` |
| Interaction overview | Added | High-level shopper/admin flow in `UML_DIAGRAMS.md` |
| Timing view | Partial | Async courier ordering only; no SLA/latency guarantees are modeled |
| Composite structure | Not separately modeled | Current component/package views cover required structure; no plug-in ports exist |
| UML profile | Not applicable | No project-specific UML metamodel/stereotypes are defined |
| Payment/courier detailed flows | Missing | Add after real providers and webhooks are selected |
| Returns/refunds activity | Missing | Add when the returns domain model and workflow are implemented |

The standalone implementation-based UML set is maintained in
[`UML_DIAGRAMS.md`](./UML_DIAGRAMS.md); this SRD section retains the
requirements-level behavioral models.

## 5. Functional requirements

| ID | Requirement | Status | Acceptance summary |
|---|---|---|---|
| FR-01 | Register with account details | Implemented | Valid name/email/password creates a user and returns JWT |
| FR-02 | Role-separated shopper and administrator sign-in | Implemented | Shopper `/api/auth/login` refuses admins; `/api/auth/admin/login` refuses non-admins, checks role server-side, and limits failed attempts |
| FR-03 | Verify authenticated session | Implemented | Protected session endpoint returns current user |
| FR-04 | Restrict admin operations | Implemented | Admin UI route, dedicated login API, and protected admin APIs independently require an administrator identity |
| FR-05 | Browse visible catalog | Implemented | Public routes exclude hidden products |
| FR-06 | Search/filter/sort catalog | Implemented | UI supports text, category, market, and sort controls |
| FR-07 | Manage product details and variants | Implemented | Admin can set prices, images, category, brand, model, colors, sizes, stock, weight |
| FR-08 | Apply scheduled discounts | Implemented | Discount percentage and inclusive start/end dates are validated server-side |
| FR-09 | Maintain a variant-aware cart | Implemented | Product plus selected color/size identifies a cart line |
| FR-10 | Validate and create orders | Implemented | Server rechecks product, stock, visibility, price, variants, address, and payment method |
| FR-11 | Calculate zone shipping and COD fees | Implemented | Server calculates weight/zone shipping and configured COD fees |
| FR-12 | Track order lifecycle | Implemented | Pending, Processing, Shipped, Delivered, Cancelled are persisted and displayed |
| FR-13 | Capture online payment | Partial | Payment methods exist, but no provider capture/webhook/refund exists |
| FR-14 | Dispatch to courier | Partial | Settings and service seam exist; provider adapter is not implemented |
| FR-15 | Customer order history | Implemented | Authenticated user can list and view authorized orders |
| FR-16 | Support tickets | Implemented | Guest/user creation, user list, admin list, reply, and status endpoints exist |
| FR-17 | Admin sales analytics | Implemented | Revenue, channel, period, product, hour, day, and region aggregates exist |
| FR-18 | Manual cash-sale recording | Implemented | Admin can record a cash sale without a catalog product |
| FR-19 | Store settings | Implemented | Admin can enable/disable international shopping and configure COD/courier settings; public API exposes checkout-safe availability fields |
| FR-20 | Public health checks | Implemented | Live and readiness endpoints report process/database state |
| FR-21 | Android package | Implemented | Capacitor packages the web build; public HTTPS API is required outside local Wi-Fi |
| FR-22 | Automated build validation | Implemented | GitHub Actions validates backend syntax/tests and frontend tests/build |
| FR-23 | Automated APK artifact | Implemented | Tag/manual workflow builds debug APK when `VITE_API_URL` is a public HTTPS URL |
| FR-24 | Returns/refunds workflow | Planned | Requires model, API, UI, eligibility, approval, refund, and stock rules |
| FR-25 | Notifications | Planned | Requires email/SMS/push provider, templates, retry, and preferences |
| FR-26 | Guest COD checkout | Implemented | Guest submits contact/address details; order creation is rate-limited and cannot be read through a public order lookup |
| FR-27 | Public password reset request | Implemented | Public request is rate-limited, uses a generic response to reduce account enumeration, and emails an eligible customer a single-use 20-minute link |
| FR-28 | Navbar live product search | Implemented | Debounced suggestions link to products and full shop results |
| FR-29 | Admin order/product CSV export | Implemented | Admin can download full loaded datasets with spreadsheet-formula-safe CSV values |
| FR-30 | Promotion countdown/scarcity badges | Partial | Dated discounts show countdowns; stock badges indicate 1–4 remaining; no stock reservation timer exists |

## 6. Core business rules

1. Hidden products remain in the admin catalog but are excluded from public
   product responses.
2. Pakistan-only products cannot be ordered for a non-Pakistan country.
3. Pakistan orders use PKR product prices; other countries use USD product
   prices. Shipping uses server-side zone rates.
4. Discounts are active only within their optional inclusive date range.
5. The API calculates order prices from the database and does not trust browser
   prices.
6. Public catalog requests cannot reveal hidden products; hidden catalog data is
   available only to authenticated administrators.
7. COD can be disabled and can use a flat or percentage fee with an optional
   product-total threshold.
8. Cancelling an order restores stock only when its previous status is Pending
   or Processing. Cancellation after Shipped remains possible but does not
   restore stock. Concurrent order creation still needs a transaction or
   compensation design before high-volume production.
9. A courier failure must not fail order creation; the current service reports
   `not_configured` or `provider_not_supported`.
10. Payment method selection is not payment settlement. Non-COD methods must not
   be described as captured payments until a provider is integrated.

## 7. Non-functional requirements

| Area | Current behavior | Production target |
|---|---|---|
| Security | Helmet, CORS, JWT, bcrypt, auth rate limit, body limit | Request schemas, audit logs, refresh/revocation, webhook signatures, secret rotation |
| Availability | Docker health checks and API readiness endpoint | Public monitoring, alerts, redundancy, restore drills |
| Data durability | MongoDB backup/restore scripts and Docker volumes | Encrypted off-host scheduled backups and tested recovery |
| Performance | Vite build and MongoDB API | Pagination, indexes, image CDN, code splitting, load testing |
| Accessibility | Responsive React interface | Keyboard, screen-reader, contrast, and automated accessibility audit |
| Mobile | Capacitor Android wrapper | Public HTTPS API, signed release, device matrix, offline/error UX |
| Observability | Console errors and health endpoints | Central logs, error tracking, metrics, alerting, sensitive-data filtering |

## 8. Environments

| Environment | Frontend API URL | Data | Purpose |
|---|---|---|---|
| Local | `http://localhost:5000` | Local MongoDB | Development |
| LAN test | `http://YOUR_COMPUTER_IP:5000` | Local MongoDB | Same Wi-Fi phone testing |
| CI | Repository variable for APK; no production secrets in normal CI | Ephemeral | Validation/build artifacts |
| Production | Public `https://api.example.com` placeholder | Managed MongoDB | Real customers after release sign-off |

## 9. Release gates

The release must not be called production-ready until:

- Public HTTPS API and database are deployed and tested.
- At least one real payment provider has capture, webhook, idempotency, and
  refund tests.
- Courier behavior is either implemented or removed from customer promises.
- Upload storage, backups, monitoring, rate limits, and recovery are ready.
- Legal documents contain real business identity and have been reviewed.
- Android release is signed, tested on real devices, and built with public API.
- CI checks and required human review pass for the `main` branch.

## 10. Traceability and evidence

- API entry point: `backend/server.js`
- Routes: `backend/routes/`
- Controllers: `backend/controllers/`
- Models: `backend/models/`
- Authentication: `backend/middleware/authMiddleware.js`
- Frontend routes: `frontend/src/App.jsx`
- Admin API operations: `frontend/src/pages/admin/adminApi.js`
- Local tests: `backend/test/`, `frontend/src/tests/`
- CI: `.github/workflows/ci.yml`
- Android build: `.github/workflows/android-apk.yml`

## 11. Phase and delivery tracking

Functional requirements FR-01 through FR-30 are grouped into delivery phases,
mapped to functionality IDs, implementation evidence, and next actions in the
[Phased Delivery and Requirements Traceability Plan](./PROJECT_DELIVERY_PLAN.md).
That plan also contains a master tracking register and future recommendations.
Statuses describe repository implementation, not public deployment or business
sign-off; owners and ETAs remain unset until assigned by the project owner.
