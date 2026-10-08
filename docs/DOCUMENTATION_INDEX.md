# IndusCart Documentation Index

This index explains which document answers which project question.

| Document type | File | Use it for |
|---|---|---|
| Project overview | [`README.md`](../README.md) | Quick start, stack, major commands, and repository entry point |
| No-command Windows start | [`START_HERE.md`](./START_HERE.md) | Double-click shopper/admin launchers, sign in, stop services, and troubleshoot startup |
| Project showcase | [`PROJECT_SHOWCASE.md`](./PROJECT_SHOWCASE.md) | Product capabilities, user journeys, routes, and GitHub presentation |
| Feature coverage | [`FEATURE_COVERAGE.md`](./FEATURE_COVERAGE.md) | Implemented, partial, and missing use cases and recommended next work |
| Complete project reference | [`COMPLETE_PROJECT_DOCUMENTATION.md`](./COMPLETE_PROJECT_DOCUMENTATION.md) | Consolidated technical, operational, and future-planning reference |
| SRD / requirements | [`SRD.md`](./SRD.md) | Scope, stakeholders, functional requirements, acceptance criteria, NFRs, and release gates |
| API reference | [`API_REFERENCE.md`](./API_REFERENCE.md) | Endpoints, authentication levels, fields, statuses, and API limitations |
| Architecture | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | System, deployment, request-flow, and data-model diagrams |
| Storage architecture | [`STORAGE_ARCHITECTURE.md`](./STORAGE_ARCHITECTURE.md) | Verified MongoDB, uploads, backups, browser storage, encryption, and Docker persistence behavior |
| UML diagrams | [`UML_DIAGRAMS.md`](./UML_DIAGRAMS.md) | Source inventory/counts, route/guard and component maps, domain relationships, deployment, role-separated shopper/admin login, checkout/support/product flows, reset-email sequence/state, and classic UML views |
| Technical guide | [`TECHNICAL_GUIDE.md`](./TECHNICAL_GUIDE.md) | Code structure, security model, local development, and Docker |
| Code organization | [`CODE_ORGANIZATION.md`](./CODE_ORGANIZATION.md) | Current source map, module boundaries, implemented design patterns, change checklist, and validation commands |
| User guide | [`USER_GUIDE.md`](./USER_GUIDE.md) | Customer and administrator workflows |
| Local runbook | [`LOCAL_RUN_GUIDE.md`](./LOCAL_RUN_GUIDE.md) | Local browser, Wi-Fi phone, and APK testing |
| Local DevOps runbook | [`LOCAL_DEVOPS_GUIDE.md`](./LOCAL_DEVOPS_GUIDE.md) | Plain-English DevOps overview, Kali Docker Compose setup, monitoring, CI, security, and production limits |
| Android runbook | [`ANDROID_GUIDE.md`](./ANDROID_GUIDE.md) | Capacitor builds, GitHub APK artifacts, signing limitations |
| Test plan | [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) | Unit, integration, UI, Selenium, and manual QA coverage |
| QA checklist pack | [`qa/README.md`](./qa/README.md) | Implementation-aware boundary, UI/UX, API, security, accessibility, and regression checks |
| Deployment runbook | [`PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) | Public hosting, HTTPS, storage, backups, monitoring, payments, and legal gates |
| Release checklist | [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) | Merge, APK, and production sign-off |
| Security policy | [`../SECURITY.md`](../SECURITY.md) | Secret handling and vulnerability reporting |
| Contribution guide | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Branches, validation, pull requests, and safe documentation |
| GitHub and cost guide | [`GITHUB_AND_COST_GUIDE.md`](./GITHUB_AND_COST_GUIDE.md) | Repository settings, low-cost hosting, cost model, Actions, scaling gates, and safe release strategy |
| Legal drafts | [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md), [`TERMS_OF_SERVICE.md`](./TERMS_OF_SERVICE.md), [`RETURNS_AND_REFUNDS.md`](./RETURNS_AND_REFUNDS.md) | Draft customer policies requiring business/legal review |

## Documentation maintenance rule

When behavior changes, update the relevant source document in the same change:

- New feature or changed user behavior → `SRD.md`, `USER_GUIDE.md`, and
  `PROJECT_SHOWCASE.md`, plus `FEATURE_COVERAGE.md` and `UML_DIAGRAMS.md` when
  system behavior or domain structure changes
- New endpoint or changed request/response → `API_REFERENCE.md`
- New deployment/runtime behavior → `ARCHITECTURE.md`, runbooks, and
  `PRODUCTION_DEPLOYMENT.md`
- New test or changed release gate → `TESTING_GUIDE.md` and
  `RELEASE_CHECKLIST.md`
- New security assumption → `SECURITY.md` and `TECHNICAL_GUIDE.md`

Use placeholders such as `YOUR_COMPUTER_IP` and `https://api.example.com` in
committed documentation. Never commit personal IP addresses, credentials,
production tokens, or private signing material.
