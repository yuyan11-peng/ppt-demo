@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo   办公帮帮 COM Add-in 注册脚本
echo   (原生 CustomTaskPane 方案)
echo   (需要管理员权限运行)
echo ============================================
echo.

set REGASM=%windir%\Microsoft.NET\Framework64\v4.0.30319\RegAsm.exe
set OUT_DIR=%~dp0build
set CTRL_DLL=%OUT_DIR%\TaskPaneControl.dll
set ADDIN_DLL=%OUT_DIR%\BangBangAddin.dll

::: 检查文件是否存在
if not exist "%CTRL_DLL%" (
    echo ERROR: TaskPaneControl.dll not found. Please run build.bat first.
    pause
    exit /b 1
)
if not exist "%ADDIN_DLL%" (
    echo ERROR: BangBangAddin.dll not found. Please run build.bat first.
    pause
    exit /b 1
)

::: 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script requires Administrator privileges!
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/5] Unregistering previous version of BangBangAddin...
%REGASM% "%ADDIN_DLL%" /unregister /nologo >nul 2>&1

echo [2/5] Unregistering previous version of TaskPaneControl...
%REGASM% "%CTRL_DLL%" /unregister /nologo >nul 2>&1

echo [3/5] Registering TaskPaneControl.dll (ActiveX container)...
%REGASM% "%CTRL_DLL%" /codebase /nologo

if %errorlevel% neq 0 (
    echo.
    echo ERROR: TaskPaneControl registration failed!
    pause
    exit /b 1
)

echo [4/5] Registering BangBangAddin.dll (COM Add-in)...
%REGASM% "%ADDIN_DLL%" /codebase /nologo

if %errorlevel% neq 0 (
    echo.
    echo ERROR: BangBangAddin registration failed!
    pause
    exit /b 1
)

echo [5/5] Adding to PowerPoint Add-ins registry...
reg add "HKCU\Software\Microsoft\Office\PowerPoint\Addins\BangBangAddin.Addin" /v FriendlyName /d "办公帮帮 - AI 智能助手" /f >nul
reg add "HKCU\Software\Microsoft\Office\PowerPoint\Addins\BangBangAddin.Addin" /v Description /d "基于 Vue3 和 AI 的智能演示文稿工具" /f >nul
reg add "HKCU\Software\Microsoft\Office\PowerPoint\Addins\BangBangAddin.Addin" /v LoadBehavior /t REG_DWORD /d 3 /f >nul

echo.
echo ============================================
echo   Registration complete!
echo   Please open PowerPoint to test.
echo ============================================
echo.
pause
