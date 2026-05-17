@echo off
setlocal EnableExtensions
chcp 65001 >nul
title personalBlogweb - start local manager

set "ROOT_DIR=%~dp0"
set "MANAGER_DIR=%ROOT_DIR%..\my-blog-manager"
set "MANAGER_START=%MANAGER_DIR%\start_all.bat"

echo ========================================
echo   personalBlogweb local manager proxy
echo ========================================
echo.

if not exist "%MANAGER_START%" (
  echo [ERROR] Cannot find "%MANAGER_START%".
  echo [INFO] Expected sibling manager checkout: "%MANAGER_DIR%"
  pause
  exit /b 1
)

echo [INFO] Forwarding to sibling manager start script.
echo [INFO] Manager directory: %MANAGER_DIR%
echo [INFO] Default mode is dev, so manager source edits show immediately.
echo.

call "%MANAGER_START%" %*
endlocal
