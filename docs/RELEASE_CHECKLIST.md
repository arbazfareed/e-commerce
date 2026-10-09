# IndusCart Release Checklist

## Before merge

- [ ] Backend tests pass
- [ ] Frontend tests pass
- [ ] Frontend production build passes
- [ ] Local validation checks are complete
- [ ] Changed behavior is reflected in the SRD, user guide, API reference, and feature coverage as applicable
- [ ] User stories and acceptance criteria match implemented behavior
- [ ] Relevant automated tests and detailed manual test cases are listed and traceable to requirements
- [ ] Test output distinguishes passed, failed, skipped, and not-run cases
- [ ] Documentation links, Markdown formatting, and `git diff --check` are verified
- [ ] `.env`, credentials, customer data, signing keys, generated backups, and build artifacts are not staged
- [ ] Only intended files are staged; inspect `git diff --cached` before pushing
- [ ] PR review is complete
- [ ] QA checklist is signed off

## Before APK release

- [ ] Android SDK is installed
- [ ] Release keystore is created
- [ ] Keystore credentials are stored securely
- [ ] APK artifact is built successfully
- [ ] APK is tested on a real device
- [ ] App opens without crash
- [ ] Key user flows are tested

## Before production deployment

- [ ] Backend environment variables are verified
- [ ] MongoDB connection is working
- [ ] JWT secret is set
- [ ] API URL is correct
- [ ] HTTPS and domain are configured
- [ ] Storage and uploads are ready
- [ ] Admin account is configured
- [ ] Production release is approved manually

## Release sign-off

- [ ] Release owner approved the build
- [ ] QA approved the APK
- [ ] Security check completed
- [ ] Final release notes added
- [ ] Production deployment is confirmed
