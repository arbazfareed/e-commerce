## Summary

This PR adds QA coverage, CI validation, and Android release preparation for the IndusCart project.

## What changed

- Added backend unit and integration tests
- Added frontend UI and route validation
- Added browser smoke test scaffolding
- Added or updated local validation documentation
- Added QA and release documentation

## Why

- Reduce risk before merging into the main branch
- Validate both backend and frontend behavior
- Prepare APK generation for mobile testing and release

## Verification

- Backend tests pass locally or in CI
- Frontend build and tests are run in CI
- Android build instructions are documented for local execution

## Release checklist

- [ ] Backend checks complete
- [ ] Frontend checks complete
- [ ] APK artifact downloaded
- [ ] APK tested on device
- [ ] Release notes prepared
- [ ] Production deployment approved

## Notes

This branch is safe for QA and release preparation. Production deployment should remain gated behind environment validation and a signed APK release process.
