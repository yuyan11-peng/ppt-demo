@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo   办公帮帮 COM Add-in 卸载脚本
echo   (需要管理员权限运行)
echo ============================================
echo.

set REGASM=%windir%\Microsoft.NET\Framework64\v4.0.30319\RegAsm.exe
set OUT_DIR=%~dp0build
set CTRL_DLL=%OUT_DIR%\TaskPaneControl.dll
set ADDIN_DLL=%OUT_DIR%\BangBangAddin.dll

::: 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script requires Administrator privileges!
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/3] Removing from PowerPoint Add-ins registry...
reg delete "HKCU\Software\Microsoft\Office\PowerPoint\Addins\BangBangAddin.Addin" /f >nul 2>&1

echo [2/3] Unregistering BangBangAddin.dll...
%REGASM% "%ADDIN_DLL%" /unregister /nologo >nul 2>&1

echo [3/3] Unregistering TaskPaneControl.dll...
%REGASM% "%CTRL_DLL%" /unregister /nologo >nul 2>&1

echo.
echo Unregistration complete!
echo.
pause
