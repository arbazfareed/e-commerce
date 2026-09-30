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
| POST | `/api/auth/login` | Shopper/public, rate limited | Accepts email/username and password; never issues tokens for administrator accounts |
| POST | `/api/auth/admin/login` | Public credential login; admin account required | Separately rate limited; accepts credentials only when the account has `isAdmin: true`; failures use a generic credential response |
| PATCH | `/api/auth/password` | User | Changes the authenticated user's password |
| PUT | `/api/auth/admin/customer-password` | Admin | Emails a non-admin customer a one-time reset link |
| POST | `/api/auth/password/reset/request` | Public/rate limited | Requests an email reset link; returns the same generic confirmation for unknown/admin addresses and email delivery failures |
| POST | `/api/auth/password/reset` | Public/rate limited | Consumes a reset token and saves the customer's new password |
| GET | `/api/auth/profile` | User | Returns current profile without password |
| GET | `/api/auth/session` | User | Verifies JWT session and returns current user |

Registration accepts `name`, `username`, `email`, `password`, `phone`, `country`,
and `city`. Passwords must be at least eight characters. Production credentials
must use stronger operational policy than the minimum application rule.
Administrator login is isolated from shopper login at the API boundary; the
browser route alone does not grant admin access. The admin endpoint permits five
failed attempts per IP per 15 minutes, while successful requests are excluded
from the failure count. The current limiter uses process-local memory; use a
shared rate-limit store and configure trusted proxy hops correctly for a
multi-instance/reverse-proxy production deployment. This is a baseline, not a
replacement for administrator MFA/passkeys.
Changed/reset passwords must be at least 12 characters. Public and admin reset
requests email a random, single-use link that expires after 20 minutes; only its
SHA-256 hash and expiry are stored. Public requests are limited to five per 15
minutes per IP and use a generic response to reduce account enumeration. Resend
delivery requires `RESEND_API_KEY`, a verified `EMAIL_FROM` sender, and
`FRONTEND_URL` in the backend environment. Keep admin sessions private; do not
send passwords directly by email.

## Products

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/api/products` | Public/admin optional | Lists visible products; supports `category`, `subcategory`, `isLocal`, `search`, `minPrice`, `maxPrice`, `currency`, `sort`, `page`, and `limit`. Paginated requests return `{ items, pagination }`. Only an authenticated admin's `includeHidden=true` is honored |
| GET | `/api/products/categories` | Public/admin optional | Lists distinct visible categories; only an authenticated admin can include hidden records |
| GET | `/api/products/subcategories` | Public/admin optional | Lists visible subcategories; optional `category` narrows the results |
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

Search matches product name/description text and brand/model values. Sort values
are `newest`, `price-asc`, `price-desc`, `popular`, and `name`; price filters and
price sorts use the selected `currency` and active product discounts. Page size
defaults to 24 and is capped at 48.

## Orders

| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/api/orders` | Public/user optional | Guests are limited to eight requests per 15 minutes per IP and must include `guestContact.name` and `guestContact.email` (optional phone); signed-in orders use the account. Both paths validate products/address/payment and optional `couponCode`, recalculate totals, decrement stock, and create the order |
| GET | `/api/orders/my` | User | Lists current user's orders |
| GET | `/api/orders/:id` | User/owner or admin | Returns one authorized order |
| GET | `/api/orders` | Admin | Lists all orders |
| GET | `/api/orders/analytics` | Admin | Returns sales analytics aggregates |
| POST | `/api/orders/manual-cash` | Admin | Records manual cash sale |
| PUT | `/api/orders/:id/shipment` | Admin | Saves courier name, tracking number, and optional HTTPS tracking URL entered manually |
| PUT | `/api/orders/:id/status` | Admin | Updates order lifecycle status |

Supported payment method values are `COD`, `Cash`, `Manual Cash`, `JazzCash`,
`EasyPaisa`, `Stripe`, and `PayPal`. Only cash/COD behavior is implemented;
non-COD values are currently order metadata and do not capture funds. New
customer orders start with `paymentStatus: "pending"`; cash/COD orders become
paid only when marked Delivered. Manual cash records are marked paid when
created. Existing `isPaid` remains for compatibility.
Orders save `currency`, `couponCode`, and `couponDiscount`; historic orders
without an explicit currency infer it from the saved delivery country. Coupon
discounts are applied to the product subtotal before shipping and COD fees.
 
Guest orders are stored with `user: null` and a `guestContact` snapshot. They do
not appear in `/api/orders/my`; `/api/orders/:id` remains authenticated and
owner/admin-only, so there is no public order-ID lookup. Admin order lists can
identify guest orders by their saved contact details.

Order statuses are `Pending`, `Processing`, `Shipped`, `Delivered`, and
`Cancelled`. The admin UI retains all five status choices; the API validates
status values but does not enforce a transition graph. Inventory is restored
when cancellation occurs from Pending or Processing, but not after shipment.
Invalid status names return `400`.
Shipping is calculated server-side from country/city zone and item
weight. Courier dispatch outcome is recorded in `courierDispatchStatus`
(`pending`, `dispatched`, `manual_tracking`, `not_configured`, `unsupported`, or `failed`). Admins can save manual tracking details; this does not book a parcel or fetch live tracking events. Provider booking adapters and webhook integrations are not yet implemented.

## Coupons

| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/api/coupons/validate` | Public/rate limited | Limited to 30 checks per 15 minutes per IP; validates a code against current database prices, market, stock, currency, expiry, minimum order, and usage limit |
| GET | `/api/coupons` | Admin | Lists coupons and usage counts |
| POST | `/api/coupons` | Admin | Creates percentage or flat coupon |
| PUT | `/api/coupons/:id` | Admin | Updates coupon configuration |
| DELETE | `/api/coupons/:id` | Admin | Deletes coupon |

Coupon codes are normalized to uppercase. Flat discounts and minimum order
amounts are currency-specific. Checkout revalidates every coupon and claims
limited usage atomically; it never trusts a browser-submitted discount amount.

## Reviews and wishlists

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/api/reviews/product/:productId` | Public/user optional | Returns approved reviews, average/count, and the authenticated user's eligibility |
| POST | `/api/reviews` | User | Submits one review per product after a Delivered order; new reviews are pending moderation |
| GET | `/api/reviews/admin` | Admin | Lists reviews for moderation |
| PATCH | `/api/reviews/:reviewId/status` | Admin | Sets status to `pending`, `approved`, or `rejected` |
| GET | `/api/wishlist` | User | Lists saved visible products |
| POST | `/api/wishlist/:productId` | User | Saves a visible product |
| DELETE | `/api/wishlist/:productId` | User | Removes a saved product |

## Account cart

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/api/cart` | User | Loads account cart with current product data and stock bounds |
| PUT | `/api/cart` | User | Saves at most 100 product/variant lines; validates variants and clamps quantities to stock |

The browser merges its guest cart into the signed-in account at login; subsequent
cart changes are persisted for cross-device access. Local storage remains an
offline cache, scoped per account.

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
| GET | `/api/settings/public` | Public | Returns international-market availability, COD settings, and server-supported checkout methods (`COD` only until an online payment adapter is verified) |
| GET | `/api/settings` | Admin | Returns international/COD/courier/EasyPaisa configuration and secret-configured flags, never secret values |
| PUT | `/api/settings` | Admin | Updates international-market availability, COD and provider placeholders; secret inputs are encrypted before MongoDB storage |

`courierEnabled` and `easypaisaEnabled` are configuration flags only. Courier
booking and online payment capture remain disabled until a provider adapter,
signature verification, and required callbacks are implemented. Provider
secrets use AES-256-GCM and require `SETTINGS_ENCRYPTION_KEY` (at least 32
characters) in the backend environment. The key is never returned by an API;
keep it stable and back it up separately because losing it makes saved tokens
unreadable. Blank secret fields preserve their current value; use the explicit
clear controls to remove a saved secret.

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
