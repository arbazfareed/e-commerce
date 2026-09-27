## Summary

This PR adds QA coverage, CI validation, and Android release preparation for the IndusCart project.

## What changed

- Added backend unit and integration tests
- Added frontend UI and route validation
- Added browser smoke test scaffolding
- Added GitHub Actions CI workflow
- Added Android APK build workflow
- Added QA and release documentation

## Why

- Reduce risk before merging into the main branch
- Validate both backend and frontend behavior
- Prepare APK generation for mobile testing and release

## Verification

- Backend tests pass
- Frontend build and tests are run in CI
- Android workflow builds the APK artifact for testing

## Release checklist

- [ ] Backend checks complete
- [ ] Frontend checks complete
- [ ] APK artifact downloaded
- [ ] APK tested on device
- [ ] Release notes prepared
- [ ] Production deployment approved

## Notes

This branch is safe for QA and release preparation. Production deployment should remain gated behind environment validation and a signed APK release process.
