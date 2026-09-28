# IndusCart Production Deployment Plan

This is the production handoff checklist. Replace every `example.com` value with the real domain before launch.

## What is already implemented

- API live/readiness health endpoints.
- MongoDB backup and restore scripts.
- Helmet security headers.
- Authentication rate limiting.
- Environment-based JWT and CORS configuration.
- Docker Compose for the API, frontend, and MongoDB.
- Capacitor Android release build.

## 1. Public HTTPS website and API

Choose a host such as Render, Railway, Fly.io, Azure, AWS, or a VPS. Deploy:

- API: `https://api.example.com`
- Website: `https://shop.example.com`
- MongoDB: managed MongoDB Atlas or a private database server

Set backend production variables:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER/induscart
JWT_SECRET=replace-with-a-unique-random-secret-at-least-32-characters
CORS_ORIGINS=https://shop.example.com
PORT=5000
FRONTEND_URL=https://shop.example.com
RESEND_API_KEY=replace-with-resend-api-key
EMAIL_FROM="IndusCart <no-reply@your-verified-domain.com>"
```

Customer password-reset emails require a Resend API key and an `EMAIL_FROM`
address whose domain is verified with Resend. Keep the API key in the backend
environment only; the reset link is single-use and expires after 20 minutes.

Build the frontend with:

```env
VITE_API_URL=https://api.example.com
```

Verify:

- `https://api.example.com/health/live`
- `https://api.example.com/health/ready`
- `https://shop.example.com`

Do not use `localhost` or `192.168.x.x` in a public release.

## 2. Real payments

Select one provider supported in your business country, such as Stripe or
PayPal. A real integration requires provider credentials, server-created
payment intents/orders, webhook signature verification, and a refund flow.
Never put secret payment keys in frontend code or `.env` files committed to Git.

Before enabling payments, test:

- successful payment
- declined payment
- duplicate webhook delivery
- cancelled/expired payment
- refund and order cancellation
- stock restoration after cancellation

The current checkout supports payment-method selection but does not claim a
payment was captured. Add the provider adapter only after receiving the real
merchant credentials.

## 3. Cloud image storage

Create an S3-compatible bucket or Cloudinary account. Configure private upload
credentials on the API server only. Migrate existing files from
`backend/uploads/`, update product image URLs, and configure a lifecycle or
backup policy. Do not expose cloud secret keys to the frontend or APK.

## 4. Automated MongoDB backups

The project includes:

```powershell
cd backend
npm.cmd run db:backup
npm.cmd run db:restore -- .\backups\BACKUP_FOLDER
```

Schedule `npm.cmd run db:backup` with Windows Task Scheduler, cron, or the
hosting provider scheduler. Store encrypted copies outside the application
machine and perform a restore drill at least monthly.

## 5. Monitoring and alerts

Point an uptime monitor at:

- `/health/live` for process availability
- `/health/ready` for database readiness

Add an error-monitoring provider such as Sentry to the API and frontend after
creating the project DSN. Alert on API 5xx responses, repeated readiness
failures, failed backups, payment webhook failures, and elevated login errors.
Do not send passwords, tokens, payment secrets, or full addresses to logs.

## 6. Legal pages

Review and publish:

- `docs/PRIVACY_POLICY.md`
- `docs/TERMS_OF_SERVICE.md`
- `docs/RETURNS_AND_REFUNDS.md`

These are starter drafts, not legal advice. Replace placeholders and have a
qualified local adviser review them before accepting real customers.

## 7. Release Android APK

After the public HTTPS API is working:

1. Set `frontend/.env` to `VITE_API_URL=https://api.example.com`.
2. Run `npm.cmd run build`.
3. Run `npx.cmd cap sync android`.
4. Run `android\\gradlew.bat assembleRelease`.
5. Verify the release APK with Android signing tools.
6. Back up the release keystore securely.

The same Android signing key must be used for every future update.
