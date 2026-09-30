# IndusCart Feature and Use-Case Coverage

This page is the concise source of truth for what the repository currently does. **Implemented** means the behavior exists in code; **Partial** means a user flow or data model exists but important integration work is missing; **Planned** means it is not yet implemented. It does not claim that every implemented item has end-to-end test coverage.

## Customer use cases

| Use case | Status | Current behavior / boundary |
|---|---|---|
| Browse visible products and product details | Implemented | Express/MongoDB catalog; hidden products are excluded from public reads. |
| Search, category/subcategory filter, price range, sort, pagination | Implemented (server-side) | MongoDB query supports text/brand/model search, discounted-price range/sort, popularity, and 24-item pages. |
| Navbar live product search | Implemented | Debounced suggestions query the public catalog; selecting a result opens its product, while Enter/“See all” carries the query into the shop results. |
| Choose Pakistan or International market | Implemented | Admin can enable/disable the International button in store settings; disabled mode returns saved sessions to Pakistan and the API rejects foreign orders/global catalog requests. |
| Recently viewed | Implemented (browser-local) | Uses current product data and ignores active category/search filters, so previous views remain visible. Removed/hidden products are excluded from the public catalog. |
| Maintain a variant-aware cart | Implemented | Product/color/size identify a line. Guest carts persist locally; signed-in carts are saved to MongoDB and merged on sign-in, with account-scoped local cache. |
| Place a guest COD order | Implemented | Guests can open the cart, provide name/email (phone optional), and place COD orders. Order creation and coupon checks are rate-limited; guest contact is admin-visible, but guest orders have no public order-history/lookup route. |
| Save products to a wishlist | Implemented | Signed-in customers can save/remove products, view a dedicated page, and move saved products to the cart. MongoDB is the account source of truth. |
| Apply a promo code at checkout | Implemented | Admin-managed percentage/flat coupons include minimum order, currency, expiry, and global usage limits. The server recalculates and atomically claims usage when placing an order. |
| Rate and review purchased products | Implemented | Only customers with a delivered order can submit one review per product. New reviews require admin approval before public display. |
| Print an order invoice or packing slip | Implemented | Customer/admin order pages link to a browser-printable invoice and packing slip; browser printing can save as PDF. New orders save currency; historical orders infer it from delivery country. |
| Register, sign in, retain a session | Implemented | JWT/bcrypt authentication; registration minimum is eight characters. Users can change their own password while signed in; admins can reset non-admin customer passwords. |
| Request self-service password reset | Implemented | Public, rate-limited form sends a single-use 20-minute link with a generic confirmation to reduce account enumeration; requires configured Resend sender/API key. Email verification is not implemented. |
| Submit an order with server-validated product data | Implemented | Server reloads prices and checks product visibility, market eligibility, variants, and stock before creating an order. |
| Pay by COD/cash | Partial | COD settings/fees are supported; cash is considered paid on delivery. COD threshold currency handling needs a policy decision for USD orders. |
| Pay through JazzCash/EasyPaisa/Stripe/PayPal | Partial | Method values can be recorded; payment capture, provider redirects/intents, webhooks, reconciliation, and refunds are not implemented. Orders remain payment-pending. |
| View order history/status | Implemented | Customers see their own orders. Admin can set any valid enum status; the API does not enforce a transition graph. Cancellation restores inventory only before shipment. |
| Submit support tickets and read replies | Implemented | Guest/customer ticket creation and Mongo-backed admin list/status/reply are available through `/api/support`. Notifications are not sent. |

## Administrator use cases

| Use case | Status | Current behavior / boundary |
|---|---|---|
| Create, edit, hide, and delete products | Implemented | Admin-only API operations. Product name/category/description lengths are bounded. |
| Upload product images | Implemented | JPG/JPEG/PNG/WEBP, matching extension/MIME/signature, 5 MiB per file, maximum five images. Files are local disk/Docker-volume storage; no image re-encoding or object-storage adapter. |
| Manage product category, market, inventory, and discounts | Implemented | Product data is stored in MongoDB; checkout revalidates inventory and price. |
| Review orders, update status, view analytics | Implemented | Status enum validated; lifecycle transitions are not constrained. Status changes and payment state remain separate. |
| Export order/product CSV | Implemented | Admin can download all currently loaded orders and products. CSV values are quoted and formula-like cell values are neutralized; sales-summary CSV remains available. |
| Manage promo codes and review moderation | Implemented | Admin sections create/edit/delete coupons and approve/reject customer reviews. |
| Monitor low inventory | Implemented | Dashboard lists visible products with fewer than five units, including out-of-stock items, and links directly to stock editing. |
| Promotion countdown and scarcity badges | Partial | Cards show active/upcoming discounts, countdowns for date-limited active sales, and “Only N left” for stock 1–4; no inventory reservation timer is implied. |
| Enter courier tracking details | Implemented (manual) | Admin can save courier name, tracking number, and secure tracking link; customers see them in order details. This does not automatically book a shipment or sync carrier events. |
| Record manual cash sales | Implemented | Admin-only endpoint validates names, amounts, and quantities. |
| Configure COD and courier settings | Partial | COD settings affect checkout. Courier selection/key can be saved and dispatch outcomes are recorded, but carrier booking/tracking adapters are not implemented; courier key is not encrypted at rest. |
| Manage support tickets | Implemented | The support route and legacy AdminPage panel use the existing server-backed ticket endpoints. |
| Separate shopper and administrator sign-in | Implemented | The storefront has a distinct shield entry to `/admin/login`; shopper and admin APIs reject the opposite account role. Admin login limits failed attempts to five per IP per 15 minutes. |
| Change admin password and reset customer passwords | Implemented | The signed-in user can change their own password; admins email non-admin customers single-use reset links that expire after 20 minutes. Configure Resend credentials and a verified sender. Actions rely on the active session, so admin sessions must be kept private. |

## Platform and operations

| Capability | Status | Current behavior / boundary |
|---|---|---|
| Responsive web storefront/admin | Implemented | Chrome was checked at 360px; no horizontal overflow was observed in that run. Continue testing other devices/browsers. |
| Android package | Implemented | Capacitor packages the web app; production use needs a reachable HTTPS API and signed release setup. |
| Health, Docker, database backup/restore | Implemented | Health endpoints and scripts exist; production backup scheduling/restore drills remain operational tasks. |
| CI | Implemented | `.github/workflows/ci.yml` runs backend syntax/tests and frontend tests/build for configured branches/PRs. |
| Automated accessibility/performance gates | Partial | A Chrome Lighthouse snapshot of the storefront passed Accessibility, Best Practices, SEO, and Agentic Browsing at 100 after fixes. Lighthouse CI and broader page/device coverage are not configured. |

## Not implemented / next work

1. **Production commerce integrations:** real payment capture/webhooks/refunds and carrier booking/labels/tracking.
2. **Scale:** pagination for admin order/history endpoints and database-backed concurrency tests for simultaneous last-item orders.
3. **Production storage/security:** object storage for multi-instance image deployments; encrypt courier secrets at rest or use a managed secret store.
4. **Notifications:** transactional email/SMS beyond account recovery still require providers and operational delivery controls.
5. **Reliability:** database-backed concurrency tests for simultaneous last-item orders, and a transaction/compensation design spanning stock and order creation.
6. **Business policy:** decide whether COD thresholds are PKR-only with conversion or separate per-currency thresholds; client/server shipping-rate configuration should share one authoritative server source.
7. **Additional commerce workflows:** returns/refunds and multi-vendor settlement are not implemented.
8. **Administrator assurance:** add MFA/passkeys and a shared rate-limit store before a multi-instance production launch; the current five-failure limiter is process-local and IP-based.

## Related documents

- [README](../README.md)
- [UML diagrams](./UML_DIAGRAMS.md)
- [API reference](./API_REFERENCE.md)
- [QA checklist](./qa/README.md)
- [Software requirements](./SRD.md)
