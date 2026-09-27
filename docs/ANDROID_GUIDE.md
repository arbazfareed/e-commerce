# IndusCart Android APK Guide

## What Capacitor does

Capacitor wraps the existing React/Vite website in a native Android project.
The same frontend code remains the source of the customer and admin
interfaces. Capacitor adds the Android project, Gradle build, and access to
native plugins later.

## Local APK generation

Install:

- Android Studio
- Android SDK and platform tools
- Java 21
- Node.js and npm

Configure the API URL in `frontend/.env`:

```env
VITE_API_URL=http://YOUR_COMPUTER_IP:5000
```

The phone must be able to reach that backend address. A `localhost` API URL
inside an APK points to the phone itself, not the development computer.

Run:

```powershell
cd frontend
npm ci
npm run android:build
```

Install the generated debug APK on a connected device:

```powershell
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

Or copy the APK to the phone and open it after allowing installation from that
source.

## Important release limitation

The workflow produces an unsigned debug APK. It is suitable for testing, not
for Google Play production release. A release build still needs:

- A private Android signing keystore
- GitHub encrypted secrets for the keystore and passwords
- A public HTTPS API
- App icon and splash branding
- Privacy policy and store listing
- Play App Signing configuration

## GitHub APK build

The repository includes `.github/workflows/android-apk.yml`. First deploy the
backend to a public HTTPS URL, then add this repository variable under
**Settings → Secrets and variables → Actions → Variables**:

```text
VITE_API_URL=https://api.example.com
```

Run **Actions → Build Android APK → Run workflow**, or push a version tag such
as `v1.0.0`. Download the `induscart-debug-apk` artifact and install
`app-debug.apk` on the phone.

The workflow rejects `localhost` and LAN URLs intentionally. An installed APK
cannot reach the developer computer once it leaves the local network. The API
must remain publicly reachable over HTTPS for the app to work without running
the project locally.
