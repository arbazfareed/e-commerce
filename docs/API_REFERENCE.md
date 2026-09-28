# IndusCart API Reference

Base URL is configured by `VITE_API_URL`, commonly
`http://localhost:5000`. Protected endpoints require:

```text
Authorization: Bearer <JWT>
```

Admin endpoints additionally require the authenticated user's `isAdmin` flag.

## Health

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/` | Public | API running text |
| GET | `/health/live` | Public | Returns process liveness |
| GET | `/health/ready` | Public | Returns database readiness; `200` when connected, `503` otherwise |

## Authentication

| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/api/auth/register` | Public/rate limited | Creates account and returns user plus JWT |
| POST | `/api/auth/login` | Public/rate limited | Accepts email/username-compatible identifier and password |
| PATCH | `/api/auth/password` | User | Changes the authenticated user's password |
| PUT | `/api/auth/admin/customer-password` | Admin | Emails a non-admin customer a one-time reset link |
| POST | `/api/auth/password/reset` | Public/rate limited | Consumes a reset token and saves the customer's new password |
| GET | `/api/auth/profile` | User | Returns current profile without password |
| GET | `/api/auth/session` | User | Verifies JWT session and returns current user |

Registration accepts `name`, `username`, `email`, `password`, `phone`, `country`,
and `city`. Passwords must be at least eight characters. Production credentials
must use stronger operational policy than the minimum application rule.
Changed/reset passwords must be at least 12 characters. Admin reset requests
email a random, single-use link that expires after 20 minutes; only its SHA-256
hash and expiry are stored. Resend delivery requires `RESEND_API_KEY`, a verified
`EMAIL_FROM` sender, and `FRONTEND_URL` in the backend environment. Keep admin
sessions private; do not send passwords directly by email.

## Products

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/api/products` | Public/admin optional | Lists visible products; supports `category` and `isLocal`. Only an authenticated admin's `includeHidden=true` is honored |
| GET | `/api/products/categories` | Public/admin optional | Lists distinct visible categories; only an authenticated admin can include hidden records |
| GET | `/api/products/:id` | Public | Returns one visible product |
| POST | `/api/products` | Admin | Creates product with multipart `images` uploads |
| PUT | `/api/products/:id` | Admin | Updates product and optionally replaces/extends images |
| DELETE | `/api/products/:id` | Admin | Deletes product and local image files |

Product fields include `name`, `description`, `category`, `subcategory`, `brand`,
`model`, `colors`, `sizes`, `pricePKR`, `priceUSD`, `discountPercent`,
discount dates, `isVisible`, `isLocal`, `stock`, and `weightKg`.

Uploads accept JPG/JPEG/PNG/WEBP and are limited to 5 MiB per file and five
images per product. The server checks both the declared type/extension and the
file signature. Product files are served from `/uploads/<filename>`.

## Orders

| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/api/orders` | User | Validates products/address/payment, recalculates totals, decrements stock, creates order |
| GET | `/api/orders/my` | User | Lists current user's orders |
| GET | `/api/orders/:id` | User/owner or admin | Returns one authorized order |
| GET | `/api/orders` | Admin | Lists all orders |
| GET | `/api/orders/analytics` | Admin | Returns sales analytics aggregates |
| POST | `/api/orders/manual-cash` | Admin | Records manual cash sale |
| PUT | `/api/orders/:id/status` | Admin | Updates order lifecycle status |

Supported payment method values are `COD`, `Cash`, `Manual Cash`, `JazzCash`,
`EasyPaisa`, `Stripe`, and `PayPal`. Only cash/COD behavior is implemented;
non-COD values are currently order metadata and do not capture funds. New
customer orders start with `paymentStatus: "pending"`; cash/COD orders become
paid only when marked Delivered. Manual cash records are marked paid when
created. Existing `isPaid` remains for compatibility.

Order statuses are `Pending`, `Processing`, `Shipped`, `Delivered`, and
`Cancelled`. The admin UI retains all five status choices; the API validates
status values but does not enforce a transition graph. Inventory is restored
when cancellation occurs from Pending or Processing, but not after shipment.
Invalid status names return `400`.
Shipping is calculated server-side from country/city zone and item
weight. Courier dispatch outcome is recorded in `courierDispatchStatus`
(`pending`, `dispatched`, `not_configured`, `unsupported`, or `failed`). The
service can attempt dispatch asynchronously, but provider adapters are not
currently implemented, so selecting a provider does not book a shipment.

## Support tickets

| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/api/support/tickets` | User | Creates authenticated ticket |
| POST | `/api/support/tickets/guest` | Public | Creates guest ticket |
| GET | `/api/support/tickets/my` | User | Lists current user's tickets |
| GET | `/api/support/tickets` | Admin | Lists all tickets |
| PUT | `/api/support/tickets/:id/status` | Admin | Sets `Open` or `Resolved` |
| PUT | `/api/support/tickets/:id/reply` | Admin | Saves admin reply text |

Ticket creation accepts `name`, `email`, `subject`, `message`, and optional
`orderId`. Notifications are not sent automatically.

## Settings

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/api/settings/public` | Public | Returns checkout-safe COD settings |
| GET | `/api/settings` | Admin | Returns store settings and whether courier key is configured |
| PUT | `/api/settings` | Admin | Updates COD/courier settings |

The courier API key is selected out of normal model responses and is never
returned as plaintext by the settings controller.

## Error behavior

Typical responses are JSON objects with a `message` field. Common status codes:

- `400` invalid input, unsupported payment, unavailable product, or invalid state
- `401` missing/invalid JWT or missing user
- `403` authenticated user lacks permission
- `404` product, order, or ticket does not exist
- `409` checkout stock changed during reservation
- `500` unexpected server error

## Source of truth

- Route definitions: `backend/routes/`
- Controller behavior: `backend/controllers/`
- Schemas: `backend/models/`
- Authentication: `backend/middleware/authMiddleware.js`
- Frontend API wrappers: `frontend/src/pages/admin/adminApi.js` and
  `frontend/src/utils/axiosConfig.js`
