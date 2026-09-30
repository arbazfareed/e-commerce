# IndusCart UML Diagrams

These diagrams document the repository as implemented, not an idealized future system. Mermaid renders them in GitHub. Payment-provider capture and courier booking are shown as future integrations; support tickets are stored by the current Express/MongoDB API. Guest carts and recently viewed items are browser-local; signed-in carts and wishlists are synchronized with the API and stored on the user's MongoDB document, with local browser caches. Customer password reset uses a one-time, 20-minute link delivered through Resend when configured.

## Repository inventory snapshot

The source inventory was checked against this repository before updating these
diagrams. The counts are files, not lines of code; generated build output,
`node_modules`, Android build artifacts, and uploaded images are excluded.

| Area | Files found | Notes |
|---|---:|---|
| Backend JS/JSON/Markdown files | 64 | Runtime, API, schemas, scripts, tests, and manifests; excludes `node_modules`, backups, and uploads |
| Frontend `src` JS/JSX/TS/TSX/CSS files | 44 | Routes, pages, components, contexts, utilities, styles, and tests |
| UML sections in this guide | 25 | Sections 1–16 reviewed/corrected plus 17–25 for code structure and current workflows |

For GitHub review, start with sections 1–4 for actors, domain data, components
and routes; then use the workflows in sections 5 onward.

## 1. Use-case diagram

```mermaid
flowchart LR
    Guest([Guest])
    Customer([Customer])
    Admin([Administrator])
    Payment([Future payment provider])
    Courier([Future courier provider])

    subgraph IndusCart[IndusCart]
        Browse((Browse and filter catalog))
        Details((View product details))
        LocalCart((Maintain local cart))
        Account((Register or shopper sign in))
        AdminLogin((Administrator sign in))
        Checkout((Place order))
        Track((View order history/status))
        Ticket((Submit support ticket))
        AdminPassword((Change own admin password))
        RequestReset((Request customer reset email))
        CompleteReset((Choose password from one-time link))
        AdminCatalog((Manage products and images))
        AdminOrders((Review orders and set status))
        AdminSupport((Reply to support tickets))
        AdminSettings((Configure COD and courier settings))
    end

    Guest --> Browse
    Guest --> Details
    Guest --> Account
    Guest -->|storefront shield icon| AdminLogin
    Guest --> Ticket
    Guest --> CompleteReset
    Customer --> Browse
    Customer --> Details
    Customer --> LocalCart
    Customer --> Checkout
    Customer --> Track
    Customer --> Ticket
    Admin --> AdminCatalog
    Admin --> AdminLogin
    Admin --> AdminOrders
    Admin --> AdminSupport
    Admin --> AdminSettings
    Admin --> AdminPassword
    Admin --> RequestReset
    RequestReset -->|email link| CompleteReset
    Checkout -. future capture .-> Payment
    AdminSettings -. future booking adapter .-> Courier
```

## 2. Domain class diagram

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
        +String phone
        +String country
        +String city
        +matchPassword(entered) Boolean
    }
    class Product {
        +ObjectId id
        +String name
        +String category
        +String subcategory
        +Number pricePKR
        +Number priceUSD
        +Number discountPercent
        +String discountStartDate
        +String discountEndDate
        +Boolean isVisible
        +Boolean isLocal
        +Number stock
        +Number weightKg
        +String[] colors
        +String[] sizes
        +String[] images
    }
    class CartLine {
        +String productId
        +Number quantity
        +String selectedColor
        +String selectedSize
    }
    class Order {
        +ObjectId id
        +ObjectId user
        +Number productTotal
        +Number shippingFee
        +Number codFee
        +Number totalWeight
        +String shippingZone
        +Number totalPrice
        +String paymentMethod
        +String paymentChannel
        +String paymentStatus
        +Boolean isPaid
        +Date paidAt
        +String courierDispatchStatus
        +String status
        +Boolean isManualCash
        +Date cashCollectedAt
        +ObjectId recordedBy
        +String notes
    }
    class OrderItem {
        +ObjectId product
        +String name
        +Number price
        +Number originalPrice
        +Number discountPercent
        +Number quantity
        +String image
        +String selectedColor
        +String selectedSize
        +Number weightKg
    }
    class SupportTicket {
        +ObjectId id
        +ObjectId user
        +String name
        +String email
        +String subject
        +String message
        +String orderId
        +String status
        +String adminReply
        +Date resolvedAt
    }
    class SystemSettings {
        +String key
        +Boolean internationalEnabled
        +Boolean codEnabled
        +String codFeeMode
        +Number codFee
        +Number codThreshold
        +String courierProvider
        +String courierApiKey
    }
    class BrowserStorage {
        +JSON cart
        +JSON recentlyViewed
        +String marketMode
        +String themePreference
        +Number exchangeRate
    }

    User "0..1" --> "0..*" Order : account owns (guest orders have no User)
    Order "1" *-- "1..*" OrderItem : snapshots
    OrderItem "0..*" --> "0..1" Product : optional source reference
    User "0..1" --> "0..*" SupportTicket : submits
    BrowserStorage "1" o-- "0..*" CartLine : stores locally
    CartLine "0..*" --> "1" Product : references
    SystemSettings ..> Order : read during checkout
```

**Storage distinction:** `CartLine` and `BrowserStorage` are conceptual browser state, not MongoDB models. `OrderItem` is an embedded subdocument in `Order`, not a separate collection; manual cash items may have a null `Product` reference. `SystemSettings` is read while creating an order but has no persisted relation to it. Password reset token hashes/expiry are hidden `User` fields. Courier keys are excluded from normal settings responses and encrypted at rest when `SETTINGS_ENCRYPTION_KEY` is configured.

## 3. Component diagram

```mermaid
flowchart LR
    Shopper[Customer browser / Android WebView]
    Operator[Admin browser]
    React[React + Vite application]
    AuthContext[AuthContext / JWT session]
    CartContext[CartContext / localStorage]
    AdminAPI[Admin API client]
    ResetPage[PasswordResetPage]
    Express[Express REST API]
    AuthMW[JWT protect / admin middleware]
    Controllers[Auth, product, order, support, settings controllers]
    EmailService[Resend email service]
    Resend[Resend HTTPS API]
    Mongo[(MongoDB: users, products, orders, settings, tickets)]
    Uploads[(backend/uploads or Docker volume)]
    Payment[Future payment adapter]
    Courier[Courier dispatch seam; adapter not implemented]

    Shopper --> React
    Operator --> React
    React --> AuthContext
    React --> CartContext
    React --> AdminAPI
    React --> ResetPage
    AuthContext --> Express
    AdminAPI --> Express
    React --> Express
    Express --> AuthMW
    AuthMW --> Controllers
    Controllers --> Mongo
    Controllers --> Uploads
    Controllers --> EmailService
    EmailService --> Resend
    Controllers -. future integration .-> Payment
    Controllers --> Courier
```

## 4. Checkout sequence

```mermaid
sequenceDiagram
    actor Customer
    participant UI as React CartPage
    participant Cart as CartContext/localStorage
    participant API as Express Orders API
    participant Product as Product model
    participant Settings as SystemSettings
    participant Order as Order model
    participant Courier as Courier service

    Customer->>UI: Confirm address and method
    UI->>Cart: Read local cart lines
    UI->>API: POST /api/orders with optional JWT, guest contact (if guest), and product IDs/quantities
    API->>Product: Reload products and validate visibility, market, variants, stock
    Product-->>API: Current prices, stock, variants, weight
    API->>Settings: Read COD configuration
    API->>API: Recalculate totals and mark payment pending
    API->>Product: Reserve stock
    API->>Order: Create order snapshot
    Order-->>API: Persisted order
    API-->>Courier: Schedule asynchronous dispatch attempt when configured
    API-->>UI: 201 order and pending payment status
    UI->>Cart: Clear cart after successful order
    UI-->>Customer: Show confirmation and explain online payment was not captured
```

## 5. Support-ticket sequence

```mermaid
sequenceDiagram
    actor Visitor as Guest or customer
    actor Admin
    participant UI as React SupportPage/AdminPage
    participant API as Express Support API
    participant Ticket as SupportTicket model
    participant DB as MongoDB

    Visitor->>UI: Submit support form
    UI->>API: POST /api/support/tickets or /guest
    API->>Ticket: Validate and create ticket
    Ticket->>DB: Persist
    API-->>UI: 201 ticket
    Admin->>UI: Load support queue
    UI->>API: GET /api/support/tickets (admin JWT)
    API->>DB: Query and populate submitter
    DB-->>UI: Shared ticket list
    Admin->>UI: Reply or change Open/Resolved
    UI->>API: PUT reply/status (admin JWT)
    API->>DB: Persist reply/status
    API-->>UI: Updated ticket
```

## 6. Product upload sequence

```mermaid
sequenceDiagram
    actor Admin
    participant UI as AdminPage/ImagePicker
    participant API as productRoutes/Multer
    participant Check as Image validation middleware
    participant Controller as productController
    participant Disk as backend/uploads
    participant DB as Product model

    Admin->>UI: Select JPG/PNG/WEBP images
    UI->>UI: Check five-image cap and 5 MiB per-file limit
    UI->>API: Multipart POST/PUT with images
    API->>API: Check extension, MIME, request count and file size
    API->>Disk: Write temporary upload
    API->>Check: Verify file signature
    Check->>Controller: Continue only for matching signatures
    Controller->>DB: Save at most five image filenames
    Controller-->>UI: Product response
```

## 7. Order status and payment notes

The enum values are `Pending`, `Processing`, `Shipped`, `Delivered`, and `Cancelled`. The current API validates the enum but does **not** enforce a transition graph. Cancellation from Pending/Processing restores stock; cancellation after Shipped remains allowed but does not restore stock. `paymentStatus` is separate from fulfillment: non-COD methods are pending until a payment integration updates them. Courier dispatch state is recorded, but no carrier booking adapter exists.

## 8. Package diagram

This package view groups the current code by responsibility. It is a Mermaid flowchart representation of UML packages, not a separate deployable-service map.

```mermaid
flowchart LR
    subgraph Frontend["«package» frontend/src"]
        Pages[pages]
        Components[components]
        Context[context]
        FrontendAPI[utils/axiosConfig + adminApi]
        Pages --> Components
        Pages --> Context
        Pages --> FrontendAPI
    end

    subgraph Backend["«package» backend"]
        Routes[routes]
        Middleware[middleware]
        Controllers[controllers]
        Models[models]
        Services[services]
        Utilities[utils]
        Routes --> Middleware
        Routes --> Controllers
        Controllers --> Models
        Controllers --> Services
        Controllers --> Utilities
    end

    FrontendAPI --> Routes
```

## 9. Deployment diagram

```mermaid
flowchart TB
    subgraph Device[Customer or admin device]
        ShopperBrowser[Shopper browser / Android WebView]
        AdminBrowser[Admin browser]
        ShopperApp[React + Vite shopper mode]
        AdminApp[React + Vite admin-only mode]
        LocalState[(localStorage cart / recent items)]
        ShopperBrowser --> ShopperApp
        AdminBrowser --> AdminApp
        ShopperApp --> LocalState
    end

    subgraph AppHost[Application host or Docker Compose]
        Proxy[Nginx in Docker, optional]
        API[Node.js / Express API]
        Media[(backend/uploads or uploads volume)]
        Proxy --> API
        API --> Media
    end

    subgraph DataHost[Database host]
        Mongo[(MongoDB)]
    end

    subgraph MailHost[External email provider]
        Resend[Resend HTTPS API]
    end

    ShopperApp -->|HTTPS/REST + JWT| Proxy
    AdminApp -->|HTTPS/REST + JWT| Proxy
    ShopperApp -->|local :3000 -> :5000| API
    AdminApp -->|local :3001 -> :5000| API
    API --> Mongo
    API -. configured password-reset email .-> Resend
```

In local development Vite serves the UI and Express serves the API. In the Docker setup Nginx serves the frontend and proxies API requests; MongoDB and uploads use persistent Docker volumes. Public production hosting, shared object storage, and HTTPS remain deployment requirements, not claims made by this diagram.

## 10. Checkout activity diagram

```mermaid
flowchart TD
    Start((Start)) --> Browse[Browse visible catalog]
    Browse --> Cart[Add product/variant to guest cart or signed-in account cart]
    Cart --> Auth{Signed in?}
    Auth -- No --> SignIn[Register or sign in]
    SignIn --> Checkout[Open protected cart/checkout]
    Auth -- Yes --> Checkout
    Checkout --> Submit[Submit product IDs, quantities, address, method]
    Submit --> Validate[API reloads product and settings data]
    Validate --> Valid{Visible, eligible, variant valid, stock available?}
    Valid -- No --> Reject[Return validation error]
    Valid -- Yes --> Price[Recompute price, shipping and COD fee]
    Price --> Reserve[Reserve stock and create order]
    Reserve --> Payment[Set payment state; no online capture]
    Payment --> Dispatch[Record async courier dispatch outcome]
    Dispatch --> Confirm[Return order confirmation]
```

## 11. Object/instance snapshot

This example shows the relationship between stored Mongo documents and browser-only state at one point in time. Values are illustrative, not production records.

```mermaid
flowchart LR
    User1["user-1: User<br/>isAdmin=false"]
    Product1["product-1: Product<br/>category=Fruit<br/>isLocal=false"]
    Order1["order-1: Order<br/>status=Pending<br/>paymentStatus=pending"]
    Item1["item-1: OrderItem<br/>quantity=2<br/>selectedSize=Large"]
    Ticket1["ticket-1: SupportTicket<br/>status=Open"]
    Browser1["browser-1: BrowserStorage<br/>cart + recentlyViewed"]

    User1 --> Order1
    Order1 -->|embeds| Item1
    Item1 --> Product1
    User1 --> Ticket1
    Browser1 --> Product1
```

## 12. Communication/collaboration diagram

The numbered messages show the participating objects and their responsibilities for an order. The checkout sequence above gives the same collaboration in time order.

```mermaid
flowchart LR
    Customer[Customer]
    UI[React CartPage]
    Auth[JWT middleware]
    OrderController[Order controller]
    ProductModel[Product model]
    SettingsModel[SystemSettings model]
    OrderModel[Order model]
    CourierService[Courier service]

    Customer -->|1: confirm order| UI
    UI -->|2: POST /api/orders| Auth
    Auth -->|3: authenticated request| OrderController
    OrderController -->|4: reload/validate/reserve| ProductModel
    OrderController -->|5: read COD settings| SettingsModel
    OrderController -->|6: create pending order| OrderModel
    OrderController -.->|7: async dispatch attempt| CourierService
    OrderModel -->|8: confirmation response| UI
```

## 13. Interaction overview

```mermaid
flowchart TD
    Start([Visitor or signed-in user]) --> Intent{User intent}
    Intent -->|Shop| Catalog[Browse/search/filter/sort catalog]
    Catalog --> Product[View product and variants]
    Product --> Cart[Update local cart]
    Cart --> Auth{Authenticated?}
    Auth -- No --> Login[Register/sign in]
    Login --> Checkout[Place order]
    Auth -- Yes --> Checkout
    Checkout --> Order[Review status in order history]
    Intent -->|Need help| Ticket[Submit guest/customer support ticket]
    Ticket --> Reply[Read server-backed admin reply]
    Intent -->|Admin task| Admin[Manage catalog, orders, support, settings]
```

## 14. Order status state model

```mermaid
stateDiagram-v2
    [*] --> Pending: new order
    Pending --> AnyValidStatus: admin submits any valid enum
    Processing --> AnyValidStatus: admin submits any valid enum
    Shipped --> AnyValidStatus: admin submits any valid enum
    Delivered --> AnyValidStatus: admin submits any valid enum
    Cancelled --> AnyValidStatus: admin submits any valid enum
    state AnyValidStatus <<choice>>
    AnyValidStatus --> Pending
    AnyValidStatus --> Processing
    AnyValidStatus --> Shipped
    AnyValidStatus --> Delivered
    AnyValidStatus --> Cancelled
```

This intentionally reflects current behavior rather than an ideal workflow: the API accepts any enumerated status value and does not enforce a transition graph. Stock is restored only when cancellation occurs from Pending or Processing; cancelling after shipment does not restock.

## 15. Timing/async dispatch view

The repository has no courier SLA or delivery-time implementation, so this is an ordering view only; it does not assert elapsed times.

```mermaid
sequenceDiagram
    participant API as Order API
    participant DB as MongoDB Order
    participant Courier as Courier service seam
    participant UI as Customer UI

    API->>DB: Create order (courierDispatchStatus=pending)
    API-->>UI: Return 201 order response
    par after response
        API->>Courier: Attempt dispatch
        alt no credentials configured
            Courier-->>API: not_configured
            API->>DB: Save not_configured status
        else provider has no adapter
            Courier-->>API: unsupported
            API->>DB: Save unsupported status
        end
    end
```

## 16. UML diagram coverage and notation limits

| UML view | Included here or elsewhere | Notes |
|---|---|---|
| Use case | Section 1 | Mermaid flowchart notation represents actors and use cases. |
| Class | Sections 2 and 23; `SRD.md` | Domain entities, embedded order items, browser-local state, and persistence boundaries. |
| Object | Section 11 | Illustrative instance snapshot using Mermaid nodes. |
| Package | Section 8 | Mermaid grouped flowchart; source packages are not runtime services. |
| Component | Section 3; `ARCHITECTURE.md` | Application and persistence boundaries. |
| Composite structure | Not separately modeled | Internal React/API parts are represented in the component/package views; no plug-in ports are defined. |
| Deployment | Section 9; `ARCHITECTURE.md` | Local and Docker nodes; public production hosting is future work. |
| Activity | Section 10; `SRD.md` | Checkout validation and order creation. |
| State machine | Section 14; `SRD.md` | Current enum behavior, explicitly not a constrained workflow. |
| Sequence | Sections 4–6 | Checkout, support, and uploads. |
| Communication | Section 12 | Numbered collaboration messages. |
| Interaction overview | Section 13 | High-level user journey combining interactions. |
| Timing | Section 15 | Async courier attempt ordering only; no timing/SLA guarantees. |
| Repository/package inventory | Sections 17, 24 | Source folders and workspace file counts (not LOC). |
| Frontend route/access map | Section 18 | Routes, providers, guards, page and API dependencies. |
| Backend route authorization map | Sections 19–20 | Route prefixes, middleware and persistence boundaries. |
| Password reset sequence/state | Sections 21–22 | Resend delivery, hashed token, expiry and single-use completion. |
| Profile | Not applicable | The project defines no UML metamodel profiles or custom stereotypes. |

Mermaid does not provide native UML glyphs for every diagram family. Where noted, flowcharts are readable UML-inspired views. For strict UML modeling/exchange, maintain equivalent models in a UML tool and export PlantUML/XMI as needed.

For the requirements-oriented diagrams and acceptance criteria, see [`SRD.md`](./SRD.md). For runtime/deployment diagrams, see [`ARCHITECTURE.md`](./ARCHITECTURE.md); for implemented/partial/missing features, see [`FEATURE_COVERAGE.md`](./FEATURE_COVERAGE.md).

## 17. Repository package and source map

```mermaid
flowchart TB
        Repo[IndusCart repository]
        Repo --> Backend[backend: Express API]
        Repo --> Frontend[frontend: React/Vite app]
        Repo --> Docs[docs: requirements, guides, QA and diagrams]
        Repo --> Ops[docker-compose.yml, CI, security and contribution files]

        Backend --> Server[server.js]
        Backend --> Config[config: env, DB, API URL helper]
        Backend --> Routes[routes: auth, cart, coupons, orders, products, reviews, settings, support, wishlist]
        Backend --> Middleware[middleware: JWT/admin, image upload checks]
        Backend --> Controllers[controllers: auth, cart, coupons, orders, products, reviews, settings, support, wishlist]
        Backend --> Models[models: User, Product, Order, Coupon, Review, SupportTicket, SystemSettings]
        Backend --> Services[services: email/Resend, courier seam]
        Backend --> Utils[utils: pricing, status, images, analytics, cash sales]
        Backend --> Scripts[scripts: admin, backup, restore]
        Backend --> Tests[test: unit, API integration, browser smoke]

        Frontend --> App[App.jsx: router and providers]
        Frontend --> Pages[pages: shop, detail, auth, cart, orders, support, admin]
        Frontend --> Components[components: navbar, brand, product card, error boundary]
        Frontend --> Context[context: auth and cart/localStorage]
        Frontend --> ApiUtils[utils: axios config, prices and shipping]
        Frontend --> UiTests[tests: routes, cart, error boundary]
```

The current scoped source inventory is 64 backend JS/JSON/Markdown files and 44
frontend `src` JS/JSX/TS/TSX/CSS files. Backend counts exclude `node_modules`,
backups, and uploads; frontend counts are limited to `frontend/src`. Generated
`dist`, Android build outputs, and other binary/generated content are excluded.

## 18. Frontend route, guard and provider diagram

```mermaid
flowchart TB
        Browser[Browser / Android WebView]
        ErrorBoundary[ErrorBoundary]
        AuthProvider[AuthProvider: persisted JWT + session verification]
        CartProvider[CartProvider: cart + recent items in localStorage]
        AppRoutes[AppRoutes + shared Navbar]
        Browser --> ErrorBoundary --> AuthProvider --> CartProvider --> AppRoutes

        AppRoutes --> RootRoute["Root route /"]
        RootRoute -->|guest/customer| Home[HomePage]
        RootRoute -->|admin redirect| Admin[AdminPage]
        AppRoutes --> ProductDetail["ProductDetailPage /products/:id"]
        AppRoutes --> GuestGuard[GuestRoute]
        GuestGuard --> Login["LoginPage /login"]
        GuestGuard --> Register["RegisterPage /register"]
        AppRoutes --> AdminLoginRoute["LoginPage /admin/login"]
        AppRoutes --> Reset["PasswordResetPage /reset-password/:token"]
        AppRoutes --> Forgot["ForgotPasswordPage /forgot-password"]
        AppRoutes --> Cart["CartPage /cart (guest or signed-in)"]
        AppRoutes --> PrivateGuard[PrivateRoute]
        PrivateGuard --> Orders["OrdersPage /orders"]
        PrivateGuard --> Track["OrderTrackPage /orders/:id"]
        AppRoutes --> AdminGuard[AdminRoute]
        AdminGuard --> Admin
        AppRoutes --> Support["SupportPage /support"]
        AppRoutes --> NotFound[NotFoundPage / wildcard]

        Home --> ProductCard[ProductCard]
        Navbar --> LiveSearch[Debounced public product suggestions]
        Navbar --> AdminPortalEntry[Shield icon opens admin portal]
        ProductDetail --> CartProvider
        Cart --> CartProvider
        Orders --> API["axiosConfig / VITE_API_URL"]
        Admin --> AdminAPI["pages/admin/adminApi"]
        AuthProvider --> API
        ProductDetail --> API
        Cart --> API
        Support --> API
        AdminAPI --> API
```

`GuestRoute` redirects authenticated users away from login/register;
`PrivateRoute` requires a user; `AdminRoute` additionally requires `isAdmin`.
The storefront shield opens the distinct admin route; login UI separation is
backed by different API endpoints and server-side role checks.
The reset-link route is intentionally public and accepts only the expiring
one-time token; it does not create a logged-in session.

## 19. Backend request and persistence architecture

```mermaid
flowchart LR
        Client["React page / adminApi"]
        Axios["axiosConfig: API_BASE and JWT header"]
        Server[Express server.js]
        Stack[CORS, Helmet, JSON limit, uploads static]
        Router{Route prefix}
        Guard["protect / admin / optionalProtect"]
        Controller[Controller validation + orchestration]
        Models[(Mongoose models / MongoDB)]
        Utilities[Business utilities]
        Uploads["backend/uploads"]
        Courier["courierService adapter seam"]
        Mail["emailService: Resend HTTPS API"]

        Client --> Axios --> Server --> Stack --> Router
        Router --> Guard --> Controller
        Controller --> Models
        Controller --> Utilities
        Controller --> Uploads
        Controller -. asynchronous dispatch .-> Courier
        Controller --> Mail
        Mail --> Resend[api.resend.com]

        subgraph Prefixes["Express route prefixes"]
            AuthRoute["/api/auth"]
            ProductRoute["/api/products"]
            OrderRoute["/api/orders"]
            SupportRoute["/api/support"]
            SettingRoute["/api/settings"]
        end
        Router --> Prefixes
```

`server.js` validates required environment, installs common middleware and
mounts the five route modules. Route modules select middleware; controllers
call models and utilities. The mail provider is called only for the admin
customer-reset request when Resend settings are configured.

## 20. API authorization and route map

| Route family | Representative operations | Access enforced by route middleware |
|---|---|---|
| `/api/auth` | shopper/admin login, register, profile, session, own password, admin reset-email, public reset request/completion | `/login` rejects admins; `/admin/login` rejects non-admins and allows five failed attempts per observed IP per 15 minutes; own password requires `protect`; admin reset email requires `protect` + `admin` |
| `/api/products` | catalog/categories/detail, create/update/delete | Public reads use optional admin identity for hidden items; mutations require admin |
| `/api/orders` | guest/account place, own list/detail, all orders, analytics, manual cash, status | Guest/account checkout is rate-limited and validates guest contact when no JWT is present; history requires user; admin operations require admin; detail enforces owner/admin in controller |
| `/api/support` | user/guest create, own list, admin list/status/reply | User routes use `protect`; guest creation is public; administration requires user + admin |
| `/api/settings` | public COD settings, private settings read/update | public checkout read is unauthenticated; private settings require user + admin |

## 21. Admin customer password-reset sequence

```mermaid
sequenceDiagram
        actor Admin
        actor Customer
        participant AdminUI as AdminPage / Settings
        participant API as Express auth routes
        participant Guard as protect + admin
        participant Auth as authController
        participant User as User document
        participant Mail as emailService
        participant Resend as Resend API
        participant ResetUI as PasswordResetPage
        participant PublicReset as ForgotPasswordPage

        Admin->>AdminUI: Enter customer email
        AdminUI->>API: PUT /api/auth/admin/customer-password (admin JWT)
        API->>Guard: Verify JWT and isAdmin
        Guard->>Auth: Allow reset request
        Auth->>User: Find non-admin account
        Auth->>Auth: Generate random token, store its SHA-256 hash, set 20-minute expiry
        Auth->>Mail: Send reset URL to customer's registered email
        Mail->>Resend: POST email request (server-side API key)
        Resend-->>Customer: Email with one-time reset link
        Auth-->>AdminUI: Sent confirmation, or delivery error
        Customer->>PublicReset: Enter account email
        PublicReset->>API: POST /api/auth/password/reset/request
        API->>Auth: Apply public per-IP rate limit
        Auth->>User: Find eligible non-admin account
        alt Eligible customer and email accepted
            Auth->>Auth: Store token hash and 20-minute expiry
            Auth->>Mail: Send one-time reset URL
            Mail->>Resend: POST email request
        else Unknown/admin account or email failure
            Auth->>Auth: Do not reveal account or delivery state
        end
        Auth-->>PublicReset: Generic accepted confirmation
        Customer->>ResetUI: Open /reset-password/:token
        Customer->>ResetUI: Enter and confirm new password
        ResetUI->>API: POST /api/auth/password/reset with token and new password
        API->>Auth: Rate-limit and validate request
        Auth->>User: Hash submitted token and find matching unexpired hash
        Auth->>User: Atomically claim token, then save bcrypt password hash
        Auth-->>ResetUI: Success; token can no longer be reused
```

If email delivery fails, the stored reset token is cleared and the admin gets
a `503` response. The raw token exists only in the generated link/email and
request; MongoDB stores only its hash and expiry. Reset completion is
single-use and requires a 12-character minimum. No plaintext password is
emailed.

## 22. Password-reset token state model

```mermaid
stateDiagram-v2
        [*] --> NotIssued
        NotIssued --> PendingDelivery: admin requests email
        PendingDelivery --> Active: email provider accepts message
        PendingDelivery --> Revoked: delivery failure / clear token
        Active --> Consumed: valid token claimed and password saved
        Active --> Expired: 20-minute expiry passes
        Active --> Revoked: superseded by another reset request
        Consumed --> [*]
        Expired --> [*]
        Revoked --> [*]
```

## 23. User, order and browser-state class relationships

This focused class view clarifies which values are documents, embedded
subdocuments, references, or browser-local state.

```mermaid
classDiagram
        class User {
            +ObjectId _id
            +String email
            +String password
            +Boolean isAdmin
            +String passwordResetTokenHash
            +Date passwordResetExpiresAt
        }
        class Product {
            +ObjectId _id
            +String name
            +String category
            +Number pricePKR
            +Number priceUSD
            +Number stock
            +Number weightKg
            +String[] images
            +String[] colors
            +String[] sizes
            +Boolean isLocal
            +Boolean isVisible
        }
        class Order {
            +ObjectId user
            +OrderItem[] products
            +Number productTotal
            +Number shippingFee
            +Number codFee
            +Number totalPrice
            +String shippingZone
            +String status
            +String paymentStatus
            +String courierDispatchStatus
        }
        class OrderItem {
            +ObjectId product
            +String name
            +String image
            +String selectedColor
            +String selectedSize
            +Number price
            +Number originalPrice
            +Number discountPercent
            +Number quantity
            +Number weightKg
        }
        class SupportTicket {
            +ObjectId user
            +String name
            +String email
            +String subject
            +String message
            +String orderId
            +String status
            +String adminReply
            +Date resolvedAt
        }
        class SystemSettings {
            +String key
            +Boolean internationalEnabled
            +Boolean codEnabled
            +String codFeeMode
            +Number codFee
            +Number codThreshold
            +String courierProvider
            +String courierApiKey
        }
        class BrowserStorage {
            +CartLine[] cart
            +Product[] recentlyViewed
            +String marketMode
            +String themePreference
            +Number exchangeRate
        }
        class CartLine {
            +Product productSnapshot
            +Number quantity
            +String selectedColor
            +String selectedSize
        }

        User "0..1" --> "0..*" Order : account owns; guest has null user
        Order "1" *-- "1..*" OrderItem : embeds
        OrderItem "0..*" --> "0..1" Product : source reference
        User "0..1" --> "0..*" SupportTicket : submits
        BrowserStorage "1" *-- "0..*" CartLine : localStorage
        CartLine "0..*" --> "1" Product : identifies item
```

`User.password` is a bcrypt hash. The password-reset fields are hidden from
normal queries; `SystemSettings.courierApiKey` is also `select: false` and is
encrypted at rest when the settings encryption key is configured.
`OrderItem` is embedded in an Order; `OrderItem.product` can be null for manual
cash lines. A guest SupportTicket has `user: null`. BrowserStorage and CartLine
are conceptual client-side data, not MongoDB models. SystemSettings is read at
checkout but is not directly persisted as an Order relationship.

## 24. Module inventory and count

| Package | Files / responsibilities |
|---|---|
| `frontend/src` (44 matched source/style files) | App/router, customer and admin pages, shared components, contexts, utilities, styles, and tests |
| `backend` (64 matched JS/JSON/Markdown files) | Express API, config, 9 route modules, controllers, 7 models, middleware, services, utilities, scripts, tests, and package manifests |
| `docs` | Requirements, API, architecture/UML, QA, user guides, deployment, release and policy documents |

The counts use the extension/path scopes in the repository inventory above;
they are not LOC counts or a list of every repository file. Generated Android
build outputs, frontend `dist`, backend `node_modules`, backups, uploads, and
binary assets are excluded. Together the current patterns match 108 files
(64 backend and 44 frontend).

## 25. GitHub documentation map

- Start at [`README.md`](../README.md), then use [`DOCUMENTATION_INDEX.md`](./DOCUMENTATION_INDEX.md).
- [`TECHNICAL_GUIDE.md`](./TECHNICAL_GUIDE.md) summarizes the source/package map.
- This file contains implementation-based Mermaid/UML views.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) gives deployment and system overview.
- [`API_REFERENCE.md`](./API_REFERENCE.md) is the endpoint/auth source of truth.
- [`FEATURE_COVERAGE.md`](./FEATURE_COVERAGE.md) distinguishes implemented, partial and missing behavior.

All diagrams intentionally use Mermaid syntax supported by GitHub Markdown.
For exact UML model interchange, use a UML editor and export XMI/PlantUML; the
Mermaid views are readable, reviewable source documentation rather than XMI.

## 26. Shopper/admin login security sequence

```mermaid
sequenceDiagram
    actor Shopper
    actor Admin
    participant ShopUI as Shopper login
    participant AdminUI as Admin login
    participant API as Auth routes
    participant Limiter as Admin IP limiter
    participant Auth as authController
    participant DB as User collection

    Shopper->>ShopUI: Submit identifier and password
    ShopUI->>API: POST /api/auth/login
    API->>Auth: Shopper-only credential check
    Auth->>DB: Verify password and isAdmin=false
    alt shopper account
        Auth-->>ShopUI: Shopper JWT and profile
    else admin or invalid account
        Auth-->>ShopUI: Generic 401 without a token
    end

    Admin->>AdminUI: Submit credentials at /admin/login
    AdminUI->>API: POST /api/auth/admin/login
    API->>Limiter: Check failed attempts for observed IP
    alt more than five failures in 15 minutes
        Limiter-->>AdminUI: 429 throttled response
    else within limit
        API->>Auth: Admin-only credential check
        Auth->>DB: Verify password and isAdmin=true
        alt administrator account
            Auth-->>AdminUI: Admin JWT and profile
        else shopper or invalid account
            Auth-->>AdminUI: Generic 401 without a token
        end
    end
```

The limiter is in-memory and per API process today. Use a shared store for
multiple instances, configure only trusted proxies, and add MFA/passkeys before
a high-risk production launch. A distinct icon or URL is not an authorization
control; role checks on the server remain mandatory.

## 27. Registration and portal activity

```mermaid
flowchart TD
    Start((Open app)) --> Portal{Choose portal}
    Portal -->|Shopper :3000| ShopHome[Browse shopper portal]
    ShopHome --> ShopChoice{Already registered?}
    ShopChoice -->|No| Signup[Enter registration details]
    Signup --> RegisterAPI[POST /api/auth/register]
    RegisterAPI --> Valid{Details valid and unique?}
    Valid -->|No| SignupError[Show validation error]
    SignupError --> Signup
    Valid -->|Yes| CreateShopper[Create user with isAdmin=false]
    CreateShopper --> ShopperJWT[Return shopper JWT]
    ShopChoice -->|Yes| ShopperLogin[Submit email/username and password]
    ShopperLogin --> ShopperAPI[POST /api/auth/login]
    ShopperAPI --> ShopperRole{Password valid and isAdmin=false?}
    ShopperRole -->|Yes| ShopperJWT
    ShopperRole -->|No| ShopperError[Generic 401; issue no token]
    ShopperError --> ShopperLogin

    Portal -->|Admin :3001| AdminLogin[Open admin-only portal]
    AdminLogin --> AdminCreds[Submit admin credentials]
    AdminCreds --> AdminAPI[POST /api/auth/admin/login]
    AdminAPI --> Attempts{Five failed attempts in 15 minutes?}
    Attempts -->|Yes| Throttle[Return 429]
    Attempts -->|No| AdminRole{Password valid and isAdmin=true?}
    AdminRole -->|Yes| AdminJWT[Return admin JWT]
    AdminRole -->|No| AdminError[Generic 401; issue no token]
    AdminError --> AdminCreds
```

Local portal processes share the same API (`:5000`) and database; the separate
ports and icons are operational navigation, not authorization controls.
Registration always creates a shopper account; admin accounts must be
provisioned with the secure bootstrap/reset scripts.
