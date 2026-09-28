# IndusCart Architecture

This document describes the current IndusCart system as implemented in this repository.

## System overview

```mermaid
flowchart LR
    Customer[Customer browser or Android app]
    Admin[Admin browser]
    Frontend[React + Vite frontend\nfrontend/src]
    Capacitor[Capacitor Android wrapper\nfrontend/android]
    API[Express API\nbackend/server.js]
    Auth[JWT + bcrypt authentication]
    Email[Password reset email service\nResend HTTPS API]
    Mongo[(MongoDB)]
    Uploads[(Product uploads\nbackend/uploads)]
    Courier[Optional courier provider]

    Customer --> Frontend
    Admin --> Frontend
    Capacitor --> Frontend
    Frontend -->|REST / JSON| API
    API --> Auth
    API --> Mongo
    API --> Uploads
    API -. optional dispatch .-> Courier
    API --> Email
```

## Local and Docker deployment

```mermaid
flowchart TB
    subgraph Local[Local development]
        Browser[Chrome or phone browser]
        Vite[Vite dev server\n:3000]
        Node[Node.js Express API\n:5000]
        LocalMongo[(Local MongoDB)]
        Browser --> Vite
        Vite --> Node
        Node --> LocalMongo
    end

    subgraph Compose[Docker Compose]
        Nginx[Nginx frontend container\n:3000]
        Backend[Backend container\n:5000]
        Mongo[(Mongo container)]
        VolumeDB[(mongo_data volume)]
        VolumeUploads[(uploads_data volume)]
        Nginx --> Backend
        Backend --> Mongo
        Mongo --> VolumeDB
        Backend --> VolumeUploads
    end

    Local -. alternative runtime .-> Compose
```

## Browser request flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant API as Express API
    participant Guard as Auth middleware
    participant DB as MongoDB

    User->>UI: Browse, sign in, or submit an order
    UI->>API: HTTP request using VITE_API_URL
    API->>Guard: Validate JWT for protected routes
    Guard-->>API: User/admin identity
    API->>DB: Read or update data
    DB-->>API: Result
    API-->>UI: JSON response
    UI-->>User: Render page, cart, order, or admin result
```

## Main backend modules

| Area | Entry points | Responsibility |
|---|---|---|
| Authentication | `routes/authRoutes.js`, `controllers/authController.js` | Registration, login, session verification, own-password change, one-time customer reset links |
| Products | `routes/productRoutes.js`, `controllers/productController.js` | Catalog, visibility, categories, variants, images, stock |
| Orders | `routes/orderRoutes.js`, `controllers/orderController.js` | Checkout validation, order creation, status updates, analytics |
| Support | `routes/supportRoutes.js`, `controllers/supportController.js` | Customer support tickets and admin handling |
| Settings | `routes/settingsRoutes.js`, `controllers/settingsController.js` | COD, courier, and store configuration |
| Persistence | `models/*.js`, `config/db.js` | MongoDB schemas and connection |
| Security | `middleware/authMiddleware.js`, `config/env.js` | JWT protection, admin authorization, environment validation |
| Email | `services/emailService.js` | Sends customer reset links through Resend when configured |

## Data model

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER o|--o{ SUPPORT_TICKET : creates
    ORDER ||--|{ ORDER_ITEM : embeds
    PRODUCT o|--o{ ORDER_ITEM : source_reference

    USER {
        string id
        string name
        string email
        string password_bcrypt_hash
        boolean isAdmin
    }
    PRODUCT {
        string id
        string name
        string category
        number pricePKR
        number priceUSD
        number stock
        boolean isVisible
        boolean isLocal
    }
    ORDER_ITEM {
        string productId_optional
        string name_snapshot
        number price_snapshot
        number quantity
        string selectedColor
        string selectedSize
    }
    ORDER {
        string id
        string userId
        string status
        number totalPrice
        string paymentMethod
    }
    SUPPORT_TICKET {
        string id
        string userId
        string status
        string subject
    }
    SYSTEM_SETTINGS {
        string id
        boolean codEnabled
        string courierProvider
        number codFee
    }
```

    `ORDER_ITEM` is an embedded order subdocument, not its own collection; manual
    cash items may have a null Product reference. `SYSTEM_SETTINGS` is read during
    checkout but does not have a stored relationship to an Order. Password reset
    stores only a hidden token hash and expiration on `User`.

## Frontend structure

- `frontend/src/App.jsx` defines route composition.
- `frontend/src/pages/` contains customer, authentication, cart, order,
  support, and admin screens.
- `frontend/src/components/` contains shared UI such as the navbar and product
  cards.
- `frontend/src/context/` contains authentication and cart state.
- `frontend/src/utils/axiosConfig.js` centralizes API and asset URLs.
- `frontend/android/` is the Capacitor-generated Android project.

## Configuration and storage

| Configuration | Location | Purpose |
|---|---|---|
| `MONGO_URI` | `backend/.env` | MongoDB connection |
| `JWT_SECRET` | `backend/.env` | JWT signing secret |
| `PORT` | `backend/.env` | API listening port |
| `CORS_ORIGINS` | `backend/.env` | Optional browser-origin restriction |
| `FRONTEND_URL` | `backend/.env` | Base URL used to create customer reset links |
| `RESEND_API_KEY`, `EMAIL_FROM` | `backend/.env` | Server-side reset email delivery through a verified sender |
| `VITE_API_URL` | `frontend/.env` | API and upload base URL |
| Product images | `backend/uploads/` or Docker `uploads_data` | Uploaded product files |
| MongoDB data | MongoDB or Docker `mongo_data` | Application records |

Never commit `.env` files, database credentials, signing keys, or production
API keys. See [`PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) before
accepting real customers or payments.

## Related documentation

- [Main README](../README.md)
- [Technical Guide](./TECHNICAL_GUIDE.md)
- [Local Run Guide](./LOCAL_RUN_GUIDE.md)
- [User Guide](./USER_GUIDE.md)
- [Android Guide](./ANDROID_GUIDE.md)
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md)
- [Testing Guide](./TESTING_GUIDE.md)
