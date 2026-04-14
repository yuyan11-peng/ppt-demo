# PPT Kit — PowerPoint Add-in 完整安装方案

> 本文档详细说明如何将 PPT Kit（基于 Vue3 + TypeScript 的 AI 智能演示文稿工具）作为 Office Web Add-in 安装到桌面版 PowerPoint 中。

---

## 目录

1. [环境要求](#1-环境要求)
2. [项目初始化](#2-项目初始化)
3. [HTTPS 证书安装（关键步骤）](#3-https-证书安装关键步骤)
4. [启动开发服务器](#4-启动开发服务器)
5. [注册表 Sideload 配置](#5-注册表-sideload-配置)
6. [在 PowerPoint 中加载插件](#6-在-powerpoint-中加载插件)
7. [项目关键文件说明](#7-项目关键文件说明)
8. [常见问题排查](#8-常见问题排查)
9. [生产部署](#9-生产部署)

---

## 1. 环境要求

| 项目 | 最低要求 |
|------|----------|
| **操作系统** | Windows 10/11 |
| **Node.js** | v18+ |
| **PowerPoint** | Office 2016+ / Office 365 / Office LTSC 2021+ |
| **WebView2 Runtime** | 已安装（Windows 11 自带，Windows 10 需手动安装） |

### 检查 WebView2 是否已安装

```powershell
# 检查 WebView2 Runtime
Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty pv
```

如未安装，从 [Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) 下载安装。

---

## 2. 项目初始化

```powershell
# 克隆项目并安装依赖
cd d:\Project\vue3-ts-demo
npm install
```

`package.json` 中已包含所有必要依赖，关键依赖说明：

| 依赖 | 用途 |
|------|------|
| `vue` | UI 框架 |
| `pptxgenjs` | PPTX 文件生成 |
| `@modelcontextprotocol/sdk` | MCP 协议通信 |
| `office-addin-dev-certs` | **微软官方 HTTPS 开发证书工具** |

---

## 3. HTTPS 证书安装（⚠️ 关键步骤）

> **这是最容易出问题的环节。** Office Web Add-in 使用系统级 WebView 引擎加载插件页面，对 HTTPS 证书验证极为严格。如果证书不被系统信任，Office 会**静默拒绝加载插件**——不报任何错误，也不显示任何按钮。

### 3.1 使用微软官方工具安装证书（推荐）

```powershell
# 安装并信任证书（会弹出系统安全提示，点击"是"）
npx office-addin-dev-certs install
```

此命令会：
- 生成 CA 根证书和 localhost 证书
- 将 CA 证书安装到 **系统受信任根证书存储区**
- 证书文件保存在 `~/.office-addin-dev-certs/` 目录

### 3.2 验证证书是否安装成功

```powershell
# 验证证书状态
npx office-addin-dev-certs verify
```

输出应显示：
```
You have trusted access to https://localhost.
Certificate: C:\Users\<用户名>\.office-addin-dev-certs\localhost.crt
Key: C:\Users\<用户名>\.office-addin-dev-certs\localhost.key
CA: C:\Users\<用户名>\.office-addin-dev-certs\ca.crt
```

### 3.3 证书加载逻辑

`vite.config.ts` 中的证书加载优先级：

```
1. 优先查找: ~/.office-addin-dev-certs/localhost.crt + localhost.key (微软官方证书)
2. 回退查找: ./certs/localhost.crt + localhost.key (项目本地证书)
3. 均不存在: 不启用 HTTPS (插件无法工作)
```

> **⚠️ 踩坑提醒：** 不要使用 `mkcert`、`openssl` 等工具自行生成证书。即使将自签名 CA 安装到系统证书存储区，Office WebView 引擎仍可能不信任。必须使用微软官方的 `office-addin-dev-certs` 工具。

---

## 4. 启动开发服务器

```powershell
cd d:\Project\vue3-ts-demo
npm run dev
```

启动后控制台应输出：

```
Using Office Add-in dev certs (trusted)    ← 确认使用了官方受信任证书
  VITE v6.x.x  ready
  ➜  Local:   https://localhost:8989/
  ➜  Network: https://0.0.0.0:8989/
```

### 验证服务是否正常

在浏览器中访问以下地址，确认均能正常加载（无证书警告）：

- `https://localhost:8989/index.html` — 主页面
- `https://localhost:8989/icons/icon-32.png` — 图标文件

---

## 5. 注册表 Sideload 配置

Office Web Add-in 的开发版加载（Sideload）通过注册表配置实现。

### 5.1 自动配置（PowerShell 管理员权限）

```powershell
# 创建注册表项（指向包含 manifest.xml 的目录）
$regPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer"
if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}
Set-ItemProperty -Path $regPath -Name "ppt-kit" -Value "d:\Project\vue3-ts-demo\manifest-share" -Type String
```

> **注意：** 注册表值必须指向包含 `manifest.xml` 的**目录路径**（不是文件路径本身）。

### 5.2 验证注册表配置

```powershell
Get-ItemProperty -Path "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer"
```

应输出：

```
ppt-kit : d:\Project\vue3-ts-demo\manifest-share
```

### 5.3 共享目录结构

```
manifest-share/
  └── manifest.xml    ← 与项目根目录的 manifest.xml 内容一致
```

两个 `manifest.xml`（根目录和 `manifest-share/` 下）内容完全相同，注册表指向 `manifest-share` 目录。

---

## 6. 在 PowerPoint 中加载插件

### 6.1 清除 Office 缓存

首次安装或更新 manifest 后，建议清除缓存：

```powershell
# 清除 WEF 缓存
$paths = @(
    "$env:LOCALAPPDATA\Microsoft\Office\16.0\Wef",
    "$env:LOCALAPPDATA\Microsoft\Office\16.0\WefCache"
)
foreach ($p in $paths) {
    if (Test-Path $p) {
        Remove-Item -Path "$p\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Cleared: $p"
    }
}
```

### 6.2 加载步骤

1. **确保开发服务器正在运行**（`npm run dev`，端口 8989）
2. **完全关闭 PowerPoint**
   - 确认任务管理器中没有 `POWERPNT.EXE` 进程
3. **重新打开 PowerPoint**，打开任意演示文稿
4. 在 **"开始"选项卡** 工具栏最右侧，应出现 **"PPT Kit"** 按钮组
5. 点击 **"Open PPT Kit"** 按钮，右侧将打开任务窗格面板

### 6.3 备选加载方式

如果注册表方式未生效，可通过菜单手动加载：

1. 打开 PowerPoint → **"插入"选项卡** → **"获取加载项"**（或 **"我的加载项"**）
2. 选择 **"共享文件夹"** 标签页
3. 找到 **"PPT Kit - AI Smart Presentation"** 并点击添加

---

## 7. 项目关键文件说明

### 7.1 整体目录结构

```
vue3-ts-demo/
├── certs/                   # 本地证书备份（回退用）
│   ├── ca.crt
│   ├── localhost.crt
│   └── localhost.key
├── manifest.xml             # Office Add-in 清单文件（根目录）
├── manifest-share/          # Sideload 共享目录
│   └── manifest.xml         # 清单文件副本（注册表指向此目录）
├── public/
│   └── icons/               # Office 工具栏图标
│       ├── icon-16.png      # 16x16 小图标
│       ├── icon-32.png      # 32x32 标准图标
│       └── icon-80.png      # 80x80 高清图标
├── src/                     # Vue3 应用源码
├── index.html               # 入口页面（含 Office.js 引用）
├── vite.config.ts           # Vite 配置（HTTPS、端口等）
├── package.json             # 项目依赖
└── scripts/
    └── certs.mjs            # 证书管理脚本
```

### 7.2 manifest.xml 核心配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `Id` | `12345678-1234-1234-1234-123456789abc` | 插件唯一标识 GUID |
| `xsi:type` | `TaskPaneApp` | 任务窗格类型插件 |
| `Host Name` | `Presentation` | 目标宿主为 PowerPoint |
| `SourceLocation` | `https://localhost:8989/index.html` | 插件页面地址 |
| `ExtensionPoint` | `PrimaryCommandSurface` | 在功能区工具栏显示按钮 |
| `OfficeTab id` | `TabHome` | 按钮添加到"开始"选项卡 |
| `Action` | `ShowTaskpane` | 点击按钮打开任务窗格 |
| `Permissions` | `ReadWriteDocument` | 读写文档权限 |

### 7.3 index.html 关键引用

```html
<!-- Office.js SDK — 必须在 body 之前加载 -->
<script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>
```

此 CDN 脚本使 Web 应用具备与 PowerPoint 交互的能力。在普通浏览器中打开时会自动忽略。

### 7.4 vite.config.ts 关键配置

```typescript
const DEV_PORT = 8989  // 必须与 manifest.xml 中的端口一致

server: {
  host: '0.0.0.0',
  port: DEV_PORT,
  strictPort: true,     // 端口占用时直接报错，不自动切换
  open: false,           // 不自动打开浏览器
  https: getHttpsOptions()  // 使用受信任的 HTTPS 证书
}
```

---

## 8. 常见问题排查

### ❌ 问题 1：工具栏上没有出现 PPT Kit 按钮

**排查步骤：**

```powershell
# 1. 确认开发服务器正在运行
netstat -ano | findstr ":8989" | findstr "LISTENING"

# 2. 确认注册表配置存在
Get-ItemProperty "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer"

# 3. 确认证书受信任
npx office-addin-dev-certs verify

# 4. 确认 manifest.xml 可被 Office 读取
Test-Path "d:\Project\vue3-ts-demo\manifest-share\manifest.xml"

# 5. 清除 WEF 缓存后重启 PowerPoint
Remove-Item "$env:LOCALAPPDATA\Microsoft\Office\16.0\Wef\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:LOCALAPPDATA\Microsoft\Office\16.0\WefCache\*" -Recurse -Force -ErrorAction SilentlyContinue
```

**最常见原因（按概率排序）：**

| # | 原因 | 解决方案 |
|---|------|----------|
| 1 | **HTTPS 证书不受 Office 信任** | 运行 `npx office-addin-dev-certs install` |
| 2 | 开发服务器未启动 | 运行 `npm run dev` |
| 3 | 注册表路径指向文件而非目录 | 确保值为目录路径 |
| 4 | WEF 缓存未清除 | 清除缓存 + 完全重启 PowerPoint |
| 5 | manifest.xml 语法错误 | 用 [Office Add-in Manifest Validator](https://github.com/OfficeDev/office-addin-manifest) 校验 |

### ❌ 问题 2：PowerPoint 显示 "此加载项无法启动" 或白屏

```powershell
# 确认页面能正常访问
Invoke-WebRequest -Uri "https://localhost:8989/index.html" -SkipCertificateCheck -UseBasicParsing | Select-Object StatusCode

# 确认图标文件可访问
Invoke-WebRequest -Uri "https://localhost:8989/icons/icon-32.png" -SkipCertificateCheck -UseBasicParsing | Select-Object StatusCode
```

### ❌ 问题 3：使用了自签名证书但 Office 不加载

> **根因：** Office Web Add-in 使用系统级 WebView（IE Trident 或 Edge WebView2）加载页面。与浏览器不同，WebView **不会弹出"继续访问"提示**，而是直接静默拒绝不受信任的连接。

**解决方案：** 必须使用微软官方 `office-addin-dev-certs` 工具。该工具会将 CA 证书正确安装到系统的受信任根证书颁发机构。

```powershell
# 卸载旧证书（如有）
npx office-addin-dev-certs uninstall

# 重新安装
npx office-addin-dev-certs install

# 验证
npx office-addin-dev-certs verify
```

---

## 9. 生产部署

开发环境使用 `localhost:8989`，生产环境需要部署到真实 HTTPS 域名。

### 9.1 构建

```powershell
npm run build
```

产出目录：`dist/`

### 9.2 修改 manifest.xml

将所有 `https://localhost:8989` 替换为生产域名：

```xml
<!-- 开发 -->
<SourceLocation DefaultValue="https://localhost:8989/index.html" />

<!-- 生产 -->
<SourceLocation DefaultValue="https://your-domain.com/ppt-kit/index.html" />
```

### 9.3 部署方式

| 方式 | 适用场景 |
|------|----------|
| **集中部署** | 企业管理员通过 Microsoft 365 管理中心分发 |
| **SharePoint 目录** | 组织内通过 SharePoint 应用目录分发 |
| **AppSource 发布** | 面向公众发布到 Microsoft AppSource 商店 |

---

## 快速启动命令汇总

```powershell
# 一键安装和启动（首次）
cd d:\Project\vue3-ts-demo
npm install                          # 1. 安装依赖
npx office-addin-dev-certs install   # 2. 安装受信任 HTTPS 证书
npm run dev                          # 3. 启动 HTTPS 开发服务器

# 配置 Office Sideload（首次，PowerShell）
$regPath = "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer"
if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
Set-ItemProperty -Path $regPath -Name "ppt-kit" -Value "d:\Project\vue3-ts-demo\manifest-share" -Type String

# 清除缓存
Remove-Item "$env:LOCALAPPDATA\Microsoft\Office\16.0\Wef\*" -Recurse -Force -ErrorAction SilentlyContinue

# 日常开发启动
cd d:\Project\vue3-ts-demo
npm run dev                          # 启动后打开 PowerPoint 即可
```

---

> 📅 最后更新：2026 年 4 月  
> 🔧 基于实际调试验证，适用于 Office LTSC 2021+ / Office 365 / Windows 10+
