@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo   办公帮帮 COM Add-in 编译脚本
echo   (原生 CustomTaskPane 方案)
echo ============================================
echo.

set CSC=%windir%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
set OUT_DIR=%~dp0build
set LIB_DIR=%~dp0libs

if not exist "%CSC%" (
    echo ERROR: csc.exe not found at %CSC%
    pause
    exit /b 1
)

::: 创建输出目录
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

echo [1/4] Compiling TaskPaneControl.dll (ActiveX container) ...
%CSC% /nologo /target:library /out:"%OUT_DIR%\TaskPaneControl.dll" /reference:System.dll /reference:System.Windows.Forms.dll /platform:AnyCPU /langversion:latest /warnaserror- "%~dp0TaskPaneControl.cs"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: TaskPaneControl compilation failed!
    pause
    exit /b 1
)

echo [2/4] Compiling BangBangAddin.dll (COM Add-in with ICustomTaskPaneConsumer) ...
%CSC% /nologo /target:library /out:"%OUT_DIR%\BangBangAddin.dll" /reference:"%OUT_DIR%\TaskPaneControl.dll" /reference:"%LIB_DIR%\Extensibility.dll" /reference:"%LIB_DIR%\Office.dll" /reference:"%LIB_DIR%\Microsoft.Office.Interop.PowerPoint.dll" /reference:"%ProgramFiles(x86)%\Microsoft.NET\Primary Interop Assemblies\stdole.dll" /reference:System.dll /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:Microsoft.CSharp.dll /platform:AnyCPU /langversion:latest /warnaserror- "%~dp0BangBangAddin.cs"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: BangBangAddin compilation failed!
    pause
    exit /b 1
)

echo [3/4] Copying RibbonXml.xml ...
copy /y "%~dp0RibbonXml.xml" "%OUT_DIR%\RibbonXml.xml" >nul

echo [4/4] Build complete!
echo.
echo Output files:
echo   %OUT_DIR%\TaskPaneControl.dll  (ActiveX container - must register first)
echo   %OUT_DIR%\BangBangAddin.dll    (COM Add-in main)
echo.
echo Next steps:
echo   1. Run register.bat as Administrator to register both DLLs
echo   2. Open PowerPoint to test
echo.
pause
