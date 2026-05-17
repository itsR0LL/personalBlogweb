@echo off
setlocal EnableExtensions
chcp 65001 >nul
title personalBlogweb - stop

set "ROOT_DIR=%~dp0"
set "APP_PORT=3000"
if not "%~1"=="" set "APP_PORT=%~1"

echo ========================================
echo   personalBlogweb public site - stop
echo ========================================
echo.

echo [1/3] Closing public-site console windows...
taskkill /fi "WindowTitle eq personalBlogweb-public-dev*" /f /t >nul 2>&1
if errorlevel 1 (
  echo [INFO] No matching public-site console window found.
) else (
  echo [OK] Matching console window stopped.
)

echo.
echo [2/3] Cleaning node processes tied to this folder...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$root=(Resolve-Path '%ROOT_DIR%').Path; Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -like ('*' + $root + '*') -and (($_.Name -eq 'node.exe') -or (($_.Name -eq 'cmd.exe') -and ($_.CommandLine -match 'npm run dev|next\\dist\\bin\\next'))) } | ForEach-Object { Write-Host ('[INFO] Killing PID ' + $_.ProcessId + ' ' + $_.Name); Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo.
echo [3/3] Releasing port %APP_PORT% if it is still owned by this checkout...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$root=(Resolve-Path '%ROOT_DIR%').Path; try { $ownerPids=Get-NetTCPConnection -State Listen -LocalPort %APP_PORT% -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess -Unique } catch { $ownerPids=@() }; foreach ($ownerPid in $ownerPids) { $proc=Get-CimInstance Win32_Process -Filter ('ProcessId=' + $ownerPid) -ErrorAction SilentlyContinue; if ($proc -and $proc.CommandLine -like ('*' + $root + '*')) { Write-Host ('[INFO] Killing PID ' + $ownerPid + ' on port %APP_PORT%'); Stop-Process -Id $ownerPid -Force -ErrorAction SilentlyContinue } else { Write-Host ('[WARN] Port %APP_PORT% is used by PID ' + $ownerPid + ', but it does not look like this checkout. Leaving it running.') } }"

echo.
echo [OK] Stop command complete.
pause
