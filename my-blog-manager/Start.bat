@echo off
:: 强制切换到脚本所在目录，防止路径迷失
cd /d %~dp0

echo --- Blog Manager starting ---

:: 1. 优先尝试使用 py -3.10 (针对你装了多个 Python 的情况)
py -3.10 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [状态] 正在调用 Python 3.10 环境...
    py -3.10 run_me.py
    goto end
)

:: 2. 如果没有 py 命令，尝试直接用 python (假设 3.10 是默认)
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [状态] 正在调用默认 Python 环境...
    python run_me.py
    goto end
)

echo 错误：未找到 Python 环境，请确保已安装 Python 3.10。
pause

:end
exit
