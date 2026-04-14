@echo off
set CSC=%windir%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
set OUT_DIR=d:\Project\vue3-ts-demo\com-addin\build
set LIB_DIR=d:\Project\vue3-ts-demo\com-addin\libs
set STDOLE=%ProgramFiles(x86)%\Microsoft.NET\Primary Interop Assemblies\stdole.dll

if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

echo [1/2] Compiling TaskPaneControl.dll ...
%CSC% /nologo /target:library /out:"%OUT_DIR%\TaskPaneControl.dll" /reference:System.dll /reference:System.Windows.Forms.dll /platform:AnyCPU /langversion:latest /warnaserror- "d:\Project\vue3-ts-demo\com-addin\TaskPaneControl.cs"
if %errorlevel% neq 0 (
    echo FAILED: TaskPaneControl
    exit /b 1
)

echo [2/2] Compiling BangBangAddin.dll ...
%CSC% /nologo /target:library /out:"%OUT_DIR%\BangBangAddin.dll" /reference:"%OUT_DIR%\TaskPaneControl.dll" /reference:"%LIB_DIR%\Extensibility.dll" /reference:"%LIB_DIR%\Office.dll" /reference:"%LIB_DIR%\Microsoft.Office.Interop.PowerPoint.dll" /reference:"%STDOLE%" /reference:System.dll /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:Microsoft.CSharp.dll /platform:AnyCPU /langversion:latest /warnaserror- "d:\Project\vue3-ts-demo\com-addin\BangBangAddin.cs"
if %errorlevel% neq 0 (
    echo FAILED: BangBangAddin
    exit /b 1
)

copy /y "d:\Project\vue3-ts-demo\com-addin\RibbonXml.xml" "%OUT_DIR%\RibbonXml.xml" >nul

echo BUILD SUCCESS
