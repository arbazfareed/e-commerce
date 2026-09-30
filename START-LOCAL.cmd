@echo off
setlocal
set "PROJECT_ROOT=%~dp0"
set "APP_PORT=3000"
set "APP_MODE=shopper"
set "APP_NAME=Shopper Storefront"
set "APP_ROUTE=/"
if /I "%~1"=="admin" (
  set "APP_PORT=3001"
  set "APP_MODE=admin"
  set "APP_NAME=Administrator Portal"
  set "APP_ROUTE=/admin/login"
)
set "APP_URL=http://localhost:%APP_PORT%%APP_ROUTE%"

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo Node.js and npm were not found on this computer.
  echo Install Node.js LTS, restart Windows, then double-click this launcher again.
  pause
  exit /b 1
)

if not exist "%PROJECT_ROOT%backend\.env" (
  if exist "%PROJECT_ROOT%backend\.env.example" (
    copy /Y "%PROJECT_ROOT%backend\.env.example" "%PROJECT_ROOT%backend\.env" >nul
    echo Created backend\.env from the included example for local development.
  ) else (
    echo Could not find backend\.env or backend\.env.example.
    pause
    exit /b 1
  )
)
if not exist "%PROJECT_ROOT%frontend\.env" if exist "%PROJECT_ROOT%frontend\.env.example" copy /Y "%PROJECT_ROOT%frontend\.env.example" "%PROJECT_ROOT%frontend\.env" >nul

call :port_open 5000
if errorlevel 1 (
  echo Starting the shared IndusCart API...
  start "IndusCart API" /D "%PROJECT_ROOT%backend" cmd /k "if exist node_modules (npm.cmd run dev) else (npm.cmd ci && npm.cmd run dev)"
) else (
  echo Reusing the API already running on port 5000.
)

call :port_open %APP_PORT%
if errorlevel 1 (
  echo Starting the IndusCart %APP_NAME% on port %APP_PORT%...
  start "IndusCart %APP_NAME%" /D "%PROJECT_ROOT%frontend" cmd /k "set VITE_APP_MODE=%APP_MODE%&& if exist node_modules (npm.cmd start -- --host 0.0.0.0 --port %APP_PORT% --strictPort) else (npm.cmd ci && npm.cmd start -- --host 0.0.0.0 --port %APP_PORT% --strictPort)"
) else (
  echo Reusing the IndusCart %APP_NAME% already running on port %APP_PORT%.
)

echo.
if /I "%~1"=="admin" (
  echo Opening the isolated Administrator Portal at http://localhost:3001.
) else (
  echo Opening the Shopper Storefront at http://localhost:3000.
)
echo Keep the IndusCart API and this portal window open while using the app.
echo If the API reports MongoDB is unavailable, start MongoDB and double-click this launcher again.

echo Waiting for the selected portal to start on port %APP_PORT%...
set "WAIT_COUNT=0"
:wait_for_frontend
call :port_open %APP_PORT%
if not errorlevel 1 goto open_app
set /a WAIT_COUNT+=1
if %WAIT_COUNT% GEQ 120 goto open_app
 timeout /t 1 /nobreak >nul
goto wait_for_frontend

:open_app
start "" "%APP_URL%"
exit /b 0

:port_open
powershell -NoProfile -Command "try { if (Get-NetTCPConnection -State Listen -LocalPort %~1 -ErrorAction Stop) { exit 0 } } catch {}; exit 1" >nul 2>&1
exit /b %errorlevel%
