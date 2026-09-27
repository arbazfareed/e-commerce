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
| GET | `/api/auth/profile` | User | Returns current profile without password |
| GET | `/api/auth/session` | User | Verifies JWT session and returns current user |

Registration accepts `name`, `username`, `email`, `password`, `phone`, `country`,
and `city`. Passwords must be at least six characters. Production credentials
must use stronger operational policy than the minimum application rule.

## Products

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/api/products` | Public | Lists visible products; supports `category`, `isLocal`, and admin-only-style `includeHidden` query behavior |
| GET | `/api/products/categories` | Public | Lists distinct categories; `includeHidden=true` includes hidden records |
| GET | `/api/products/:id` | Public | Returns one visible product |
| POST | `/api/products` | Admin | Creates product with multipart `images` uploads |
| PUT | `/api/products/:id` | Admin | Updates product and optionally replaces/extends images |
| DELETE | `/api/products/:id` | Admin | Deletes product and local image files |

Product fields include `name`, `description`, `category`, `subcategory`, `brand`,
`model`, `colors`, `sizes`, `pricePKR`, `priceUSD`, `discountPercent`,
discount dates, `isVisible`, `isLocal`, `stock`, and `weightKg`.

Uploads accept JPG/JPEG/PNG/WEBP and are limited to 5 MB per file. The API
accepts up to 10 files per request; the current admin UI presents up to five
image slots. Product files are served from `/uploads/<filename>`.

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
non-COD values are currently order metadata and do not capture funds.

Order statuses are `Pending`, `Processing`, `Shipped`, `Delivered`, and
`Cancelled`. Shipping is calculated server-side from country/city zone and item
weight. The service can attempt courier dispatch asynchronously, but provider
adapters are not currently implemented.

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
- `500` unexpected server error

## Source of truth

- Route definitions: `backend/routes/`
- Controller behavior: `backend/controllers/`
- Schemas: `backend/models/`
- Authentication: `backend/middleware/authMiddleware.js`
- Frontend API wrappers: `frontend/src/pages/admin/adminApi.js` and
  `frontend/src/utils/axiosConfig.js`
