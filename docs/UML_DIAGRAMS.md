# IndusCart UML Diagrams

These diagrams document the repository as implemented, not an idealized future system. Mermaid renders them in GitHub. Payment-provider capture and courier booking are shown as future integrations; support tickets are stored by the current Express/MongoDB API. The cart and recently viewed list are browser-local.

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
        Account((Register or sign in))
        Checkout((Place order))
        Track((View order history/status))
        Ticket((Submit support ticket))
        AdminCatalog((Manage products and images))
        AdminOrders((Review orders and set status))
        AdminSupport((Reply to support tickets))
        AdminSettings((Configure COD and courier settings))
    end

    Guest --> Browse
    Guest --> Details
    Guest --> Account
    Guest --> Ticket
    Customer --> Browse
    Customer --> Details
    Customer --> LocalCart
    Customer --> Checkout
    Customer --> Track
    Customer --> Ticket
    Admin --> AdminCatalog
    Admin --> AdminOrders
    Admin --> AdminSupport
    Admin --> AdminSettings
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
        +String passwordHash
        +Boolean isAdmin
        +String country
        +String city
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
    class CartLine {
        +String productId
        +Number quantity
        +String selectedColor
        +String selectedSize
    }
    class Order {
        +ObjectId id
        +ObjectId userId
        +Number productTotal
        +Number shippingFee
        +Number codFee
        +Number totalPrice
        +String paymentMethod
        +String paymentStatus
        +Boolean isPaid
        +String courierDispatchStatus
        +String status
    }
    class OrderItem {
        +ObjectId productId
        +String name
        +Number price
        +Number quantity
        +String selectedColor
        +String selectedSize
    }
    class SupportTicket {
        +ObjectId id
        +ObjectId userId
        +String name
        +String email
        +String subject
        +String message
        +String status
        +String adminReply
    }
    class SystemSettings {
        +String key
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
    }

    User "1" --> "0..*" Order : places
    Order "1" *-- "1..*" OrderItem : snapshots
    Product "1" <-- "0..*" OrderItem : source item
    User "0..1" --> "0..*" SupportTicket : submits
    SystemSettings "1" --> "0..*" Order : checkout settings
    BrowserStorage "1" o-- "0..*" CartLine : stores locally
    CartLine "0..*" --> "1" Product : references
```

**Storage distinction:** `CartLine` and `BrowserStorage` are conceptual browser state, not MongoDB models. `Order` and `SupportTicket` are persisted server-side. Courier keys are excluded from normal settings responses; they are not currently encrypted at rest.

## 3. Component diagram

```mermaid
flowchart LR
    Shopper[Customer browser / Android WebView]
    Operator[Admin browser]
    React[React + Vite application]
    AuthContext[AuthContext / JWT session]
    CartContext[CartContext / localStorage]
    AdminAPI[Admin API client]
    Express[Express REST API]
    AuthMW[JWT protect / admin middleware]
    Controllers[Auth, product, order, support, settings controllers]
    Mongo[(MongoDB: users, products, orders, settings, tickets)]
    Uploads[(backend/uploads or Docker volume)]
    Payment[Future payment adapter]
    Courier[Courier dispatch seam; adapter not implemented]

    Shopper --> React
    Operator --> React
    React --> AuthContext
    React --> CartContext
    React --> AdminAPI
    AuthContext --> Express
    AdminAPI --> Express
    React --> Express
    Express --> AuthMW
    AuthMW --> Controllers
    Controllers --> Mongo
    Controllers --> Uploads
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
    UI->>API: POST /api/orders with JWT and product IDs/quantities
    API->>Product: Reload products and validate visibility, market, variants, stock
    Product-->>API: Current prices, stock, variants, weight
    API->>Settings: Read COD configuration
    API->>API: Calculate prices, shipping, fees and paymentStatus=pending
    API->>Product: Reserve/decrement stock
    API->>Order: Create order snapshot
    Order-->>API: Persisted order
    API--)Courier: Attempt async dispatch (currently not_configured/unsupported)
    API-->>UI: 201 order and pending payment status
    UI->>Cart: Clear cart after successful order
    UI-->>Customer: Confirmation; online payment is not claimed as captured
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

For the requirements-oriented diagrams and acceptance criteria, see [`SRD.md`](./SRD.md). For runtime/deployment diagrams, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).
