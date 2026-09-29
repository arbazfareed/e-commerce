@echo off
setlocal
set "PROJECT_ROOT=%~dp0"

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo Node.js and npm were not found on PATH. Install Node.js LTS, then reopen this file.
  pause
  exit /b 1
)

if not exist "%PROJECT_ROOT%backend\.env" (
  echo Missing backend\.env. Copy backend\.env.example to backend\.env and configure MONGO_URI and JWT_SECRET first.
  pause
  exit /b 1
)

start "IndusCart API" /D "%PROJECT_ROOT%backend" cmd /k "if exist node_modules (npm.cmd run dev) else (npm.cmd ci && npm.cmd run dev)"
start "IndusCart Storefront" /D "%PROJECT_ROOT%frontend" cmd /k "if exist node_modules (npm.cmd start -- --host 0.0.0.0) else (npm.cmd ci && npm.cmd start -- --host 0.0.0.0)"

echo IndusCart is starting. Keep both terminal windows open.
echo Storefront: http://localhost:3000
echo Backend health: http://localhost:5000/health/ready
echo For phone testing on the same Wi-Fi, use your computer's LAN IP and allow ports 3000 and 5000 in Windows Firewall.
