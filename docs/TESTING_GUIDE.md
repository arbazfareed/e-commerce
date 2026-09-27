# IndusCart Testing Guide

This document records the testing layers added to the project and the exact purpose of each layer.

## 1. Unit testing

Purpose: validate the business rules and pure logic that are not dependent on a running server.

Covered areas:
- discount calculations in `backend/utils/discountPricing.js`
- environment validation in `backend/config/env.js`
- sales analytics aggregation in `backend/utils/salesAnalytics.js`

Typical commands:
```powershell
cd backend
node --test test/*.test.js
```

## 2. Integration testing

Purpose: validate the real Express app responds correctly at route level without mocking the app itself.

Covered areas:
- `/` and `/health/live` service response
- `/health/ready` database disconnected state
- API startup behavior through the actual app object

Typical commands:
```powershell
cd backend
node --test test/integration.api.test.js
```

## 3. UI / UX testing

Purpose: validate the storefront renders meaningful content and protected routes behave as expected.

Covered areas:
- home page content rendering
- login form visibility and label accessibility
- route-level guest access control
- navigation to key pages

Typical commands:
```powershell
cd frontend
npx vitest run src/tests/app.routes.test.jsx
```

## 4. Text testing

Purpose: ensure visible UI text and labels match the intended user flow.

Covered items:
- login copy and helper text
- storefront hero and CTA labels
- support and registration messaging
- route redirects that preserve user expectation

## 5. Navigation testing

Purpose: validate route transitions and protected flow logic.

Covered checks:
- `/` loads storefront content
- `/login` renders the auth form
- `/orders` redirects to login when no active user exists
- the app remains stable when moving between public and protected routes

## 6. Selenium browser smoke testing

Purpose: validate a real browser can load the storefront without failing at runtime.

Prerequisites:
- Chrome / Chromium installed
- frontend app running on `http://localhost:3000`
- backend app running if required by the page content fetch path

Command:
```powershell
cd backend
$env:RUN_SELENIUM = 'true'
node --test test/selenium.smoke.test.js
```

## 7. Manual QA checklist

Use the checklist below before sign-off:

- Home page loads with product content visible
- Search / category filters work
- Product detail page displays correct information
- Cart adds and updates quantities correctly
- Login and registration pages render and accept input
- Protected customer pages redirect to login when unauthenticated
- Support page shows form and FAQ states
- Admin route remains protected for non-admin users
- Mobile browser view works on the local network IP

## 8. Local validation

Run the relevant checks locally before sharing a change. The repository does
not currently run GitHub Actions workflows.

This project keeps the tests in the existing repo structure and avoids
rewriting business logic while still improving coverage for the main user
journeys.
