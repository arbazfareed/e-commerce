# IndusCart Release Checklist

## Before merge

- [ ] Backend tests pass
- [ ] Frontend tests pass
- [ ] Frontend production build passes
- [ ] GitHub Actions workflow is green
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
