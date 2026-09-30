# GitHub and Cost Optimization Guide

This guide keeps IndusCart professional while avoiding unnecessary hosting and
infrastructure costs.

## Recommended repository settings

- Set `main` as the default branch.
- Enable branch protection for `main`.
- Require the `Backend validation` and `Frontend validation` checks.
- Enable **Allow auto-merge** only if review rules are configured.
- Keep GitHub Actions artifacts for APK/testing only; do not use Actions as
  permanent file storage.
- Add a short repository description and topics such as `react`, `vite`,
  `nodejs`, `express`, `mongodb`, `ecommerce`, and `capacitor`.
- Publish a GitHub Release for meaningful versions such as `v1.0.0`.
- Use Issues for bugs and feature requests rather than tracking work in README.
- Use Discussions only when community or customer feedback becomes useful.

## Lowest-cost deployment shape

```text
Static React frontend  -> Cloudflare Pages / Netlify / Vercel
Express API            -> Render / Railway / Fly.io
MongoDB                -> MongoDB Atlas shared tier
Product images         -> Cloudinary or Cloudflare R2
Android build          -> GitHub Actions artifact
```

A custom domain is optional. Hosting providers normally supply a temporary
HTTPS URL that can be used by the frontend and Android APK.

## Cost controls

1. Keep the current monolithic Express API; do not split into microservices.
2. Keep MongoDB for the MVP; migrate to PostgreSQL only when transaction and
   reporting needs justify the migration.
3. Keep the current process-local admin login limiter for a single instance;
   add Redis/shared storage when multi-instance rate limits are required. Do not
   add Kubernetes, Elasticsearch, or a queue until measured requirements justify
   their operational cost.
4. Use image resizing and compression before paying for more storage/bandwidth.
5. Configure database backups with retention limits and test restores.
6. Monitor free-tier usage to avoid surprise overage charges.
7. Keep production, staging, and local environment variables separate.
8. Never commit credentials, tokens, database dumps, APK signing keys, or real
   customer data.

## Cost model and scale gates

There is no fixed monthly quote in this repository: provider, region, traffic,
retention, and support level change the total. Estimate these categories before
launch and check current provider pricing:

| Cost area | Development/demo | Production growth trigger |
|---|---|---|
| Frontend hosting | Local or a free static tier | Custom domain, CDN, access logs, uptime/SLA |
| API compute | Local or a low-cost single instance | Always-on capacity, multiple instances, shared Redis limiter |
| Database | Local MongoDB or a shared tier | Backups/PITR, replica set, storage growth, transaction workload |
| Product media | Local `uploads/` | Object storage, image transforms, CDN egress, retention |
| Business operations | Email/domain basics | Payment transaction fees, per-parcel courier charges, SMS, tax/accounting |
| Reliability/security | CI and manual checks | Monitoring, alerting, restore drills, MFA, audit retention |

Use a total-cost worksheet covering API compute, database/backups, media/egress,
domain/DNS, email/monitoring, CI, and variable payment/courier fees. Free/shared
tiers are useful for prototypes but may sleep, lack recovery guarantees, or
impose usage caps. Set billing alerts and a monthly owner review; payment and
delivery fees are variable costs and should be modeled per order.

## GitHub Actions cost controls

- Run normal CI only on `main`, pull requests, and the active development branch.
- Cancel duplicate runs with workflow concurrency.
- Build APKs manually or on version tags instead of every commit.
- Upload only the required APK artifact.
- Do not run Selenium or Android builds for every documentation-only change.
- Keep the API URL in the repository variable `VITE_API_URL`, never in source.

## Recommended release flow

1. Create a focused branch.
2. Update code and the relevant documentation.
3. Run backend syntax/tests and frontend tests/build locally.
4. Push the branch and open a pull request.
5. Wait for required GitHub checks.
6. Review the changed files and merge with squash.
7. Create a version tag only when an APK artifact is needed.
8. Publish release notes describing features, limitations, and deployment values.

Do not push an unreviewed mixed worktree or push feature commits directly to
`main`. Inspect staged files, run checks, push the feature branch, and merge via
a reviewed pull request after required CI checks pass.

## Current technology recommendation

Keep React, Vite, Express, MongoDB, Mongoose, Docker Compose, Capacitor, and
GitHub Actions for the current MVP. The largest savings come from managed free
or shared tiers and avoiding premature infrastructure—not from rewriting the
application.

The administrator entry icon and `/admin/login` route currently share the same
SPA/API deployment as the shop; the backend login endpoint and role checks are
separate. A separate admin hostname can be considered for organizational
isolation, but it does not replace authorization, MFA, rate limiting, or audit
logging.

Before public commerce launch, budget for payment transaction fees, courier
charges, image storage/bandwidth, managed database backups, monitoring, and
notifications.
