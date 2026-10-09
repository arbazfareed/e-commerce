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

## 1.1 Recorded local validation

The application commands below were run locally on **2026-10-09**. They are a
snapshot of that run, not evidence for a later build. The additional changes
in this testing guide are documentation-only and do not change application
source; rerun the application commands when application code or dependencies
change. `git diff --check` is rerun after documentation edits.

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

### Execution protocol

1. **Identify the build.** Record the branch/commit, test date, and whether
   the source tree has uncommitted changes. A result applies only to the
   identified build and environment.
2. **Use an isolated environment.** Use a local or approved staging
   deployment with a disposable database, synthetic accounts, and harmless
   product fixtures. Never point destructive setup, restore, or cleanup steps
   at production.
3. **Check prerequisites.** Confirm the API, frontend, database, email test
   provider (only for reset cases), browser/device, and required settings are
   available. If a prerequisite is missing, mark the affected case Blocked
   and state what was unavailable; do not mark it Passed.
4. **Record fixture state.** Note non-sensitive fixture identifiers and
   relevant starting values such as stock, currency, coupon limit, order
   status, and saved settings. Do not record passwords, reset URLs, tokens,
   provider secrets, real contact details, or full environment files.
5. **Run and observe.** Follow the steps in order. Capture the observed UI
   outcome and, when relevant, sanitized HTTP status/response, browser and OS
   version, viewport, or console/network evidence. Expected behavior alone is
   not evidence of a pass.
6. **Clean up safely.** Remove only test records created for the run, using
   the application's normal admin actions or a verified disposable database
   reset. Preserve evidence needed for open defects; never remove shared or
   production data.
7. **Reconcile the run.** Record one result per selected test ID, link every
   failure to a defect ID, and report passed, failed, blocked, and not-run
   totals separately. A skipped automated test is not a pass.

The setup table and case-level `Not run` values below are reusable defaults,
not evidence that the current or a later build passed. For a release run,
create a fresh execution record and update it only from observed results.

| ID | Actor / setup | Steps | Expected result | Status |
|---|---|---|---|---|
| M-01 | Guest; visible products seeded | Open storefront; browse categories and a product detail page. | Public products and product details render; hidden products are not revealed. | Not run |
| M-02 | Guest; multiple products seeded | Search by product text/brand/model; filter category, subcategory, market, and price; change sort and page. | Results and pagination reflect the selected criteria; page size is no more than 48. | Not run |
| M-03 | Guest; product has color/size and stock | Add two variants of the same product; adjust each quantity; remove one line. | Lines remain distinct by selected variant; quantity never exceeds stock. | Not run |
| M-04 | Guest | Add items, refresh, then open `/cart`. | Guest cart survives browser reload in the same browser profile. | Not run |
| M-05 | Customer account and guest cart | Sign in after creating a guest cart; sign out and sign in as another account. | Cart synchronizes for the correct account; another account's cached cart is not exposed. | Not run |
| M-06 | Guest; COD enabled; eligible local product | Submit checkout with valid name, email, address, and optional phone. | Order is confirmed; backend-calculated price/shipping/COD fee is persisted; no public guest history lookup is available. | Not run |
| M-07 | Guest; COD order form | Submit missing/invalid contact or address details. | Checkout is rejected with a visible validation message and no order is created. | Not run |
| M-08 | Customer; catalog product | Change a displayed price or stock after loading checkout but before submit. | API rejects stale/invalid stock or uses current server-side price; client-supplied total is never authoritative. | Not run |
| M-09 | Pakistan-only product; foreign destination | Attempt foreign checkout, including with international shopping disabled. | API rejects an ineligible foreign order; UI market selection cannot bypass server policy. | Not run |
| M-10 | Coupon fixtures: percent, flat, expired, capped | Validate and apply each code; test wrong currency/minimum and exhausted use; attempt order submit after eligibility changes. | Invalid coupons are rejected; valid discount is server-calculated and usage is rechecked at order creation. | Not run |
| M-11 | Customer | Register, sign in, refresh protected page, sign out; try shopper/admin routes with wrong roles. | Session restores while valid; role-specific routes and APIs reject the wrong role. | Not run |
| M-12 | Customer; email provider configured in a test environment | Request recovery for existing and unknown emails; use the delivered link; reuse/expire it. | Public responses do not reveal account existence; only the valid first use within 20 minutes changes the password. | Not run |
| M-13 | Guest and customer | Submit support tickets; sign in to view own tickets. | Ticket persists; one customer's ticket list does not show another customer's tickets. | Not run |
| M-14 | Administrator; seeded ticket | Reply and change ticket status; inspect customer and admin support views. | Reply/status persist; non-admin cannot use admin ticket endpoints. | Not run |
| M-15 | Administrator | Create/edit/hide/delete a test product, category, variant, price, and stock. | Changes persist; hidden item leaves public results; checkout reflects current values. | Not run |
| M-16 | Administrator; representative image fixtures | Upload valid JPEG/PNG/WEBP, invalid signature/MIME, >5 images, and >5 MiB image. | Only allowed files within limits are stored; invalid files are rejected and partial files are cleaned up. | Not run |
| M-17 | Administrator; coupon/review fixtures | Create/edit/deactivate a coupon; approve/reject a review. | Changes persist; unapproved review is not public; coupon rules are enforced by API. | Not run |
| M-18 | Customer with delivered order; then customer without delivered order | Submit one review, submit duplicate, and submit review without a delivered purchase. | Only eligible first review is accepted; duplicate/ineligible review is rejected; accepted review awaits moderation. | Not run |
| M-19 | Customer | Save/remove wishlist products; move a saved product to cart; open wishlist in a second session. | Wishlist is account-persistent and actions update the correct cart/product. | Not run |
| M-20 | Administrator; order in Pending/Processing | Change status, then cancel; verify stock. Repeat cancellation after Shipped. | Valid status values persist; stock returns only for pre-shipment cancellation. Note that arbitrary valid status transitions are currently allowed. | Not run |
| M-21 | Administrator; order | Save courier/tracking name/reference with safe HTTPS link; test unsafe URL. | Manual tracking data persists and customer link is secure; unsafe links are rejected; no automated carrier booking is implied. | Not run |
| M-22 | Customer/admin authorized for order | Open invoice and packing slip; print or save as PDF; inspect old order without saved currency. | Correct authorized order details and currency render; legacy currency fallback follows delivery country. | Not run |
| M-23 | Administrator; representative order/product data | Export order and product CSV; open in a spreadsheet or inspect raw file. | Required fields are present, delimiters/quotes parse correctly, and formula-like values are neutralized. | Not run |
| M-24 | Administrator | Inspect dashboard low-stock, inventory, analytics, regional, and revenue panels; record a manual cash sale. | Figures derive from stored records; invalid/negative sale inputs are rejected; cash sale is represented in analytics. | Not run |
| M-25 | Administrator; saved settings | Disable international shopping and COD; revisit storefront and try checkout directly. | UI reflects public setting and server rejects disabled market/payment choices. | Not run |
| M-26 | API operator; MongoDB disconnected then connected | Request `/health/live` and `/health/ready` in both states. | Liveness indicates process state; readiness is 503 while DB is disconnected and 200 after connection. | Not run |
| M-27 | Local deployment operator | Run `docker compose up --build`; create test data; recreate containers without deleting volumes. | API/frontend become healthy and MongoDB/uploads persist through container recreation. | Not run |
| M-28 | Android test device/emulator; API reachable on LAN or HTTPS | Build/install debug APK; browse, sign in, add cart, and open an order. | App reaches the configured API and core views work; record device/OS/API URL. | Not run |
| M-29 | Mobile and desktop browsers | Test home, product, cart, checkout, support, sign-in, and admin at agreed viewports. | No blocking overflow or unusable controls; this is a manual check, not a full accessibility certification. | Not run |
| M-30 | MongoDB backup/restore operator | Back up a test database, restore into a disposable database, compare representative records. | Restored records are usable; document measured recovery time. Never run destructive restore against production without approved procedure. | Not run |
| M-31 | Customer; recently viewed products seeded | Open multiple product details, return home, then hide one viewed product in admin and reload. | Recently viewed section shows current public data for previously viewed products; hidden/deleted items are not disclosed; history is browser-local. | Not run |
| M-32 | Admin; products with stock 0, 1, 4, and 5; dated discounts | Inspect storefront product cards/details and admin low-stock/recommendation/regional panels. | Stock under five is signaled on relevant customer/admin surfaces; stock five is not labeled below threshold; promotion countdown follows end date; recommendations are descriptive and do not imply guaranteed forecasts or stock reservation. | Not run |
| M-33 | Signed-in customer; COD enabled and eligible product | Place an authenticated order, then check own history/details; sign in as a second customer and request the first order. | Order uses server-calculated totals and belongs to the signed-in user; owner can view it; second customer cannot read it. | Not run |

**Do not run real payment/courier acceptance cases:** payment capture,
provider callbacks/refunds, carrier booking, and automated tracking are not
implemented. Validate that the UI/API do not claim these are available.

### 4.1 Detailed manual test-case specifications

The case index above is the execution checklist. These specifications define
repeatable test data, steps, and expected outcomes. Execute against a disposable
development/staging environment. For each run, replace **Actual result** and
**Status** with the observed evidence; all cases start as **Not run**. Attach a
sanitized screenshot, response, or test-order ID when useful. Never place
passwords, JWTs, real customer information, or secrets in tester notes.

#### Catalog, privacy, and market

**TC-001 — Storefront and catalog render (M-01)**<br>
**Scenario:** Open the customer landing page and inspect product cards.<br>
**Preconditions:** API and frontend are running; at least two visible products
and one hidden product are seeded.<br>
**Steps:** (1) Open `/` in a clean browser profile. (2) Wait for catalog
content. (3) Open a visible product. (4) Return to the catalog.<br>
**Expected:** Storefront title, controls, and visible products render; the
visible product detail route displays its data; no hidden product card appears.
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
browser/version and product fixture IDs.

**TC-002 — Product text search and suggestions (FR-06, FR-28)**<br>
**Scenario:** Find a product by its searchable text.<br>
**Preconditions:** Seed products with unique name, brand, and model terms.<br>
**Steps:** (1) Enter a unique name fragment in navbar search. (2) Wait for
debounced suggestions. (3) Select a suggestion. (4) Repeat using Enter or
“See all”; search by brand/model. (5) Press Escape while suggestions are open.<br>
**Expected:** Suggestions are relevant and lead to the selected product;
full-results navigation retains the query; Escape dismisses suggestions;
search by supported name/brand/model terms returns matching products only.
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
query, expected product IDs, and observed result count.

**TC-003 — Catalog filters, sorting, and pagination (FR-06, FR-40)**<br>
**Scenario:** Combine server-side catalog controls.<br>
**Preconditions:** Seed enough products across categories, subcategories,
prices, brands, markets, and popularity to span multiple pages.<br>
**Steps:** (1) Apply category and subcategory. (2) Set min/max prices. (3)
Change sort mode. (4) Navigate to another result page. (5) request a page limit
larger than 48 directly through the API.<br>
**Expected:** Each selection changes the displayed/API result set; price
filters use the current discounted price where applicable; page metadata is
consistent; default page size is 24 and server-enforced maximum is 48.
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Capture
query parameters and returned pagination metadata.

**TC-004 — Hidden-product confidentiality (FR-05, US-24)**<br>
**Scenario:** Check that a hidden product is not disclosed to public visitors.<br>
**Preconditions:** Create a hidden product with a unique, harmless sentinel
name/description; no credentials are used for public checks.<br>
**Steps:** (1) Search/browse the public storefront. (2) Request the public
catalog with filters and pagination. (3) Request the hidden product's public
detail URL/API ID. (4) Inspect rendered customer DOM and public API responses
for the sentinel. (5) Sign in as an authorized admin and verify the product
remains manageable.<br>
**Expected:** Sentinel details are absent from public cards, public API data,
and customer-rendered DOM; direct public lookup does not reveal hidden product
details; authorized admin can still manage it.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
the sentinel and sanitized response/result. IndusCart does not implement a
music tracklist or sitemap; do not invent sitemap pass criteria.

**TC-005 — Product detail, option selection, and availability (FR-07)**<br>
**Scenario:** Inspect a product with images, colors/sizes, and finite stock.<br>
**Preconditions:** Seed one visible product with multiple variants, images,
prices in both currencies, and known stock.<br>
**Steps:** (1) Open its detail route. (2) Inspect image, description, category,
and displayed price. (3) Select each available color/size. (4) attempt to add
an unavailable/missing option or quantity exceeding stock.<br>
**Expected:** Product data and price match the selected market; selected
variants are represented accurately; invalid or over-stock selection cannot
create a valid cart/order line.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
product ID, variant, and stock before/after.

**TC-006 — Pakistan/international market selection (FR-19)**<br>
**Scenario:** Verify market UI state and server enforcement.<br>
**Preconditions:** International shopping is enabled; seed a global product
and a Pakistan-only product.<br>
**Steps:** (1) Select Pakistan and inspect currency/results. (2) Select
International and inspect currency/results. (3) Disable international
shopping in admin settings. (4) Reload with global mode previously saved. (5)
Call the global catalog and foreign checkout API directly.<br>
**Expected:** Pakistan displays PKR; International displays USD and eligible
products while enabled; disabling reverts the saved frontend mode to Pakistan;
direct API requests for disabled/foreign market are rejected.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
setting state, request, status code, and displayed currency.

#### Account, cart, and checkout

**TC-007 — Registration and password minimum (FR-01)**<br>
**Scenario:** Create an account with valid and invalid credentials.<br>
**Preconditions:** Disposable email address not already registered.<br>
**Steps:** (1) Submit valid account fields and an eight-character password.
(2) Verify successful sign-in/session. (3) Attempt registration with a
shorter password and invalid/duplicate account data.<br>
**Expected:** Valid account succeeds; password shorter than eight characters
and invalid/duplicate data are rejected; no duplicate account is created.
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Do not
record the password or real email.

**TC-008 — Shopper/admin role separation (FR-02, FR-04)**<br>
**Scenario:** Verify sign-in entry points and server authorization.<br>
**Preconditions:** One disposable shopper account and one administrator
account; note the app portal mode configured for the test.<br>
**Steps:** (1) Sign in as shopper through `/login`. (2) Attempt admin route and
admin API. (3) Sign out and sign in as admin through `/admin/login`. (4)
Attempt shopper-only login with admin credentials and invoke one admin API
without/with a shopper token.<br>
**Expected:** Each role reaches only its intended workspace; wrong-role login
is rejected; protected admin API denies missing or shopper credentials even
if the UI is bypassed.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
portal mode and status codes, not tokens.

**TC-009 — Session verification, expiry, and logout (FR-03)**<br>
**Scenario:** Verify a valid session and recover from an expired session.<br>
**Preconditions:** Disposable shopper session and a method to expire/revoke it
in the test environment.<br>
**Steps:** (1) Sign in and refresh a protected route. (2) Verify profile/session
restoration. (3) Expire the session, request a protected resource, and observe
the app. (4) Sign out and attempt to revisit the protected route.<br>
**Expected:** Valid session restores; expired session is cleared in-app
without a forced document reload; logout removes local session and protected
route redirects to shopper sign-in.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
route and sanitized network status.

**TC-010 — Variant-aware guest cart and persistence (FR-09, FR-31)**<br>
**Scenario:** Maintain guest cart lines across navigation and reload.<br>
**Preconditions:** Public product with at least two available color/size
combinations and stock.<br>
**Steps:** (1) Add variant A. (2) Add variant B of the same product. (3)
Change quantity for each line, remove A, and navigate away. (4) Refresh and
reopen `/cart`.<br>
**Expected:** Each variant remains an independent line; quantity updates only
that line; removal does not remove the other variant; guest cart persists in
the same browser profile.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
expected and actual line keys (product/color/size).

**TC-011 — Account cart synchronization and isolation (FR-31)**<br>
**Scenario:** Verify account cart persistence without cross-account leakage.<br>
**Preconditions:** Two disposable customer accounts; one has a server cart and
one does not; same browser profile.<br>
**Steps:** (1) Add a guest item. (2) Sign in as account A and observe cart
merge/hydration. (3) Change quantity and reload. (4) Sign out and sign in as
account B.<br>
**Expected:** A's server cart hydrates and changes synchronize; guest cart
behavior follows the implemented merge; B does not see A's account cart or
account-scoped local cache.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Use
synthetic accounts and products only.

**TC-012 — Cart stock cap (FR-09)**<br>
**Scenario:** Prevent cart quantity above available stock.<br>
**Preconditions:** Product stock is known and less than the attempted
quantity.<br>
**Steps:** (1) Add the product. (2) Set quantity to stock. (3) Attempt to
increase by one through UI; repeat with direct cart state interaction if
available.<br>
**Expected:** Quantity never exceeds stock; cart state remains valid and the
customer receives clear availability feedback where applicable.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
stock and resulting quantity.

**TC-013 — Guest COD checkout succeeds (FR-10, FR-11, FR-26)**<br>
**Scenario:** Place a guest order with valid contact and address data.<br>
**Preconditions:** Disposable database; COD enabled; visible in-stock product
with known price/weight; no real payment is involved.<br>
**Steps:** (1) Add a product/variant. (2) Open cart and continue checkout. (3)
Enter guest name, valid email, optional phone, and complete delivery address.
(4) Submit COD. (5) Inspect confirmation and persisted order/product stock in
the test database.<br>
**Expected:** API returns successful order confirmation; order has no user
owner and contains guest contact; product subtotal, discount, zone shipping,
COD fee, currency, and total are calculated from server state; stock decreases
by ordered quantity.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Capture
synthetic order ID and sanitized totals.

**TC-014 — Guest checkout validation and privacy (FR-10, FR-26)**<br>
**Scenario:** Reject invalid guest input and prohibit public order lookup.<br>
**Preconditions:** Disposable database, valid test product, and one synthetic
guest order.<br>
**Steps:** (1) Submit empty cart and missing guest contact separately. (2)
Submit malformed contact/address and invalid quantity. (3) Attempt guest
`/api/orders/my` and direct `GET /api/orders/:id` without credentials.<br>
**Expected:** Each invalid order is rejected and no order is persisted; public
history and direct retrieval are denied; guest contact remains available only
through authorized admin order handling.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
status/body message and database count before/after.

**TC-015 — Server recalculates order price and stock (FR-10)**<br>
**Scenario:** Ensure browser data cannot set order price or overdraw stock.<br>
**Preconditions:** Test product has a known database price and stock; use
disposable order data.<br>
**Steps:** (1) Prepare checkout. (2) Change product price or stock in test DB
before submit. (3) Submit a tampered request containing an incorrect client
price/total. (4) Repeat when available stock is below requested quantity.<br>
**Expected:** Persisted totals use current server-calculated product prices
and configured rules; client totals are ignored; insufficient stock is
rejected and no overdrawn successful order is created.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
before/after DB values and order outcome.

**TC-016 — Zone shipping and COD fee (FR-11)**<br>
**Scenario:** Verify destination zone and item weight affect shipping and
configured COD fee.<br>
**Preconditions:** Disposable environment with known zone rates, product
weight, COD fee mode/value/threshold.<br>
**Steps:** (1) Calculate checkout for a destination in zone A. (2) Repeat for a
destination in zone B. (3) Change item weight and compare. (4) Repeat with COD
fee enabled/disabled and fee threshold crossed/not crossed.<br>
**Expected:** API uses configured destination-zone rates and item weight;
COD fee follows saved flat/percentage/threshold rules; disabled COD cannot be
selected.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Document
fixture rates and expected arithmetic; confirm currency policy for thresholds.

**TC-017 — Coupon validation and currency/minimum rules (FR-32)**<br>
**Scenario:** Validate percentage and flat coupons under valid and invalid
conditions.<br>
**Preconditions:** Create disposable valid percent/flat coupons and fixtures
for wrong currency and unmet minimum.<br>
**Steps:** (1) Apply each valid coupon to qualifying cart. (2) Calculate
discount and compare currency rounding/subtotal cap. (3) Try wrong currency,
below-minimum subtotal, inactive and expired coupons.<br>
**Expected:** Valid discount matches configured percent/flat rule and rounds
correctly (PKR whole unit/USD cents); flat discount does not exceed subtotal;
invalid coupons return rejection and do not reduce total.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
coupon fixture IDs and expected calculations.

**TC-018 — Coupon usage limit and checkout recheck (FR-32)**<br>
**Scenario:** Prevent use beyond a coupon's configured global limit.<br>
**Preconditions:** Disposable coupon with a small usage limit; test order
environment.<br>
**Steps:** (1) Validate coupon before limit is reached. (2) Use it to place
orders until the limit is reached. (3) Validate again. (4) Submit using a
previously validated coupon after usage is exhausted.<br>
**Expected:** Usage is tracked; once exhausted, validation and order-time
verification reject further use; failed order does not claim a successful
discount.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Avoid
concurrent production-like load; separate documented concurrency test needed.

**TC-019 — Payment-method availability and honest status (FR-13)**<br>
**Scenario:** Ensure unsupported online gateways are not offered as working
payment methods.<br>
**Preconditions:** Set test admin configuration to contain gateway-like
settings; payment adapter remains absent.<br>
**Steps:** (1) Open checkout. (2) Inspect available payment choices. (3)
Attempt a direct request selecting an unsupported online gateway. (4) Inspect
saved order payment status if accepted as a recorded method.<br>
**Expected:** UI does not present unimplemented gateways as operational; API
does not claim captured/settled payment; COD/cash behavior remains distinct.
No real payment request is sent.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** This
case verifies non-availability, not a payment-provider integration.

#### Password reset, support, and customer features

**TC-020 — Public password-reset request privacy and throttling (FR-27)**<br>
**Scenario:** Request recovery without disclosing whether an account exists.<br>
**Preconditions:** Test email service configured with a verified sender and
disposable inbox; one synthetic existing customer and one synthetic unknown
address.<br>
**Steps:** (1) Request reset for the existing address. (2) Request reset for
the unknown address. (3) Compare public response shape/message. (4) Make more
than five requests from one test IP inside 15 minutes.<br>
**Expected:** Existing/unknown address produce a generic public response;
eligible customer email is sent only when configured; request limiter returns
429 after allowed limit; no address/token is written in public logs or notes.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Use
provider test mode and redact inbox/token.

**TC-021 — Password-reset token expiry and one-time use (FR-27, FR-35)**<br>
**Scenario:** Accept one valid token and reject invalid, expired, or reused
tokens.<br>
**Preconditions:** Test account and reset email delivery; ability to control
test time or wait beyond token expiry.<br>
**Steps:** (1) Follow a valid link before 20 minutes and set a compliant new
password. (2) Sign in with new credentials. (3) Reuse the same token. (4)
Repeat with expired/malformed token.<br>
**Expected:** First valid reset with a password of at least 12 characters
changes password and consumes token; reuse, expiry, malformed token, or a
short new password is rejected without another password change; token itself
is hashed at rest.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Never
copy the link or token into this document.

**TC-022 — Change own password and admin customer reset (FR-35, FR-36)**<br>
**Scenario:** Check signed-in password change and administrator assistance.<br>
**Preconditions:** Disposable shopper and administrator accounts; email
provider configured for admin-triggered reset.<br>
**Steps:** (1) Change shopper's own password while authenticated. (2) Verify
old credentials fail and new credentials work. (3) As admin request reset for
a non-admin customer. (4) Try the protected admin endpoint as a shopper and
target an admin account.<br>
**Expected:** Own password update requires an active session; new password is
at least 12 characters and differs from current password; admin reset sends
expiring link to eligible customer; non-admin and prohibited target requests
are rejected.
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Redact
credentials and email.

**TC-023 — Guest/customer support ticket submission (FR-16)**<br>
**Scenario:** Submit valid and invalid tickets as guest and signed-in user.<br>
**Preconditions:** Disposable database; guest contact details and customer
account.<br>
**Steps:** (1) Submit a guest ticket with valid contact/message. (2) Submit a
customer ticket while authenticated. (3) Submit missing/invalid required
fields. (4) Sign in and open “my tickets.”<br>
**Expected:** Valid tickets persist with correct guest/user association;
invalid ticket is rejected; customer listing contains only that customer's
tickets. No email notification is assumed.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Use
synthetic support messages only.

**TC-024 — Admin support reply, status, and access (FR-16)**<br>
**Scenario:** Process a test support ticket as admin.<br>
**Preconditions:** Seed a ticket; create admin and shopper test accounts.<br>
**Steps:** (1) Open admin ticket list. (2) Reply to ticket. (3) Change status.
(4) Reopen customer view and verify reply/status. (5) Attempt admin endpoints
without admin credentials and with shopper credentials.<br>
**Expected:** Admin actions persist and are reflected in authorized customer
view; unauthorized calls are denied; unrelated customer ticket data is not
exposed.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
ticket ID and status values.

**TC-025 — Wishlist persistence and actions (FR-34)**<br>
**Scenario:** Add, remove, reload, and move a wishlist product to cart.<br>
**Preconditions:** Signed-in test customer and visible product.<br>
**Steps:** (1) Add product to wishlist. (2) Refresh/reopen wishlist. (3) Move
product to cart. (4) Remove it from wishlist. (5) Sign out and try direct
wishlist API access.<br>
**Expected:** Account wishlist persists; move-to-cart adds the product; remove
updates the list; unauthenticated access is rejected.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
product ID and cart result.

**TC-026 — Review eligibility, duplicate prevention, and moderation (FR-33)**<br>
**Scenario:** Submit eligible/ineligible reviews and inspect public visibility.<br>
**Preconditions:** Customer A has a delivered order containing product P;
customer B has no delivered order for P; admin moderation account available.<br>
**Steps:** (1) A submits a valid review. (2) A submits another for P. (3) B
submits for P. (4) As guest inspect public approved reviews. (5) Admin approves
then rejects a disposable review and recheck public output.<br>
**Expected:** One eligible review can be submitted; duplicate/ineligible
reviews are rejected; pending/rejected review is not public; approved review
appears in public listing; moderation requires admin.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
synthetic order/product/review IDs.

#### Administrator catalog, orders, and reporting

**TC-027 — Product create, edit, hide, delete (FR-07)**<br>
**Scenario:** Verify admin catalog CRUD and public visibility boundaries.<br>
**Preconditions:** Admin session and disposable test product.<br>
**Steps:** (1) Create product with prices, category, variants, stock, and
visibility. (2) Edit fields/stock. (3) Hide product and query public catalog.
(4) Unhide and verify. (5) Delete disposable product and verify it is removed.<br>
**Expected:** Authorized changes persist; hidden item is absent from public
API/view but available to admin; deleted product is no longer returned;
invalid/overlength fields are rejected.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Avoid
deleting shared fixtures.

**TC-028 — Image upload type, count, size, and cleanup (FR-39)**<br>
**Scenario:** Enforce image upload constraints.<br>
**Preconditions:** Admin session; harmless fixture images with known formats,
including a signature-mismatched file; disposable product.<br>
**Steps:** (1) Upload valid JPEG, PNG, and WEBP. (2) Upload unsupported
extension/MIME and mismatched binary signature. (3) Upload six files. (4)
Upload a file larger than 5 MiB. (5) Inspect product and upload directory.<br>
**Expected:** Valid files are accepted; mismatched/unsupported content,
more-than-five files, and oversized images return validation errors; rejected
partial files are cleaned and product state remains consistent.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Fixture
files must contain harmless test images, not arbitrary user files.

**TC-029 — Coupon administration (FR-32)**<br>
**Scenario:** Admin creates and updates promotion definitions.<br>
**Preconditions:** Admin account and disposable coupon fixtures.<br>
**Steps:** (1) Create percentage coupon. (2) Create flat coupon in a currency.
(3) Edit minimum, expiry, usage, and active values. (4) Delete disposable
coupon. (5) Attempt list/create/update/delete without admin credentials.<br>
**Expected:** Valid settings persist and affect checkout validation; invalid
discount/date/usage values are rejected; admin API calls require admin; no
secret or unrelated customer data appears in response.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
currency and date boundaries.

**TC-030 — Order history and ownership (FR-12, FR-15)**<br>
**Scenario:** Verify customer and admin access to orders.<br>
**Preconditions:** Two customer accounts, one order per account, and one guest
order in disposable DB.<br>
**Steps:** (1) Customer A lists orders and opens own order. (2) A requests B's
order ID. (3) Guest requests history and direct guest order. (4) Admin lists
and opens all test orders.<br>
**Expected:** Each customer sees only their own orders; unauthorized requests
are denied without leaking guest/order details; admin can perform authorized
order management.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Use
synthetic order IDs and inspect response for PII leakage.

**TC-031 — Status update and cancellation stock restoration (FR-12)**<br>
**Scenario:** Verify valid statuses and cancellation inventory rule.<br>
**Preconditions:** Test products with known stock; orders in Pending,
Processing, and Shipped states; admin session.<br>
**Steps:** (1) Update order to each allowed status value. (2) Submit an
unsupported status. (3) Cancel a Pending/Processing order and inspect stock.
(4) Cancel a Shipped order and inspect stock.<br>
**Expected:** Enum statuses are accepted; invalid value rejected; pre-shipment
cancellation restores stock once; post-shipment cancellation does not restore
stock. Arbitrary valid transitions may still be accepted and must be recorded
as a current limitation.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Capture
stock before and after each cancellation.

**TC-032 — Manual shipment details and safe links (FR-38)**<br>
**Scenario:** Record and display tracking details without a carrier adapter.<br>
**Preconditions:** Admin, customer, and test order; no real carrier booking.<br>
**Steps:** (1) Admin saves courier name, tracking number, safe HTTPS URL. (2)
Customer opens own order. (3) Admin submits HTTP, unsafe, or oversized values.
(4) Inspect wording and resulting order state.<br>
**Expected:** Valid trimmed values persist and customer sees a secure link;
invalid URLs/oversized values are rejected; UI does not imply automatic
booking or carrier event synchronization.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Use
synthetic tracking ID; do not visit real courier links.

**TC-033 — Invoice and packing slip (FR-37)**<br>
**Scenario:** Print authorized order details in both document modes.<br>
**Preconditions:** Customer/admin test order with saved currency and legacy
order without it.<br>
**Steps:** (1) Customer opens own invoice. (2) Toggle packing slip mode. (3)
Invoke print/Save as PDF. (4) Test legacy order currency fallback. (5) Request
another customer's document.<br>
**Expected:** Order details and correct currency render; print control works;
packing-slip view changes as intended; legacy currency derives from delivery
country; cross-account document access is denied.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Verify
paper/PDF output without customer PII.

**TC-034 — CSV export content and formula safety (FR-29, FR-41)**<br>
**Scenario:** Export representative product and order data safely.<br>
**Preconditions:** Admin session; records include commas, quotes, line breaks,
guest contact fields, and harmless values beginning with spreadsheet formula
characters.<br>
**Steps:** (1) Export products. (2) Export currently loaded orders. (3) Export
sales summary if available. (4) Inspect raw CSV and open a sanitized copy with
a spreadsheet viewer.<br>
**Expected:** Columns include documented product/order values; quoting and
escaping preserve field boundaries; formula-like values are neutralized;
guest contact fallback does not expose unrelated account data.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Never
include real customer information in exported fixtures.

**TC-035 — Dashboard analytics, low-stock, and manual cash sale (FR-17, FR-18)**<br>
**Scenario:** Compare dashboard summaries with controlled source fixtures.<br>
**Preconditions:** Admin session; disposable orders across supported channels,
dates, destinations, products; visible products with stock 0, 1, 4, and 5.<br>
**Steps:** (1) Open revenue, order-status, market/region, and product
recommendation panels. (2) Check low-stock list. (3) Record a valid manual
cash sale. (4) Attempt empty/negative/invalid quantity sales.<br>
**Expected:** Aggregates correspond to fixture records; visible products below
five units appear in low-stock alerts; valid sale persists and is reflected in
appropriate summaries; invalid sale fields are rejected.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Provide
expected arithmetic and chosen date range.

**TC-036 — Store settings and provider secret confidentiality (FR-19,
NFR-SEC-01)**<br>
**Scenario:** Ensure saved store controls work without disclosing credentials.<br>
**Preconditions:** Admin session; disposable global settings; provider secret
test fixture only.<br>
**Steps:** (1) Read public settings. (2) Save international/COD settings. (3)
Read public settings again and verify UI/checkout response. (4) Inspect admin
settings response and logs for raw secret. (5) Configure gateway keys but do
not configure payment adapter; inspect checkout choices.<br>
**Expected:** Public endpoint returns only safe availability; provider secret
is not returned; market/COD settings take effect and API enforces them;
stored gateway config alone does not expose an unsupported payment option.
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Use
synthetic secrets; redact all output.

**TC-037 — Shopper/admin failed-login rate limits (NFR-SEC-03)**<br>
**Scenario:** Verify configured per-IP throttles without locking a shared
production account.<br>
**Preconditions:** Isolated test environment; test IP; disposable accounts.<br>
**Steps:** (1) Send no more than 30 general authentication requests in a
15-minute window and record boundary behavior. (2) Send five failed admin
login attempts, then another failed attempt in the same window. (3) Repeat
only after the window has expired or limiter state is reset safely.<br>
**Expected:** General auth limit is 30 requests/IP/15 minutes; failed admin
login limit is five/IP/15 minutes and returns the configured 429 response.
Counters are process-local, not a distributed guarantee.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Do not
test against production or a shared NAT with real users.

#### Platform, operations, and non-functional cases

**TC-038 — API liveness, readiness, and metrics (FR-20, NFR-AVL-01,
NFR-OBS-01)**<br>
**Scenario:** Verify process and database health signals.<br>
**Preconditions:** Test API started; ability to stop/disconnect test MongoDB.<br>
**Steps:** (1) Request `/health/live`. (2) With DB disconnected request
`/health/ready`. (3) Connect DB and request readiness again. (4) Request
`/metrics` and inspect response content type and bounded labels.<br>
**Expected:** Live endpoint reports process OK; readiness reports 503 while DB
is disconnected and 200 when connected; metrics endpoint responds in
Prometheus format without unbounded sensitive labels.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Do not
expose metrics publicly without deployment controls.

**TC-039 — Environment configuration and startup failure (NFR-SEC-01)**<br>
**Scenario:** Confirm required configuration fails safely.<br>
**Preconditions:** Disposable process/environment; no production secret use.<br>
**Steps:** (1) Launch an isolated child process from a working directory
without a `.env` file and without `MONGO_URI`; capture startup failure. (2)
Repeat without `JWT_SECRET`. (3) In a separate isolated process set
`NODE_ENV=staging` or `production` and test short and known-placeholder JWT
secrets. (4) Start with valid test configuration.<br>
**Expected:** Missing required variables and weak/placeholder production
secrets produce explicit startup errors; no success-shaped startup occurs;
valid test configuration passes environment assertion.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Never
print or attach real environment files.

**TC-040 — Docker persistence and health (FR-20, NFR-DATA-02)**<br>
**Scenario:** Verify container startup and volume persistence.<br>
**Preconditions:** Docker available; test `.env` configured; no valuable
records in the test volumes.<br>
**Steps:** (1) Run `docker compose up --build`. (2) Wait for health checks.
(3) Create a disposable record/upload. (4) Recreate containers without `-v`.
(5) Verify record and upload. (6) Stop stack without deleting volumes.<br>
**Expected:** Services become healthy and data survives container recreation
because named volumes persist; commands do not delete volumes. Do not run
`docker compose down -v` except on approved disposable data.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
Docker version and service health.

**TC-041 — Database backup and restore drill (NFR-DATA-02)**<br>
**Scenario:** Restore a backup into a disposable database and compare records.<br>
**Preconditions:** Disposable Mongo database and backup path; documented tool
prerequisites; never use production target by default.<br>
**Steps:** (1) Confirm `backend/.env` points only to a disposable database and
add recognizable synthetic records. (2) From `backend`, run
`npm run db:backup`. (3) Configure a separate disposable restore database and
run `npm run db:restore -- .\backups\<BACKUP_FOLDER>` with the generated
folder. (4) Compare selected records. The restore command uses `mongorestore
--drop`; point it only at the disposable restore database.<br>
**Expected:** Backup artifact is created and restore reproduces the selected
records; record elapsed time and errors. This test does not imply scheduled,
encrypted off-site backups or established RPO/RTO.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Verify
restore target before execution; record backup filename without secrets.

**TC-042 — Android package smoke test (FR-21, FR-23, NFR-MOB-01)**<br>
**Scenario:** Build and launch the Capacitor Android app against a reachable
test API.<br>
**Preconditions:** Android SDK/Gradle prerequisites; configured LAN or HTTPS
test API; emulator/device with recorded OS version.<br>
**Steps:** (1) Run `cd frontend; npm run android:build`. (2) Install debug APK.
(3) Open storefront, product, cart, and sign-in. (4) Perform a safe test API
request.<br>
**Expected:** Build emits debug APK; app resolves configured API URL and
renders core screens; record device, OS, network, and failures. Debug build is
not a signed production release.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** No
production credentials or customer records.

**TC-043 — Responsive layout and keyboard access (NFR-USE-01, NFR-A11Y-01)**<br>
**Scenario:** Check high-value workflows at narrow and desktop viewports.<br>
**Preconditions:** Browser with responsive inspection; test guest and admin
sessions.<br>
**Steps:** (1) At 360 px and a tablet-width viewport inspect home, product,
cart, checkout, support, and sign-in. (2) Repeat key navigation using keyboard
only. (3) Inspect labels, focus visibility, dialogs, and horizontal overflow.
(4) Check admin dashboard at desktop and narrow viewport.<br>
**Expected:** Core controls remain visible/operable; no blocking horizontal
overflow; keyboard focus can reach and leave interactive elements; record
accessibility issues. This is not a WCAG certification.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
browser, OS, viewport, and screenshots with personal data hidden.

**TC-044 — Browser runtime and error recovery (NFR-MNT-01)**<br>
**Scenario:** Check browser runtime for actionable errors and verify error
boundary behavior.<br>
**Preconditions:** Frontend/backend running with test fixtures; browser
developer console available.<br>
**Steps:** (1) Load storefront and visit key routes. (2) Inspect console and
failed network requests. (3) Trigger a controlled component failure only in
test environment. (4) Observe recovery UI and navigate away/reload.<br>
**Expected:** No unexpected uncaught runtime errors or broken critical
requests; controlled render error shows recovery UI rather than blank page.
Non-critical provider/network errors are recorded, not silently described as
successful behavior.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Attach
sanitized console entries; exclude tokens, addresses, and personal data.

**TC-045 — Browser smoke with Selenium (FR-22)**<br>
**Scenario:** Confirm a real browser can load the storefront.<br>
**Preconditions:** Chrome/Chromium installed; frontend at
`http://localhost:3000`; Selenium prerequisites installed.<br>
**Steps:** From `backend`, run `$env:RUN_SELENIUM = 'true'; node --test
test/selenium.smoke.test.js`.<br>
**Expected:** Browser opens the storefront, locates the page body, and exits
cleanly. If prerequisites are missing, record Blocked rather than Passed.
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** This
smoke case alone does not verify checkout or all routes.

**TC-046 — CI validation and Android workflow boundary (FR-22, FR-23)**<br>
**Scenario:** Confirm repository CI validations and configured APK workflow
conditions.<br>
**Preconditions:** Test branch/PR or permitted manual workflow trigger;
repository secrets/variables are reviewed before dispatch.<br>
**Steps:** (1) Run backend syntax/tests and frontend tests/build locally. (2)
Inspect CI run for backend and frontend jobs. (3) Only when explicitly
required, trigger the APK workflow with a test HTTPS API URL and inspect
artifact.<br>
**Expected:** CI reports each required job independently; missing/failing job
is not treated as release pass; APK artifact is built only under configured
workflow conditions. CI does not validate production credentials, payment
capture, or courier services.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
run URL/commit, not secret values.

**TC-047 — Recently viewed products and privacy boundary (FR-42, US-25)**<br>
**Scenario:** Confirm viewed products reappear from current public catalog data
without exposing hidden or deleted items.<br>
**Preconditions:** Clean browser profile; at least three visible products and
one hidden product; storefront/API available.<br>
**Steps:** (1) Open two visible product details in sequence. (2) Return to
home/catalog and inspect recently viewed section. (3) Hide one previously
viewed product as admin, then reload the customer page. (4) Delete a separate
previously viewed disposable product and reload. (5) Open a second clean
browser profile.<br>
**Expected:** Recently viewed products are represented using current public
product data; hidden/deleted items are not exposed; data is browser-local and
is not presented as a server-synced account history.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
browser profile and product fixture IDs only.

**TC-048 — Stock badges, promotion countdown, and admin recommendations
(FR-30, FR-43, US-26)**<br>
**Scenario:** Verify thresholds/date labels and interpret dashboard
recommendations.<br>
**Preconditions:** Seed visible products with stock counts 0, 1, 4, and 5;
configure one active dated discount, one upcoming discount, one expired
discount; seed enough safe order data for dashboard panels.<br>
**Steps:** (1) Inspect product cards and product detail for each stock level.
(2) Inspect active/upcoming/expired promotion labels and countdown. (3) Open
admin low-stock, recommendation, and regional-campaign panels. (4) Follow a
low-stock item to its inventory editor.<br>
**Expected:** Out-of-stock and 1–4 remaining conditions are distinguished as
implemented; five units is not marked as fewer than five; active countdown
uses the configured end date and expired/invalid dates show no countdown;
low-stock panel includes visible products below five; recommendation and
campaign text is presented as decision support, not a forecast guarantee or
an automatically applied promotion.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Record
fixture stock and dates; note the time zone used for date-boundary checks.

**TC-049 — Authenticated checkout, order ownership, and history (FR-10,
FR-15, US-10)**<br>
**Scenario:** Place an account order and verify account ownership boundaries.<br>
**Preconditions:** Two disposable customer accounts; COD enabled; eligible
visible in-stock product; isolated database.<br>
**Steps:** (1) Sign in as customer A. (2) Add product and place COD order with
valid address. (3) Inspect order confirmation and `/api/orders/my`. (4) Open
the order detail and invoice. (5) Sign in as customer B and request A's order
ID and invoice route.<br>
**Expected:** Order is persisted with customer A as owner; A can see order
history/detail/invoice; payment remains in the correct COD pending state
until delivered; B cannot read A's order or document; product total/shipping/
fees are calculated server-side.<br>
**Actual result:** Not recorded. **Status:** Not run. **Tester notes:** Use
synthetic accounts and record order ID only.

### 4.2 Test execution and defect log

Create one execution record per environment/build. `Not run` is the initial
status; update it only from observed evidence. Use **Blocked** when a
precondition cannot be met, not when the test fails.

#### Result definitions

| Result | Use when |
|---|---|
| **Pass** | The observed result satisfies every applicable expected result for the test on the recorded build/environment. |
| **Fail** | An observed result differs from an expected result, including a security, privacy, data-integrity, or usability failure. Link a defect record. |
| **Blocked** | Execution could not proceed because a prerequisite, environment, or approved test fixture was unavailable. State the blocker; do not treat it as a pass. |
| **Not run** | The test was not attempted in this execution cycle. |
| **Skipped** | Use only for an automated runner's explicit skip result; report separately from manual blocked/not-run totals and never count it as passed. |

If a case partly passes and partly fails, mark it **Fail** and describe the
failed step. If the expected result is unclear or conflicts with implemented
behavior, do not silently change the expectation to fit the observed result:
record the ambiguity and resolve the requirement before accepting the case.

#### Per-test execution record

Create one row per test selected for the cycle. Keep the master case
specifications above unchanged as the baseline; store cycle-specific
observations here or in the project's approved issue/test tracker.

| Test ID | Result | Actual result / sanitized evidence reference | Defect ID | Retest result |
|---|---|---|---|---|
| TC-___ / M-___ | Not run | — | — | Not run |

Evidence should be sufficient for another tester to reproduce the result.
Prefer a sanitized screenshot, request/response status, test-run output, or
synthetic record ID. Redact authorization headers, cookies, reset links,
addresses, email/phone details, and secrets before attaching evidence.

#### Defect severity guide

Severity describes impact, not fix order. Assign severity from observed
impact; do not infer a production incident from a test-only failure.

| Severity | Guidance |
|---|---|
| **Critical** | Confirmed broad compromise or corruption that makes core store operation unsafe, such as unauthorized access to many customer records or destructive loss of production data. Escalate immediately; stop release. |
| **High** | A major customer/admin flow is unavailable, or an authorization, privacy, checkout-total, inventory, or order-ownership defect has a credible material impact. Block release of the affected scope until resolved or explicitly risk-accepted. |
| **Medium** | A bounded feature is incorrect or degraded, with a reasonable workaround and no demonstrated broad exposure or data loss. Track an owner and target release. |
| **Low** | Cosmetic, wording, or minor usability issue that does not materially impair the task or compromise data. Record and prioritize with the release owner. |

Severity and priority are distinct: release owners may prioritize a lower
severity item for timing or customer impact, but must not lower a security or
data-integrity severity to make a release appear clear.

| Execution field | Value |
|---|---|
| Test cycle / release | To be completed by tester |
| Commit / build identifier | To be completed by tester |
| Environment and API base URL (placeholder or sanitized) | To be completed by tester |
| Tester and execution date | To be completed by tester |
| Browser/device/OS where applicable | To be completed by tester |
| Passed / failed / blocked / not-run totals | To be completed after execution |

| Defect ID | Test case | Description and reproduction | Severity | Owner / resolution | Status |
|---|---|---|---|---|---|
| — | — | No defects recorded by this documentation update; enter a row only after an observed failure. | — | — | — |

The repository contains no verified project schedule, time-entry history,
client contract, invoice, or commercial amounts. They are intentionally not
invented from the unrelated supplied website example.

## 5. Requirements traceability

Use [`SRD.md`](./SRD.md) for the full functional requirement IDs, use-case
specifications, core business rules, and non-functional requirements.
[`FEATURE_COVERAGE.md`](./FEATURE_COVERAGE.md) records the implementation
boundary for each capability. The table below links major requirements to
current automated evidence; uncovered acceptance steps remain manual or
unverified.

### 5.1 User-story to detailed test-case traceability

User-story definitions and Given/When/Then criteria are in [`SRD.md`](./SRD.md),
section 5.2. These links identify concrete detailed test specifications; the
automated test files listed above supplement them but do not replace manual
end-to-end evidence.

| User story | Detailed test cases |
|---|---|
| US-01 Discover a product | TC-001–TC-004 |
| US-02 Review product details and variants | TC-005 |
| US-03 Choose a selling market | TC-006 |
| US-04 Keep a guest cart | TC-010 |
| US-05 Maintain my account cart | TC-011–TC-012 |
| US-06 Register as a shopper | TC-007 |
| US-07 Sign in and maintain a shopper session | TC-008–TC-009 |
| US-08 Recover my password | TC-020–TC-021 |
| US-09 Check out as a guest using COD | TC-013–TC-019 |
| US-10 Check out as a signed-in customer | TC-015–TC-019, TC-030, TC-033, TC-049 |
| US-11 Apply a promo coupon | TC-017–TC-018, TC-029 |
| US-12 Maintain a wishlist | TC-025 |
| US-13 Write a product review | TC-026 |
| US-14 Ask for support | TC-023–TC-024 |
| US-15 Print my order document | TC-030, TC-033 |
| US-16 Sign in as an administrator | TC-008, TC-037 |
| US-17 Manage catalog and stock | TC-004–TC-005, TC-027–TC-028 |
| US-18 Manage coupons and review moderation | TC-026, TC-029 |
| US-19 Fulfill and track an order | TC-031–TC-032 |
| US-20 Manage tickets and password recovery | TC-022, TC-024 |
| US-21 Review performance and record cash sales | TC-035 |
| US-22 Configure checkout and export reports | TC-034, TC-036 |
| US-23 Operate, validate, and package the system | TC-038–TC-046 |
| US-24 Protect customer and store data | TC-004, TC-008, TC-011, TC-014, TC-020–TC-021, TC-024–TC-026, TC-030, TC-033, TC-036–TC-039, TC-047 |
| US-25 Revisit products I viewed | TC-047 |
| US-26 Monitor stock and product opportunities | TC-035, TC-048 |

| Requirement area | Automated evidence | Additional validation |
|---|---|---|
| Authentication, role separation, session expiry | `app.routes.test.jsx`, `axiosSessionExpiry.test.js`, `integration.api.test.js`, `passwordManagement.test.js` | M-11, M-12 |
| Product discovery and UI navigation | `app.routes.test.jsx`, `navbarSearch.test.jsx`, `promotionCountdown.test.js` | M-01–M-03, M-31, M-32 |
| Cart and guest checkout | `cartContext.test.jsx`, `guestCheckout.test.jsx`, `integration.api.test.js` | M-03–M-09 |
| Prices, promotions, coupon policy | `discountPricing.test.js`, `couponPricing.test.js`, `couponsPanel.test.jsx`, `integration.api.test.js` | M-08–M-10, M-17 |
| Catalog/image safety | `productModel.test.js`, `imageSignatures.test.js`, `productImageSafety.test.js` | M-15, M-16 |
| Orders, shipping, status, cancellation | `zoneShipping.test.js`, `orderStatus.test.js`, `integration.api.test.js` | M-06–M-09, M-20, M-33 |
| Support | Route/API behavior is covered only where listed in the live test inventory | M-13, M-14 |
| Reviews and wishlist | `reviewsPanel.test.jsx`, `wishlistPage.test.jsx` cover selected UI behavior | M-18, M-19 |
| Tracking, invoice, export | `shipmentTracking.test.js`, `invoicePage.test.jsx`, `csvExport.test.js` | M-21–M-23 |
| Admin analytics/settings/cash sales | `salesAnalytics.test.js`, `metrics.test.js`, `manualCashSale.test.js`, `settingsSecurity.test.js` | M-24, M-25, M-32 |
| Recently viewed and dashboard decision support | Existing UI/model behavior; no focused automated recent-view/admin-recommendation test currently exists | M-31, M-32 |
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

### 6.1 Recommended automation follow-up

These are coverage goals, not existing automated tests or release-pass
evidence. Add them to the automated inventory only after corresponding tests
exist and run reliably:

| Candidate | Desired automated assertion |
|---|---|
| Concurrent stock checkout | Concurrent attempts against limited stock must not create accepted orders whose reserved/sold quantity exceeds the available stock; verify persisted stock and order state after both success and failure paths. |
| Concurrent coupon redemption | Simultaneous order submissions at the usage limit must not exceed the configured coupon-use count; failed orders must not leave a successful-looking discount claim. |
| Checkout failure consistency | Inject failures at supported persistence boundaries and confirm no partial success response, orphaned order, lost stock, or inconsistent coupon usage is left behind. |
| Cross-account resource access | For each customer-owned endpoint, verify account A cannot list, read, modify, or export account B's orders, support tickets, wishlist, or other private records. |
| Support workflow regression | Exercise guest/customer creation, customer ownership, admin reply/status update, and unauthorized admin-route access against a disposable database. |
| Restore verification | Automate a backup/restore check against a separate disposable database and compare representative records; never automate a destructive restore against a shared or production target. |

Do not claim a performance, availability, recovery-time, or accessibility
target has passed until the project defines a measurable threshold and records
the tested build, environment, method, and result. The current manual
responsive and health checks are useful smoke checks, not an SLA, full
WCAG-conformance assessment, or production recovery guarantee.
