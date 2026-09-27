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

## GitHub APK generation

The workflow at `.github/workflows/android-apk.yml`:

1. Installs Node.js dependencies.
2. Builds the Vite frontend.
3. Installs Java and Android tooling.
4. Generates the Capacitor Android project.
5. Synchronizes web assets.
6. Builds a debug APK.
7. Uploads the APK as a downloadable Actions artifact.

If the Android project is already committed, the workflow reuses it; otherwise
it generates the project with `npx cap add android`.

Run it manually from the repository's **Actions** tab, or push a tag:

```powershell
git tag v1.0.0
git push origin v1.0.0
```

The workflow's default API URL is `http://localhost:5000`, which is suitable
only for a local emulator on the same machine. For a phone or public release,
set the repository variable `VITE_API_URL` to an HTTPS backend URL or a
reachable LAN address.

## Important release limitation

The workflow produces an unsigned debug APK. It is suitable for testing, not
for Google Play production release. A release build still needs:

- A private Android signing keystore
- GitHub encrypted secrets for the keystore and passwords
- A public HTTPS API
- App icon and splash branding
- Privacy policy and store listing
- Play App Signing configuration
