@echo off
setlocal EnableExtensions
chcp 65001 >nul
title personalBlogweb - start

set "ROOT_DIR=%~dp0"
set "APP_PORT=3000"
set "APP_URL=http://127.0.0.1:%APP_PORT%"

if not "%~1"=="" set "APP_PORT=%~1"
set "APP_URL=http://127.0.0.1:%APP_PORT%"

echo ========================================
echo   personalBlogweb public site - start
echo ========================================
echo.
echo [INFO] Local dev URL: %APP_URL%
echo [INFO] This script only starts the public blog, not my-blog-manager.
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install Node.js first.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Install Node.js/npm first.
  pause
  exit /b 1
)

if not exist "%ROOT_DIR%node_modules" (
  echo [INFO] node_modules not found. Running npm install...
  cd /d "%ROOT_DIR%"
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

set "PORT_PID="
for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "try { (Get-NetTCPConnection -State Listen -LocalPort %APP_PORT% -ErrorAction Stop | Select-Object -First 1 -ExpandProperty OwningProcess) } catch { '' }"`) do set "PORT_PID=%%P"

if defined PORT_PID (
  echo [INFO] Port %APP_PORT% is already listening. PID: %PORT_PID%
  echo [INFO] Opening %APP_URL%
  start "" "%APP_URL%"
  exit /b 0
)

echo [INFO] Starting Next.js dev server on %APP_URL%
set "NEXT_TELEMETRY_DISABLED=1"
start "personalBlogweb-public-dev" cmd /k "cd /d ""%ROOT_DIR%"" && set ""NEXT_TELEMETRY_DISABLED=1"" && npm run dev -- --hostname 127.0.0.1 --port %APP_PORT%"

echo [INFO] Waiting for startup...
timeout /t 4 /nobreak >nul
start "" "%APP_URL%"

echo.
echo [OK] Public site startup command sent.
echo [INFO] URL: %APP_URL%
echo [INFO] Use stop_all.bat in this folder to stop it.
echo.
pause
