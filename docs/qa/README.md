# IndusCart QA Pack

This is an implementation-aware QA checklist for the current IndusCart repository. It is a test guide, not evidence that every listed case is automated or that every suggested product behavior exists. Check **Pass / Fail / N/A** during a run and record the build, browser/device, test account, and date.

## Current implementation facts to use as expected behavior

- Cart contents are stored in browser `localStorage`; there is no `/api/cart` endpoint and no server cart merge on login.
- `/cart` is a protected frontend route. A guest can browse products and add them to local storage, but opening the cart or proceeding to checkout requires login.
- Product search, category/subcategory filtering, market filtering, and sorting happen in the browser after fetching `/api/products`. Search is immediate (not debounced); the API does not implement pagination, search, or sort query parameters.
- Selecting **All Products** resets category and subcategory filters but preserves the market choice. International mode intentionally hides Pakistan-only products (for example, Honey); the storefront displays a note explaining this. Recently Viewed is independent of active catalog filters and continues to show still-available products from the user's history.
- Order placement is `POST /api/orders` and requires a JWT. The server reloads product prices, checks visibility, market, variants, and stock, calculates shipping/COD, then creates the order.
- COD availability and fees are configurable. The COD threshold waives the fee when the product subtotal is greater than or equal to the threshold; a threshold of zero disables the threshold rule.
- JazzCash, EasyPaisa, Stripe, and PayPal may be recorded as order payment methods, but no payment capture is implemented; customer orders now report `paymentStatus: pending` until paid through a real integration. Courier dispatch outcome is stored on the order, but booking/tracking adapters are not implemented.
- Product uploads accept JPG/JPEG/PNG/WEBP with matching extension, MIME type, and file signature, at most 5 MiB per file and five images per product/request. The API does not re-encode images.
- Valid order statuses are `Pending`, `Processing`, `Shipped`, `Delivered`, and `Cancelled`. The admin UI retains every status option and the API does not enforce a transition graph. Stock is restored only when cancellation occurs from Pending or Processing; cancellation after shipment remains allowed but does not restock.
- Unknown frontend paths show a dedicated 404 page. The app is wrapped in a top-level React error boundary with a reload recovery action.

## 1. Boundary-value and data tests

### Cart and order quantities

| Input | Expected result |
|---|---|
| quantity 1, integer and within stock | Order request can proceed if all other checks pass |
| quantity 0, negative, decimal, non-numeric | API rejects with `400` and an invalid quantity message |
| quantity equal to stock | Accepted if stock remains available at reservation time |
| quantity greater than stock | API rejects with `400` and available-stock message |
| stock changes before reservation | API returns `409`; reserved stock from earlier items is restored |
| same product with different color or size | Kept as distinct cart entries by product/color/size key |
| quantity decremented below 1 in UI | Item is removed from local cart |
| 100/101 cart items or a maximum quantity | No product limit is currently specified; record observed behavior, do not assume a 100-item cap |

### Product prices, variants, and visibility

- Exercise both `pricePKR` and `priceUSD`: negative, zero, small positive decimal, large finite value, non-numeric, and missing.
- Product creation currently requires both prices to be truthy, so zero is rejected even though the model allows a minimum of zero. A negative value may fail model validation and currently can surface as `500`; track this as a validation/error-code defect, not as a desired result.
- Test discount values `-1`, `0`, `1`, `100`, `101`, plus invalid dates, reversed start/end dates, and active/not-yet-active/expired dates.
- Test a supplied color/size that exists, one that does not, and an omitted selection when the product has variants. The API rejects unavailable supplied values, but does not require choosing a variant.
- Hidden products are excluded from public list/category results; hidden product detail returns `404`; hidden products are rejected at checkout.
- A Pakistan-only product ordered to a non-Pakistan country is rejected. Test case/spacing variants as a robustness probe; current comparison behavior is exact for `Pakistan` in some checkout paths.

### Authentication and address

- Registration: missing name/email/password, malformed email, duplicate email/username (case variants), password lengths 7 and 8, and valid longer passwords.
- The implemented minimum password length is **8**. Passwords are bcrypt-hashed with 10 salt rounds.
- Login: email and username identifiers, uppercase/leading/trailing spaces, wrong password, unknown identifier, missing values, expired/tampered/missing JWT, and authenticated non-admin access to admin endpoints.
- Auth routes are rate-limited to 30 requests per 15 minutes per limiter key. Verify the returned throttling response; do not assume admin routes have their own rate limiter.
- Address: missing/blank street, city, or country; long values; punctuation and Unicode. Checkout UI requires street/city and uses a read-only country field; the API requires all three fields.
- The proposed 254-character email edge is useful as a robustness probe, but no application-level maximum is currently specified.

### Uploads and admin product data

- UI/API image count: 0, 1, 5, and attempted 6 (six must be rejected); also check retained + newly uploaded images on edit.
- File size: under, exactly at, and over 5 MiB; allowed extensions/MIME pairs; mismatched extension/MIME; renamed non-image data; unsupported SVG/GIF.
- Expected allowlist is JPG/JPEG/PNG/WEBP. The API checks file signatures but does not decode/re-encode image content.
- Check edit flows that retain/remove previous images and append new ones; total saved images must remain at five or fewer.
- Category/name empty and long values, custom category, stock `-1/0/1/large`, and weight `0/positive/negative` should be recorded. Product field validation is not uniformly converted to client-error status codes.

### COD threshold boundaries

With COD enabled and a nonzero threshold, test product subtotal at `threshold - 0.01`, exactly `threshold`, and `threshold + 0.01`. The admin setting is labeled PKR, but the current comparison does not convert the threshold for international USD orders; record this as a known currency inconsistency until the business chooses one shared currency or per-currency thresholds. Below threshold, flat or percentage fee applies; at/above threshold, COD fee is zero. Also test COD disabled, zero fee, zero threshold, and non-COD methods. Confirm the server response/order record, not just the browser total.

## 2. UI/UX manual checklist

### Storefront and product details

- [ ] Initial loading, successful empty catalog, API error, and retry behavior.
- [ ] Search matches product name/description; clear search; combine search with category/subcategory and local/global market filter.
- [ ] Sort by newest, price ascending/descending, and name; verify discounts are considered for price sorting.
- [ ] Product detail and variant selection; add to cart; verify distinct variants and cart count.
- [ ] Hidden and Pakistan-only product visibility in each market mode.
- [ ] Currency/price display matches the selected market/profile; inspect rounding at small and large amounts.
- [ ] Product images have meaningful alt text or a visible fallback when an image fails.

### Cart and checkout

- [ ] Cart survives reload in the same browser; removing/updating an item updates totals immediately.
- [ ] Confirm cart is browser-local and does not merge with a server account across devices.
- [ ] Guest access to `/cart` redirects to `/login`; after login the locally stored cart is still available in that browser.
- [ ] Checkout back button preserves address and payment selection.
- [ ] Blank street/city shows a useful message; server-side missing country and invalid/changed stock errors are handled visibly.
- [ ] COD option is hidden when public settings disable it; fee and waiver are visible before submission.
- [ ] Shipping zone/weight, product subtotal, COD fee, and grand total are checked against the created order.
- [ ] Submit button disables while placing the order; success confirmation and order-history navigation work.
- [ ] Verify non-COD selections are not represented to customers as successfully captured payments.
- [ ] Remove action is immediate in the current cart; a confirmation prompt is not an existing requirement.

### Admin and global experience

- [ ] Non-admin is redirected away from admin; admin can load dashboard/products/add/orders/settings.
- [ ] Product create/edit/hide/delete, category, images, stock, discount, and local/global fields persist after reload.
- [ ] Product deletion asks for confirmation; mutations show disabled/loading state and success/error feedback where applicable.
- [ ] Order status follows valid transitions; cancellation from Pending/Processing restores stock, while cancellation from Shipped does not. Invalid lifecycle transitions are rejected.
- [ ] COD settings save and are reflected by public checkout settings; courier key is never returned as plaintext in API responses.
- [ ] Unknown URL shows the 404 screen and provides a shop link; inject a render error in a test build to verify error-boundary recovery.
- [ ] Test responsive layouts at 360px, 768px, and 1440px, including admin tables/forms. Pagination is not currently implemented as a general 20-row/page behavior.
- [ ] Check API failure and empty states on each page; do not assume every page uses skeleton loading or a retry button.
- [ ] Check production build for accidental debug output. `console.error`/server logging exists for operational errors, so distinguish useful error logging from stray debug logs.

## 3. E2E scenarios

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| E2E-01 | Browse and filter | Open `/`, search, select category and market | Matching visible products appear; filters can be cleared |
| E2E-02 | Variant-aware cart | Open a product, add two different variants | Both variant rows remain distinct; count and totals update |
| E2E-03 | Cart persistence | Add item, reload same browser | Item remains from local storage |
| E2E-04 | Protected cart | As guest open `/cart` | Redirect to `/login`; browsing remains public |
| E2E-05 | Customer login | Sign in with valid user | Customer-only routes become accessible |
| E2E-06 | Place COD order | Authenticated user checks out with valid address and COD | `201`; order appears in `/orders`; stock decreases |
| E2E-07 | Tamper-resistant pricing | Change submitted item price in browser request | Created order uses database price/discount, not submitted price |
| E2E-08 | Stale stock | Reduce stock after adding item, then submit | Checkout rejected; no incorrect order; stock is not lost |
| E2E-09 | Admin access | Guest/customer opens `/admin` | Guest goes to login; customer goes to `/` |
| E2E-10 | Admin product visibility | Admin hides a product; revisit public catalog | Product absent from public list and detail is unavailable |
| E2E-11 | Market and currency | Switch local/global market | Global mode excludes Pakistan-only products; displayed currency/prices update |
| E2E-12 | Online method disclosure | Place/select a non-COD method in a test environment | Order metadata may be saved, but no payment capture is claimed |
| E2E-13 | Admin status handling | Select each of the five statuses, then submit an unknown status through the API | Any enumerated status saves; unknown status returns `400`; no transition-graph behavior is added |
| E2E-14 | Cancel after shipment | Set an order to Shipped, cancel it, inspect inventory | Status becomes Cancelled; shipped quantity is not returned to sellable stock |

## 4. API test cases

Use `Authorization: Bearer <JWT>` on protected routes. Assert status, JSON shape, ownership/role checks, and absence of stack traces/secrets in responses.

| Method and path | Cases to cover |
|---|---|
| `GET /health/live` | `200`, `{ status: "ok", service: "induscart-api" }` |
| `GET /health/ready` | `200` when MongoDB connected; `503` while disconnected |
| `POST /api/auth/register` | valid; missing fields; malformed/duplicate email; duplicate username; password under 8 |
| `POST /api/auth/login` | valid email/username; bad credentials; missing fields; auth rate limit |
| `PUT /api/auth/admin/customer-password` | admin required; unknown/admin account rejected; configured email delivery; no token/password leakage |
| `POST /api/auth/password/reset` | valid reset; expired/invalid/replayed token; minimum length; token consumed once |
| `GET /api/auth/profile`, `/api/auth/session` | missing/invalid/valid token; profile has no password |
| `GET /api/products` | visible products; category and `isLocal` filters; hidden exclusion; admin-only `includeHidden`; empty list |
| `GET /api/products/categories` | visible categories; hidden category excluded except authenticated admin with `includeHidden=true` |
| `GET /api/products/:id` | visible product; hidden/missing product `404`; malformed ID error response |
| `POST /api/products`, `PUT /api/products/:id` | admin only; fields/discount validation; image constraints; preserve/replace images |
| `DELETE /api/products/:id` | admin only; existing/missing product; image cleanup |
| `POST /api/orders` | auth required; empty products; unsupported method; missing address; bad quantity; bad variant; hidden/local-only product; tampered price; COD disabled; stock shortage/race |
| `GET /api/orders/my`, `GET /api/orders/:id` | own orders; other user's order is `403`; admin can inspect; missing order `404` |
| `GET /api/orders`, `/api/orders/analytics`, `POST /api/orders/manual-cash`, `PUT /api/orders/:id/status` | admin-only; valid/invalid status values; manual amount validation; cancellation stock restoration only before shipment; delivery paid-state behavior |
| `GET /api/settings/public` | checkout-safe fields only; no courier key |
| `GET/PUT /api/settings` | admin-only; valid COD settings; invalid fee mode/negative fee; key configured indicator without key disclosure |
| `/api/cart` | Not implemented; cart tests belong to frontend local-storage behavior |

## 5. Security checks (repository-grounded)

- [ ] Verify bcrypt hash and configured 10 salt rounds; never compare stored password to plaintext.
- [ ] Confirm production/staging rejects JWT secrets under 32 characters; confirm local test/development behavior separately.
- [ ] Confirm `/api/auth/*` rate limiting (30 requests / 15 minutes); test whether additional admin throttling is needed (not currently configured here).
- [ ] Confirm `helmet` and configured CORS behavior in production; test allowed and disallowed origins.
- [ ] Confirm admin middleware on product mutations, all-order/analytics/manual-cash/status endpoints, and private settings.
- [ ] Confirm checkout ignores client-supplied price and checks stock/visibility/market/variants server-side.
- [ ] Confirm uploads are restricted by extension, declared MIME, signature, and 5 MiB per file; note that full image decoding/re-encoding is not implemented.
- [ ] Confirm courier key is excluded from normal model selection and API response. It is not encrypted at rest by the current `SystemSettings` schema.
- [ ] Probe query/body injection strings and malformed Mongo IDs. Do not assume there is a general explicit `$`-operator rejection layer.
- [ ] Check error JSON for stack traces, JWTs, DB credentials, courier key, and internal details. Several controller-level catches return `error.message`, so inspect malformed IDs/validation failures carefully.
- [ ] Verify JSON body limit (1 MiB) and production frontend bundle for secrets. Never add private values to `VITE_*` variables.

## 6. Accessibility checklist

Manual verification remains necessary; there is no axe-core or screen-reader suite configured in the current frontend package.

- [ ] Images have useful alt text; decorative images have empty alt where appropriate.
- [ ] Every input has an associated visible label; validation errors are announced and associated with controls.
- [ ] All navigation, variant selection, cart actions, dialogs, and checkout work with keyboard only; focus is visible and logical.
- [ ] Hidden radio inputs in checkout/market pickers remain keyboard-operable and expose selected state to assistive technology.
- [ ] Modal/dialog focus management, Escape handling, and return focus (when applicable).
- [ ] Text and controls meet WCAG contrast expectations; do not rely on color alone for status.
- [ ] Page titles/headings and route changes communicate context; consider a skip-to-content link.
- [ ] Check 200% zoom/reflow and touch target size on narrow screens.
- [ ] Test at least NVDA + Firefox/Chrome on Windows and VoiceOver + Safari on iOS if available.

## 7. Manual device/browser matrix

Record actual result, build/version, and notes for each run; unexecuted rows are not passes.

| Device / viewport | Browser/runtime | Flow | Result / notes |
|---|---|---|---|
| Desktop 1440px | Chrome | Browse, search, customer checkout | |
| Desktop | Firefox | Login, product detail, order history | |
| Desktop | Edge | Admin product and order workflows | |
| Mobile 360px | Chrome Android | Browse, cart, checkout, support | |
| Mobile 360px | Safari iOS | Cart, address, order confirmation | |
| Tablet 768px | Chrome | Storefront and admin settings | |
| Android debug APK | Android WebView | Startup, API connection, cart, order history | |

## 8. Bug report template

- **Title:**
- **Severity:** Critical / High / Medium / Low
- **Environment:** build/commit, OS, browser or WebView, viewport/device
- **Account role:** guest / customer / admin (never include credentials or tokens)
- **Preconditions/test data:**
- **Steps to reproduce:**
  1.
  2.
- **Expected:**
- **Actual:**
- **Evidence:** screenshot/video, sanitized request/response, relevant logs
- **Reproducibility:** always / intermittent / once

## 9. Test plan and release gates

**Scope:** catalog, market display, cart, auth, checkout/order validation, COD, admin catalog/orders/settings, uploads, support, accessibility, responsive browser and Android smoke.

**Out of scope until integrated:** actual online payment capture/refunds/webhooks, courier booking/labels/tracking, production monitoring, and external notification delivery.

**Entry:** dependencies installed; test environment and MongoDB available for database-dependent cases; seeded customer/admin accounts and disposable products; no production secrets/data.

**Current automated commands:**

- Backend: `cd backend; npm test` or `npm run test:unit`; `npm run check` checks only its listed files.
- Frontend: `cd frontend; npm test` and `npm run build`.
- Selenium smoke: start the app at `http://localhost:3000`, then run backend `npm run test:selenium` with Chrome available.

**Exit guidance:** no open Critical/High defects for the tested release scope; all mandatory flows pass; failures and N/A items are explained. The repository has no configured coverage threshold, so do not claim an 80% cart/order coverage gate without adding coverage instrumentation and tests.

**Key risks:** checkout stock races/rollback, disagreement between client and server shipping/rates, COD threshold currency mismatch for international orders, price/currency rounding, error response detail, and unsupported payment/courier assumptions.

## 10. Regression checklist

- [ ] Home/catalog, search, filters, sorting, and local/global market.
- [ ] Product detail, colors/sizes, add-to-cart, variant identity, and local-storage persistence.
- [ ] Login, registration, logout/session verification, and guest/customer/admin route guards.
- [ ] Cart quantity update/removal, COD fee/threshold, address, back navigation, and empty cart.
- [ ] COD order, stock decrement, stale-stock rejection, server-side price calculation, order history/detail.
- [ ] Admin create/edit/hide/delete product, image limits, categories, and inventory.
- [ ] Admin order list/status, cancellation stock restoration, and analytics.
- [ ] COD settings and public settings; courier key not exposed.
- [ ] Support ticket customer/guest submission and admin handling.
- [ ] Responsive 360px/768px/desktop layout and Android APK launch/API connectivity.
- [ ] Backend tests/check, frontend tests/build, and optional Selenium smoke all recorded with outcomes.

## Existing automated coverage (baseline)

- Backend unit/pure logic: discount pricing, environment validation/password minimum, sales analytics, order transitions, image signatures/retention safety, product field limits, and manual-cash validation.
- Backend route-level smoke: root and health endpoints, including disconnected readiness.
- Frontend Vitest: storefront/login/protected-route smoke checks, 404/error-boundary rendering, and cart stock cap.
- Selenium: one opt-in browser storefront smoke test (`RUN_SELENIUM=true`).
- Not currently automated: complete auth/order/product CRUD integration, cart interactions, uploads, admin workflows, a11y, responsive viewports, or payment/courier integration.

See [`../TESTING_GUIDE.md`](../TESTING_GUIDE.md), [`../API_REFERENCE.md`](../API_REFERENCE.md), and [`../RELEASE_CHECKLIST.md`](../RELEASE_CHECKLIST.md) for related guidance.
