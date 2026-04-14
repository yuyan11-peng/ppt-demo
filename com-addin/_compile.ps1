$csc = Join-Path $env:windir "Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$srcDir = "d:\Project\vue3-ts-demo\com-addin"
$outDir = Join-Path $srcDir "build"
$libDir = Join-Path $srcDir "libs"
$stdole = Join-Path ${env:ProgramFiles(x86)} "Microsoft.NET\Primary Interop Assemblies\stdole.dll"

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

# Step 1: Compile TaskPaneControl.dll
Write-Host "[1/2] Compiling TaskPaneControl.dll ..."
$src1 = Join-Path $srcDir "TaskPaneControl.cs"
$out1 = Join-Path $outDir "TaskPaneControl.dll"
$args1 = "/nologo", "/target:library", "/out:$out1", "/reference:System.dll", "/reference:System.Windows.Forms.dll", "/platform:AnyCPU", "/langversion:latest", "/warnaserror-", $src1
$result1 = & $csc @args1 2>&1
Write-Host ($result1 -join "`n")
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: TaskPaneControl"; exit 1 }

# Step 2: Compile BangBangAddin.dll
Write-Host "[2/2] Compiling BangBangAddin.dll ..."
$src2 = Join-Path $srcDir "BangBangAddin.cs"
$out2 = Join-Path $outDir "BangBangAddin.dll"
$extDll = Join-Path $libDir "Extensibility.dll"
$officeDll = Join-Path $libDir "Office.dll"
$pptDll = Join-Path $libDir "Microsoft.Office.Interop.PowerPoint.dll"
$ctrlDll = Join-Path $outDir "TaskPaneControl.dll"

$args2 = "/nologo", "/target:library", "/out:$out2",
    "/reference:$ctrlDll",
    "/reference:$extDll",
    "/reference:$officeDll",
    "/reference:$pptDll",
    "/reference:$stdole",
    "/reference:System.dll",
    "/reference:System.Windows.Forms.dll",
    "/reference:System.Drawing.dll",
    "/reference:Microsoft.CSharp.dll",
    "/platform:AnyCPU", "/langversion:latest", "/warnaserror-", $src2

$result2 = & $csc @args2 2>&1
Write-Host ($result2 -join "`n")
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: BangBangAddin"; exit 1 }

# Copy RibbonXml
Copy-Item (Join-Path $srcDir "RibbonXml.xml") $outDir -Force
Write-Host "BUILD SUCCESS"
