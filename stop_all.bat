@echo off
setlocal EnableExtensions
chcp 65001 >nul
title personalBlogweb - stop

set "APP_PORT=3000"

echo ========================================
echo   personalBlogweb public site - stop
echo ========================================
echo.

echo [1/2] Closing debug console windows...
taskkill /fi "WindowTitle eq personalBlogweb-public-dev*" /f /t >nul 2>&1
if errorlevel 1 (
  echo [INFO] No matching public-site console window found.
) else (
  echo [OK] Matching console window stopped.
)

echo.
echo [2/2] Releasing port %APP_PORT% if needed...
set "FOUND_PID="
for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Get-NetTCPConnection -State Listen -LocalPort %APP_PORT% -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess -Unique } catch { '' }"`) do (
  set "FOUND_PID=1"
  echo [INFO] Killing PID %%P on port %APP_PORT%
  taskkill /pid %%P /f /t >nul 2>&1
)

if not defined FOUND_PID (
  echo [INFO] Port %APP_PORT% is already free.
)

echo.
echo [OK] Stop command complete.
pause
