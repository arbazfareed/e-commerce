# IndusCart Phased Delivery and Requirements Traceability

**Plan ID:** PDP-IND-001  
**Version:** 1.0  
**Audit basis:** Repository implementation reviewed September 30, 2026  
**Status:** Implementation-oriented roadmap; not a production deployment schedule

This plan groups the existing requirements into reviewable phases. It describes
what the repository implements today and what remains before production. A
feature marked **Implemented** means code exists; it does not imply the feature
has been deployed publicly or approved for live commerce. No ETAs are assigned
because business owners have not set delivery dates.

## 1. Status and tracking rules

| Status | Meaning |
|---|---|
| Implemented | Code and documented behavior exist in this repository; verify with the cited tests or review. |
| Partial | The application has a configuration or UI seam, but an external integration or operational control is missing. |
| Planned | Not implemented; do not advertise it as available. |
| Owner | Suggested role responsible for acceptance, not a named person. |
| ETA | Intentionally unset until an owner estimates the work. |

The SRD (`SRD.md`) remains the source of functional requirement IDs and release
criteria. This plan supplies phase and tracking IDs; the UML guide
(`UML_DIAGRAMS.md`) supplies the implementation diagrams. When behavior changes,
update the relevant requirement, code evidence, test, and diagram together.

## 2. Delivery phases

### PH-01 — Platform foundation and local runtime

**Goal:** Make the application runnable and testable on a developer workstation.

| Function ID | Deliverable | SRD IDs | Status | Evidence |
|---|---|---|---|---|
| FN-01-01 | React/Vite client, Express API, MongoDB configuration, and health checks | FR-20 | Implemented | `frontend/`, `backend/server.js`, `backend/config/` |
| FN-01-02 | Separate shopper/admin local Vite modes sharing one API | FR-04, FR-22 | Implemented | `START-SHOPPER.cmd`, `START-ADMIN.cmd`, `START-LOCAL.cmd`; `App.jsx` |
| FN-01-03 | Docker Compose and persistent MongoDB/uploads volumes | FR-20 | Implemented | `docker-compose.yml`; `ARCHITECTURE.md` |
| FN-01-04 | Backend/frontend automated checks and CI workflows | FR-22 | Implemented | `.github/workflows/ci.yml`; `TESTING_GUIDE.md` |

**Acceptance:** local launchers start the intended ports; backend readiness checks
MongoDB; frontend build and configured test suites pass.

### PH-02 — Identity, sessions, and access control

**Goal:** Keep shopper and administrator authentication separate and enforce roles
on the server.

| Function ID | Deliverable | SRD IDs | Status | Evidence |
|---|---|---|---|---|
| FN-02-01 | Shopper registration/login and verified session persistence | FR-01, FR-03 | Implemented | `authRoutes.js`, `AuthContext.jsx`; auth tests |
| FN-02-02 | Admin-only login endpoint, role checks, and failed-login limiter | FR-02, FR-04 | Implemented | `authController.js`, `authRoutes.js`, `authMiddleware.js` |
| FN-02-03 | Admin route guard and session restoration after refresh | FR-03, FR-04 | Implemented | `App.jsx`, `AuthContext.jsx`; `app.routes.test.jsx` |
| FN-02-04 | Password reset links and own-password change | FR-27 | Implemented | `authController.js`, `emailService.js`; password tests |
| FN-02-05 | Admin MFA/passkeys and shared rate-limit storage | NFR Security | Planned | Add after selecting identity and deployment requirements |

**Acceptance:** shopper credentials cannot obtain an admin session; admin
credentials land on the admin dashboard; expired sessions are cleared and routed
in-app to the appropriate sign-in page.

### PH-03 — Catalog, discovery, and product management

**Goal:** Let visitors discover visible products and administrators maintain a
validated catalog.

| Function ID | Deliverable | SRD IDs | Status | Evidence |
|---|---|---|---|---|
| FN-03-01 | Product list/detail, category/subcategory, search, sorting, price filters, pagination | FR-05, FR-06, FR-28 | Implemented | `HomePage.jsx`, `ProductDetailPage.jsx`, product API tests |
| FN-03-02 | Admin product CRUD, inventory, visibility, variants, images | FR-07 | Implemented | `AdminPage.jsx`, product controller, image-safety tests |
| FN-03-03 | Scheduled discount and low-stock presentation | FR-08, FR-30 | Implemented/Partial | pricing utilities and product tests; no stock reservation timer |
| FN-03-04 | Image CDN, transformation, and object storage | NFR Performance/Availability | Planned | Select provider before multi-instance deployment |

**Acceptance:** hidden products stay out of public catalog responses; price and
stock displayed by the client are not trusted for order creation.

### PH-04 — Cart, checkout, pricing, and order creation

**Goal:** Preserve selected product variants and validate orders using current
server-side data.

| Function ID | Deliverable | SRD IDs | Status | Evidence |
|---|---|---|---|---|
| FN-04-01 | Guest-local and account-synced variant-aware cart | FR-09 | Implemented | `CartContext.jsx`; cart context tests |
| FN-04-02 | Guest COD and authenticated checkout | FR-10, FR-26 | Implemented | `CartPage.jsx`, `orderController.js`; checkout tests |
| FN-04-03 | Server recalculation of price, discount, stock, market, shipping, COD fee | FR-10, FR-11 | Implemented | `orderController.js`; pricing and integration tests |
| FN-04-04 | Real online payment capture, signed webhooks, idempotency, refunds | FR-13 | Planned | Choose provider and define settlement/cancellation rules first |

**Acceptance:** API rejects unavailable products, invalid variants, ineligible
markets, and insufficient stock; confirmation distinguishes pending online
payment from captured payment.

### PH-05 — Fulfillment, customer service, and account self-service

**Goal:** Give customers order visibility and support while providing controlled
admin operations.

| Function ID | Deliverable | SRD IDs | Status | Evidence |
|---|---|---|---|---|
| FN-05-01 | Customer order history, details, invoices, and manual tracking details | FR-12, FR-15 | Implemented | `OrdersPage.jsx`, `OrderTrackPage.jsx`, `InvoicePage.jsx` |
| FN-05-02 | Admin fulfillment status updates and CSV exports | FR-12, FR-29 | Implemented | `AdminPage.jsx`; order-status/export tests |
| FN-05-03 | Guest/customer tickets and admin replies/status updates | FR-16 | Implemented | `supportRoutes.js`, `SupportPage.jsx`; support tests |
| FN-05-04 | Automated carrier booking, labels, events, and delivery notifications | FR-14, FR-25 | Partial/Planned | Manual tracking exists; provider adapter and webhooks do not |
| FN-05-05 | Returns/refunds and inventory/payment reconciliation | FR-24 | Planned | Define eligibility, evidence, status ownership, and accounting rules |

### PH-06 — Administrator operations and business controls

**Goal:** Provide visibility and safe configuration for day-to-day store operation.

| Function ID | Deliverable | SRD IDs | Status | Evidence |
|---|---|---|---|---|
| FN-06-01 | Sales, product, inventory, and market analytics | FR-17 | Implemented | `/api/orders/analytics`; `AdminPage.jsx`; analytics tests |
| FN-06-02 | Record a manual cash sale | FR-18 | Implemented | `orderController.js`; manual cash-sale tests |
| FN-06-03 | Configure international catalog and COD settings | FR-19 | Implemented | settings controller/routes; settings security tests |
| FN-06-04 | Coupons, verified reviews/moderation, and wishlists | Related scope | Implemented | coupon/review/wishlist APIs and frontend panels |
| FN-06-05 | Admin audit trail and finer-grained roles | NFR Security | Planned | Define privileged actions and retention before implementation |

### PH-07 — Production readiness and release acceptance

**Goal:** Move from a locally validated application to a responsibly operated
production service.

| Function ID | Deliverable | SRD IDs | Status | Suggested owner |
|---|---|---|---|---|
| FN-07-01 | Public HTTPS frontend/API, CORS/proxy, and production secrets | NFR Security/Availability | Planned | Deployment operator |
| FN-07-02 | Managed database, encrypted backups, and restore drill | NFR Data durability | Planned | Database operator |
| FN-07-03 | Shared image storage, monitoring, logs, and alerts | NFR Availability/Observability | Planned | Platform operator |
| FN-07-04 | Legal/policy review, payment acceptance, and signed Android release | Release gates | Planned | Business owner + release owner |
| FN-07-05 | Accessibility, load, mobile-device, and end-to-end release checks | NFR Usability/Performance | Partial | QA owner |

## 3. Master tracking register

This register is a project tracking template populated from repository evidence.
The status reflects code/documentation, not a live deployment. Update the owner,
ETA, and acceptance date only after the responsible person agrees to them.

| Tracking ID | Phase | Function ID | Current status | Evidence / acceptance pointer | Next action |
|---|---|---|---|---|---|
| TRK-001 | PH-01 | FN-01-01 | Implemented | Health/API tests; `LOCAL_RUN_GUIDE.md` | Re-run readiness check on target host |
| TRK-002 | PH-01 | FN-01-02 | Implemented | Shopper/admin routes and launcher docs | Keep launcher modes aligned with `App.jsx` |
| TRK-003 | PH-02 | FN-02-01–04 | Implemented | Auth and admin route regression tests | Configure secure production identity operations |
| TRK-004 | PH-03 | FN-03-01–03 | Implemented/Partial | Catalog, model, pricing, and image tests | Add provider-backed image storage before scaling |
| TRK-005 | PH-04 | FN-04-01–03 | Implemented | Cart, coupon, checkout, pricing, integration tests | Add concurrency/transaction testing |
| TRK-006 | PH-04 | FN-04-04 | Planned | Payment provider absent | Select gateway; design webhook/idempotency tests |
| TRK-007 | PH-05 | FN-05-01–03 | Implemented | Order, invoice, support, and status tests | Validate customer support and fulfillment operations |
| TRK-008 | PH-05 | FN-05-04–05 | Partial/Planned | Manual courier details only; no returns workflow | Choose provider and approve returns policy |
| TRK-009 | PH-06 | FN-06-01–04 | Implemented | Analytics/settings/coupon/review test suites | Validate business settings with store owner |
| TRK-010 | PH-07 | FN-07-01–05 | Planned/Partial | See `PRODUCTION_DEPLOYMENT.md` and release checklist | Assign deployment/QA owner and target date |

## 4. Future suggestions, prioritized

### P0 — before accepting real customers or payments

1. Deploy the API and portal on HTTPS; restrict CORS and configure trusted proxy
   behavior correctly.
2. Add an online payment provider with server-created payment intents,
   signature-verified/idempotent webhooks, reconciliation, refunds, and tests.
3. Configure managed MongoDB, encrypted off-host backups, monitoring, and a
   successful restore drill.
4. Move uploads to shared object storage before running multiple API instances.
5. Review legal pages, tax/consumer obligations, privacy retention, and COD
   threshold currency rules with the business owner.

### P1 — security and reliability

1. Add administrator MFA/passkeys, audit events, and a distributed rate-limit
   store when the API scales beyond one process.
2. Add schema-based request validation and redacted structured logs.
3. Protect concurrent last-item checkout with MongoDB transactions or a tested
   idempotent compensation strategy.
4. Add end-to-end accessibility and device testing, API monitoring, and alerting.
5. Define returns/refunds and order-transition rules before adding their UI/API.

### P2 — experience and growth

1. Add image variants/CDN and performance budgets; code-split the frontend.
2. Add transactional customer notifications and courier webhooks after providers
   are selected.
3. Add localization/currency policy beyond PKR/USD and evaluate search/index
   improvements using observed catalog size.
4. Publish a signed Android release only after HTTPS, privacy, and device checks.

## 5. Technical and nontechnical handoff

### Technical handoff

1. Read `README.md`, `SRD.md`, `ARCHITECTURE.md`, and `UML_DIAGRAMS.md`.
2. Copy private environment files from the provided examples; never commit
   credentials or local uploads just to make a branch build.
3. Run backend checks/tests and frontend tests/build as described in
   `TESTING_GUIDE.md`.
4. Confirm API health/readiness, shopper/admin role separation, and critical
   guest/account order flows before a release.
5. Use this register to record the commit/PR, verification evidence, owner, and
   release decision. Do not mark a planned integration as done until its
   provider-backed acceptance tests pass.

### Nontechnical handoff

- **Available now:** customers can browse products, maintain a cart, place COD
  orders, view order status, and contact support; administrators can manage the
  catalog, orders, settings, analytics, and support.
- **Not live yet:** online card/payment capture, automated courier booking/live
  tracking, public production hosting, and automated refunds.
- **Before launch:** decide payment/courier providers, confirm delivery and
  returns policies, appoint an operations contact, and approve the privacy/terms
  content with appropriate business/legal review.
- **Do not send passwords, API keys, database URLs, signing keys, or GitHub
  tokens in project documentation or chat. Use the private environment files
  and GitHub’s protected authentication flow.

## 6. Related documentation

- [Software requirements and acceptance criteria](./SRD.md)
- [Implementation-based UML diagrams](./UML_DIAGRAMS.md)
- [Implemented/partial/planned feature coverage](./FEATURE_COVERAGE.md)
- [Architecture and deployment](./ARCHITECTURE.md)
- [Technical and customer guide](./USER_GUIDE.md)
- [Testing and release checks](./TESTING_GUIDE.md)
- [Production deployment gates](./PRODUCTION_DEPLOYMENT.md)
