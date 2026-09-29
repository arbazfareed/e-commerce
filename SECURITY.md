# Security Policy

## Supported versions

The `main` branch is the supported development line. This project is not yet a
public production service, so deployments must complete the security checklist
in [`docs/PRODUCTION_DEPLOYMENT.md`](./docs/PRODUCTION_DEPLOYMENT.md).

## Report a vulnerability

Do not publish credentials, tokens, database URLs, or exploit details in a
public issue. Contact the repository owner privately through GitHub with:

- A short description of the issue
- Affected file or route
- Reproduction steps that do not expose real user data
- Suggested mitigation, if known

## Security requirements

- Revoke any token accidentally shared in chat, commits, logs, or screenshots.
- Store secrets only in local environment files or protected hosting variables.
- Use a unique JWT secret of at least 32 characters in production.
- Configure a unique `SETTINGS_ENCRYPTION_KEY` (at least 32 characters) for encrypted provider credentials; back it up separately and do not rotate it without re-encrypting saved secrets.
- Never treat the admin “configured/enabled” flags as proof of payment capture or courier booking; require verified server-side provider callbacks before changing order/payment state.
- Use HTTPS for public websites, APIs, and Android builds.
- Do not use real customer data in tests or screenshots.
- Review payment, upload, backup, and admin changes before release.
