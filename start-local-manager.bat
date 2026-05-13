@echo off
setlocal
chcp 65001 >nul

set "ROOT_DIR=%~dp0"
set "MANAGER_DIR=%ROOT_DIR%my-blog-manager"

echo === Local Blog Manager Launcher ===

if not exist "%MANAGER_DIR%\run_me.py" (
  echo ERROR: Cannot find "%MANAGER_DIR%\run_me.py".
  echo Please run this file from the personalBlogweb repository root.
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js was not found. Install Node.js before starting the manager.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm was not found. Install Node.js/npm before starting the manager.
  pause
  exit /b 1
)

set "PYTHON_CMD="
py -3.10 --version >nul 2>&1
if not errorlevel 1 set "PYTHON_CMD=py -3.10"

if not defined PYTHON_CMD (
  py -3 --version >nul 2>&1
  if not errorlevel 1 set "PYTHON_CMD=py -3"
)

if not defined PYTHON_CMD (
  python --version >nul 2>&1
  if not errorlevel 1 set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
  echo ERROR: Python was not found. Install Python 3.10+ before starting the manager.
  pause
  exit /b 1
)

cd /d "%MANAGER_DIR%"

echo Manager directory: %CD%
echo Starting local Next.js UI and Python backend...
echo A Blog Manager window should open after dependencies are checked.

%PYTHON_CMD% run_me.py
if errorlevel 1 (
  echo.
  echo ERROR: Local Blog Manager failed to start.
  pause
  exit /b 1
)

endlocal
