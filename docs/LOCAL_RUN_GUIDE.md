# IndusCart Local Run Guide

This guide explains how to run IndusCart in Chrome on the computer, open it on a phone over Wi-Fi, and build/install the Android APK.

## Current computer address

Use your computer's Wi-Fi IPv4 address as a placeholder in the examples below:

```text
YOUR_COMPUTER_IP
```

If the computer changes networks, check the address again with:

```powershell
ipconfig
```

Use the `IPv4 Address` under the connected Wi-Fi adapter. Do not use an IPv6 address.

## 1. Start the backend API

For a one-click desktop start, double-click `START-LOCAL.cmd` in the repository
root. It opens separate backend and frontend terminal windows; keep both open
while using the shop, and close them or press `Ctrl+C` in each to stop services.
The manual commands below remain available if you prefer starting one service
at a time.

Make sure MongoDB is running, then open PowerShell Terminal 1:

```powershell
cd "C:\Users\ZS computers\Documents\e-commerce\backend"
npm.cmd start
```

The API should report that MongoDB connected and that it is running on port `5000`.

Test it in Chrome:

- Computer: <http://localhost:5000/health/live>
- Same Wi-Fi device: <http://YOUR_COMPUTER_IP:5000/health/live>

A successful response contains `"status":"ok"`.

## 2. Start the website

Open PowerShell Terminal 2:

```powershell
cd "C:\Users\ZS computers\Documents\e-commerce\frontend"
npm.cmd start -- --host 0.0.0.0
```

Open the website in Chrome on the computer:

<http://localhost:3000>

Open the website from a phone on the same Wi-Fi:

<http://YOUR_COMPUTER_IP:3000>

Download the signed Android release APK from the same phone:

<http://YOUR_COMPUTER_IP:3000/IndusCart-release.apk>

Keep both terminals open while using the local website. Stop either service with `Ctrl+C`.

## 3. Sign up and sign in

1. Open `/register` or select **Register** in the navigation.
2. Enter your name, email, country, password, and confirmation password.
3. Select **Create Account**.
4. After registration, open **Logout** from the navigation.
5. Open `/login` and enter the same email and password.
6. A successful login returns you to the shop.

The login form accepts either an email address or username. A wrong password stays on the login page and shows an error message.

The current database administrator email is `admin@induscart.com`. If its
password is unknown, reset it from the backend terminal using the secure reset
instructions in the main README, then sign in again.

## 4. If the phone cannot open the website

Check these items:

- The phone and computer are connected to the same Wi-Fi network.
- The frontend was started with `--host 0.0.0.0`.
- `frontend/.env` contains the computer's LAN API address:

```env
VITE_API_URL=http://YOUR_COMPUTER_IP:5000
```

- The backend terminal is still running.
- Windows Firewall allows inbound TCP ports `3000` and `5000`.
- Test the API URL from the phone first:
  <http://YOUR_COMPUTER_IP:5000/health/live>
- If that health URL works but products do not load, test the product endpoint:
  <http://YOUR_COMPUTER_IP:5000/api/products>

If Windows Firewall blocks access, allow Node.js on private networks or create inbound rules for TCP ports `3000` and `5000` using Windows Firewall settings.

From an elevated PowerShell window, the rules can be created with:

```powershell
New-NetFirewallRule -DisplayName "IndusCart frontend 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
New-NetFirewallRule -DisplayName "IndusCart API 5000" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow -Profile Private
```

## 5. Build and install the Android APK

The APK uses the `VITE_API_URL` value that exists when the web assets are built. For local phone testing, set:

```env
VITE_API_URL=http://YOUR_COMPUTER_IP:5000
```

Build the signed release APK:

```powershell
cd "C:\Users\ZS computers\Documents\e-commerce\frontend"
npm.cmd run build
npx.cmd cap sync android
cd android
.\gradlew.bat assembleRelease
```

The release APK is created at:

```text
frontend/android/app/build/outputs/apk/release/app-release.apk
```

Copy `app-release.apk` to an Android phone, open it, enable **Install unknown apps** when prompted, and select **Install**.

If Android says the app cannot be installed because another IndusCart version is already installed, uninstall the older debug/test IndusCart app first, then install this release APK. The debug and release builds use different signing keys.

The APK is version `1.0.0`, uses the new package ID `com.induscart.mobile`, and supports Android API 24 and newer. The new package ID allows it to install alongside the older Flutter/debug app. The phone still needs network access to the backend address in `VITE_API_URL`; an APK cannot use `localhost` to reach the development computer.

## 6. Production website and APK

The local IP represented by `YOUR_COMPUTER_IP` is only for the same Wi-Fi network. It is not a public production address.

For public production:

1. Deploy the backend to a server with MongoDB access.
2. Put the backend behind HTTPS, for example `https://api.example.com`.
3. Set `CORS_ORIGINS` to the real website origin.
4. Set `frontend/.env` to the HTTPS API URL:

```env
VITE_API_URL=https://api.example.com
```

5. Rebuild the website and APK.

The production website output is `frontend/dist`. It can be served by the included Nginx Docker image or another static HTTPS host. A public domain and HTTPS certificate are required for reliable access from all devices.

## Common URLs

| Purpose | URL |
| --- | --- |
| Website on computer | <http://localhost:3000> |
| Website on same Wi-Fi | <http://YOUR_COMPUTER_IP:3000> |
| Android APK download | <http://YOUR_COMPUTER_IP:3000/IndusCart-release.apk> |
| API health on computer | <http://localhost:5000/health/live> |
| API health on same Wi-Fi | <http://YOUR_COMPUTER_IP:5000/health/live> |
| Sign in | <http://localhost:3000/login> |
| Sign up | <http://localhost:3000/register> |
| Admin | <http://localhost:3000/admin> |
