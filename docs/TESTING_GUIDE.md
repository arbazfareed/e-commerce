# IndusCart Testing Guide

This guide maps the tests that exist in the repository, gives the exact local
commands to run them, and supplies manual end-to-end cases for important
customer, administrator, and operator journeys.

**Test status is not implied by presence in this list.** Run the command and
record its result for the change/release being reviewed. Some API scenarios
skip when MongoDB is unavailable; Selenium is opt-in. A skipped case is not a
pass.

## 1. Test layers and commands

Run commands from the repository root unless a `cd` is shown.
On Windows PowerShell systems where execution policy blocks `npm.ps1`, invoke
the same npm CLI through `npm.cmd` (for example, `npm.cmd test`).

| Layer | Command | What it verifies |
|---|---|---|
| Backend syntax | `cd backend; npm run check` | Syntax checks the configured server, middleware, config, controller, route, and admin-script files. |
| Backend tests | `cd backend; npm test` | Runs all `backend/test/*.test.js` tests with Node's test runner. |
| Backend `test:unit` script | `cd backend; npm run test:unit` | Currently runs the same `test/*.test.js` glob as `npm test`; it is not an isolated unit-only selection. |
| Backend API/integration tests | `cd backend; npm run test:integration` | Runs the integration test file plus the backend test glob; Mongo-dependent cases may skip if no MongoDB is available. |
| Frontend tests | `cd frontend; npm test` | Runs Vitest tests under the frontend project. |
| Frontend focused route tests | `cd frontend; npm run test:ui` | Runs the route/UI smoke test glob. |
| Frontend production build | `cd frontend; npm run check` | Builds the Vite production bundle. |
| Selenium browser smoke | Start the app at `http://localhost:3000`, then in PowerShell run `cd backend; $env:RUN_SELENIUM = 'true'; node --test test/selenium.smoke.test.js` | Loads the storefront in Chrome/Chromium. Requires a browser and a running frontend. |

The repo's normal CI workflow runs the backend syntax check/tests and frontend
tests/build. It does not prove production payment, courier, email-delivery,
backup-recovery, or device behavior.

## 1.1 Latest local validation record

Validated on **2026-10-09** against the working tree for this documentation
update:

| Command | Result |
|---|---|
| `cd backend; npm.cmd run check` | Passed |
| `cd backend; npm.cmd test` | 42 tests: 41 passed, 1 skipped (opt-in Selenium browser smoke), 0 failed. MongoDB-backed integration cases ran and passed in this environment. |
| `cd frontend; npm.cmd test` | 15 test files passed; 38 tests passed. |
| `cd frontend; npm.cmd run build` | Passed; Vite reported non-blocking CJS API deprecation and a minified JavaScript chunk over 500 kB. |
| `git diff --check` | Passed; no whitespace errors. |

This is a record of one local run, not a permanent guarantee. Re-run the
commands and update this section when validating a later release.

## 2. Backend automated test inventory

Each row points to one or more named test assertions in the indicated file.
Keep this inventory synchronized when tests are added, removed, or renamed.

| Test file | Automated scenarios |
|---|---|
| `backend/test/env.test.js` | Accept valid development environment; reject a short staging JWT secret; enforce the User model's eight-character password minimum. |
| `backend/test/health.test.js` | Liveness reports the API process; readiness is unavailable while MongoDB is disconnected. |
| `backend/test/integration.api.test.js` | Root/liveness response; readiness response while disconnected; session checks do not consume the credential-attempt limit; coupon admin routes require auth while validation is public and rate-limited; guest checkout validates contact data without exposing order history; Mongo-backed guest COD persists contact privately (conditional on MongoDB); disabling international shopping blocks the global catalog and foreign checkout (conditional on MongoDB). |
| `backend/test/discountPricing.test.js` | Promotion inactive before start; inclusive promotion start/end dates; promotion inactive after end; correct PKR whole-unit and USD cent rounding. |
| `backend/test/couponPricing.test.js` | Percentage coupon rounding; flat coupon currency restriction and subtotal cap; expiry-date inclusivity; reject unmet minimum, exhausted usage, inactive coupon, and invalid discount. |
| `backend/test/zoneShipping.test.js` | Destination-zone shipping uses configured rates and item weight. |
| `backend/test/orderStatus.test.js` | Accept only supported order status values; restore stock only for cancellation before shipment. |
| `backend/test/manualCashSale.test.js` | Normalize valid cash-sale items and calculate total; reject empty names, negative prices, and invalid quantities; preserve explicitly entered zero cash amount. |
| `backend/test/productModel.test.js` | Enforce maximum product name, description, and category lengths. |
| `backend/test/imageSignatures.test.js` | Accept supported JPEG, PNG, and WEBP signatures; reject unsupported or extension/content-mismatched image data. |
| `backend/test/productImageSafety.test.js` | Retained images must belong to the product and are deduplicated; image deletion paths discard traversal components. |
| `backend/test/passwordManagement.test.js` | Admin sends a hashed, expiring, single-use reset link to a customer; includes role/rate-limit and reset-flow assertions in the Mongo-backed test (conditional on MongoDB). |
| `backend/test/shipmentTracking.test.js` | Trim/normalize manual shipment values and safe HTTPS links; reject unsafe links and oversized courier fields. |
| `backend/test/credentialVault.test.js` | Provider secrets encrypt/decrypt at rest; secret writes require a configured master key. |
| `backend/test/settingsSecurity.test.js` | Admin settings response exposes provider readiness without returning secrets; stored provider config cannot enable checkout without a payment adapter; international-market setting preserves the existing-store default and follows saved configuration. |
| `backend/test/salesAnalytics.test.js` | Analytics groups cash/online revenue and identifies top products. |
| `backend/test/metrics.test.js` | Prometheus endpoint exposes bounded HTTP metrics and order counters. |
| `backend/test/selenium.smoke.test.js` | Opt-in Chrome/Chromium browser loads the storefront; skipped unless `RUN_SELENIUM=true`. |

## 3. Frontend automated test inventory

| Test file | Automated scenarios |
|---|---|
| `frontend/src/tests/app.routes.test.jsx` | Storefront content; delayed admin-access hold and cancellation; reset/close invalid-code prompt after three tries; separate admin entry and portal routing; market setting hides/disables international mode; shopper/admin login screens and role rejection; administrator dashboard and session restoration; expired-session redirect without full reload; shopper/admin protected-route redirects; guest cart access; unknown-route page. |
| `frontend/src/tests/axiosSessionExpiry.test.js` | Expired API session clears local user/session state and notifies the app without a document reload. |
| `frontend/src/tests/cartContext.test.jsx` | Cart quantity cannot exceed stock; signed-in cart hydrates from and syncs to the server for cross-device persistence. |
| `frontend/src/tests/couponsPanel.test.jsx` | Admin coupon panel renders usable controls and its empty state. |
| `frontend/src/tests/csvExport.test.js` | CSV quotes delimiters and neutralizes spreadsheet formulas; product export contains inventory/price/visibility/variant fields; order export includes totals and guest contact fallback. |
| `frontend/src/tests/errorBoundary.test.jsx` | Error boundary presents recovery UI when a child throws during render. |
| `frontend/src/tests/forgotPasswordPage.test.jsx` | Public password-recovery form displays the non-enumerating confirmation. |
| `frontend/src/tests/guestCheckout.test.jsx` | Guest can submit COD checkout with required contact details. |
| `frontend/src/tests/invoicePage.test.jsx` | Invoice shows order, currency, packing slip mode, and print action; legacy order currency is inferred from saved delivery country. |
| `frontend/src/tests/navbarSearch.test.jsx` | Navbar search shows debounced live product results and supports Escape dismissal. |
| `frontend/src/tests/paymentConfiguration.test.jsx` | Checkout does not offer unimplemented payment gateways even when admin settings contain their configuration. |
| `frontend/src/tests/promotionCountdown.test.js` | Countdown reports days/hours/minutes; expired or invalid dates hide it. |
| `frontend/src/tests/reviewsPanel.test.jsx` | Review panel explains verified-purchase eligibility and moderation in the empty state. |
| `frontend/src/tests/shipmentTracking.test.jsx` | Admin can save manual shipment details without implying automatic booking; customer sees carrier reference and only a secure tracking link. |
| `frontend/src/tests/wishlistPage.test.jsx` | Wishlist shows saved product details and remove/move-to-cart actions. |

## 4. Manual end-to-end and release cases

Run these against a non-production environment with representative products,
accounts, settings, and database records. Record each case as **Pass**,
**Fail**, **Blocked**, or **Not run**, with build/commit, environment, date,
and defect reference. Do not enter real customer or payment data.

| ID | Actor / setup | Steps | Expected result |
|---|---|---|---|
| M-01 | Guest; visible products seeded | Open storefront; browse categories and a product detail page. | Public products and product details render; hidden products are not revealed. |
| M-02 | Guest; multiple products seeded | Search by product text/brand/model; filter category, subcategory, market, and price; change sort and page. | Results and pagination reflect the selected criteria; page size is no more than 48. |
| M-03 | Guest; product has color/size and stock | Add two variants of the same product; adjust each quantity; remove one line. | Lines remain distinct by selected variant; quantity never exceeds stock. |
| M-04 | Guest | Add items, refresh, then open `/cart`. | Guest cart survives browser reload in the same browser profile. |
| M-05 | Customer account and guest cart | Sign in after creating a guest cart; sign out and sign in as another account. | Cart synchronizes for the correct account; another account's cached cart is not exposed. |
| M-06 | Guest; COD enabled; eligible local product | Submit checkout with valid name, email, address, and optional phone. | Order is confirmed; backend-calculated price/shipping/COD fee is persisted; no public guest history lookup is available. |
| M-07 | Guest; COD order form | Submit missing/invalid contact or address details. | Checkout is rejected with a visible validation message and no order is created. |
| M-08 | Customer; catalog product | Change a displayed price or stock after loading checkout but before submit. | API rejects stale/invalid stock or uses current server-side price; client-supplied total is never authoritative. |
| M-09 | Pakistan-only product; foreign destination | Attempt foreign checkout, including with international shopping disabled. | API rejects an ineligible foreign order; UI market selection cannot bypass server policy. |
| M-10 | Coupon fixtures: percent, flat, expired, capped | Validate and apply each code; test wrong currency/minimum and exhausted use; attempt order submit after eligibility changes. | Invalid coupons are rejected; valid discount is server-calculated and usage is rechecked at order creation. |
| M-11 | Customer | Register, sign in, refresh protected page, sign out; try shopper/admin routes with wrong roles. | Session restores while valid; role-specific routes and APIs reject the wrong role. |
| M-12 | Customer; email provider configured in a test environment | Request recovery for existing and unknown emails; use the delivered link; reuse/expire it. | Public responses do not reveal account existence; only the valid first use within 20 minutes changes the password. |
| M-13 | Guest and customer | Submit support tickets; sign in to view own tickets. | Ticket persists; one customer's ticket list does not show another customer's tickets. |
| M-14 | Administrator; seeded ticket | Reply and change ticket status; inspect customer and admin support views. | Reply/status persist; non-admin cannot use admin ticket endpoints. |
| M-15 | Administrator | Create/edit/hide/delete a test product, category, variant, price, and stock. | Changes persist; hidden item leaves public results; checkout reflects current values. |
| M-16 | Administrator; representative image fixtures | Upload valid JPEG/PNG/WEBP, invalid signature/MIME, >5 images, and >5 MiB image. | Only allowed files within limits are stored; invalid files are rejected and partial files are cleaned up. |
| M-17 | Administrator; coupon/review fixtures | Create/edit/deactivate a coupon; approve/reject a review. | Changes persist; unapproved review is not public; coupon rules are enforced by API. |
| M-18 | Customer with delivered order; then customer without delivered order | Submit one review, submit duplicate, and submit review without a delivered purchase. | Only eligible first review is accepted; duplicate/ineligible review is rejected; accepted review awaits moderation. |
| M-19 | Customer | Save/remove wishlist products; move a saved product to cart; open wishlist in a second session. | Wishlist is account-persistent and actions update the correct cart/product. |
| M-20 | Administrator; order in Pending/Processing | Change status, then cancel; verify stock. Repeat cancellation after Shipped. | Valid status values persist; stock returns only for pre-shipment cancellation. Note that arbitrary valid status transitions are currently allowed. |
| M-21 | Administrator; order | Save courier/tracking name/reference with safe HTTPS link; test unsafe URL. | Manual tracking data persists and customer link is secure; unsafe links are rejected; no automated carrier booking is implied. |
| M-22 | Customer/admin authorized for order | Open invoice and packing slip; print or save as PDF; inspect old order without saved currency. | Correct authorized order details and currency render; legacy currency fallback follows delivery country. |
| M-23 | Administrator; representative order/product data | Export order and product CSV; open in a spreadsheet or inspect raw file. | Required fields are present, delimiters/quotes parse correctly, and formula-like values are neutralized. |
| M-24 | Administrator | Inspect dashboard low-stock, inventory, analytics, regional, and revenue panels; record a manual cash sale. | Figures derive from stored records; invalid/negative sale inputs are rejected; cash sale is represented in analytics. |
| M-25 | Administrator; saved settings | Disable international shopping and COD; revisit storefront and try checkout directly. | UI reflects public setting and server rejects disabled market/payment choices. |
| M-26 | API operator; MongoDB disconnected then connected | Request `/health/live` and `/health/ready` in both states. | Liveness indicates process state; readiness is 503 while DB is disconnected and 200 after connection. |
| M-27 | Local deployment operator | Run `docker compose up --build`; create test data; recreate containers without deleting volumes. | API/frontend become healthy and MongoDB/uploads persist through container recreation. |
| M-28 | Android test device/emulator; API reachable on LAN or HTTPS | Build/install debug APK; browse, sign in, add cart, and open an order. | App reaches the configured API and core views work; record device/OS/API URL. |
| M-29 | Mobile and desktop browsers | Test home, product, cart, checkout, support, sign-in, and admin at agreed viewports. | No blocking overflow or unusable controls; this is a manual check, not a full accessibility certification. |
| M-30 | MongoDB backup/restore operator | Back up a test database, restore into a disposable database, compare representative records. | Restored records are usable; document measured recovery time. Never run destructive restore against production without approved procedure. |

**Do not run real payment/courier acceptance cases:** payment capture,
provider callbacks/refunds, carrier booking, and automated tracking are not
implemented. Validate that the UI/API do not claim these are available.

## 5. Requirements traceability

Use [`SRD.md`](./SRD.md) for the full functional requirement IDs, use-case
specifications, core business rules, and non-functional requirements.
[`FEATURE_COVERAGE.md`](./FEATURE_COVERAGE.md) records the implementation
boundary for each capability. The table below links major requirements to
current automated evidence; uncovered acceptance steps remain manual or
unverified.

| Requirement area | Automated evidence | Additional validation |
|---|---|---|
| Authentication, role separation, session expiry | `app.routes.test.jsx`, `axiosSessionExpiry.test.js`, `integration.api.test.js`, `passwordManagement.test.js` | M-11, M-12 |
| Product discovery and UI navigation | `app.routes.test.jsx`, `navbarSearch.test.jsx` | M-01, M-02 |
| Cart and guest checkout | `cartContext.test.jsx`, `guestCheckout.test.jsx`, `integration.api.test.js` | M-03–M-09 |
| Prices, promotions, coupon policy | `discountPricing.test.js`, `couponPricing.test.js`, `couponsPanel.test.jsx`, `integration.api.test.js` | M-08–M-10, M-17 |
| Catalog/image safety | `productModel.test.js`, `imageSignatures.test.js`, `productImageSafety.test.js` | M-15, M-16 |
| Orders, shipping, status, cancellation | `zoneShipping.test.js`, `orderStatus.test.js`, `integration.api.test.js` | M-06–M-09, M-20 |
| Support | Route/API behavior is covered only where listed in the live test inventory | M-13, M-14 |
| Reviews and wishlist | `reviewsPanel.test.jsx`, `wishlistPage.test.jsx` cover selected UI behavior | M-18, M-19 |
| Tracking, invoice, export | `shipmentTracking.test.js`, `invoicePage.test.jsx`, `csvExport.test.js` | M-21–M-23 |
| Admin analytics/settings/cash sales | `salesAnalytics.test.js`, `metrics.test.js`, `manualCashSale.test.js`, `settingsSecurity.test.js` | M-24, M-25 |
| Runtime, backup, Android, responsive behavior | `health.test.js`, `integration.api.test.js`, opt-in `selenium.smoke.test.js` | M-26–M-30 |

## 6. Coverage gaps and interpretation

- Unit and selected route/component tests do not equal complete end-to-end
  coverage. In particular, concurrent stock reservation, complete checkout
  persistence under failure, support workflow, account isolation across every
  endpoint, and deployment recovery need additional automated tests.
- MongoDB-dependent integration cases skip if the database is unavailable.
  Inspect the test runner output and use a disposable database for those cases.
- Selenium is explicitly opt-in with `RUN_SELENIUM=true`; a normal backend
  test run can report it as skipped.
- There is no configured percentage-coverage gate, production response-time
  objective, uptime SLA, complete WCAG conformance result, or payment/courier
  sandbox test.
- A payment method value in an order is not evidence of captured funds.
  Likewise, saved courier metadata is not evidence of a carrier booking.
- Never use production credentials or personal data in test fixtures.
