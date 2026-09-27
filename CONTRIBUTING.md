# Contributing to IndusCart

Thank you for improving IndusCart.

## Before opening a pull request

1. Create a focused branch from `main`.
2. Never commit `.env` files, passwords, API keys, database dumps, keystores,
   or real network addresses.
3. Run the relevant backend and frontend checks locally.
4. Update the documentation when behavior, routes, configuration, or deployment
   steps change.
5. Keep customer, admin, API, and security changes easy to review.

## Local validation

```powershell
cd backend
npm ci
npm run check
npm test

cd ..\frontend
npm ci
npm test
npm run build
```

## Pull requests

Describe the user impact, list the files changed, explain how the change was
verified, and include screenshots for visible UI changes. Use placeholders such
as `YOUR_COMPUTER_IP` and `https://api.example.com` in documentation.

The repository CI checks backend syntax and frontend tests/builds. Pull
requests targeting `main` may be squash auto-merged after required checks and
repository review rules pass.
