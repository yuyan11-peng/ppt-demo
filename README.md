# PPT Kit - AI 智能演示文稿工具

基于 Vue3 + TypeScript + Vite 构建的智能 PPT 编辑器，内置 **MCP Server** 支持 AI 辅助创建，同时可作为 **PowerPoint 插件 (Office Add-in)** 直接嵌入 PowerPoint 使用。

![Vue3](https://img.shields.io/badge/Vue3-Composition_API-42b883?logo=vue.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript) ![MCP](https://img.shields.io/badge/MCP-Protocol-blue) ![Office Add-in](https://img.shields.io/badge/Office_Add-in-PowerPoint-green) ![Vite](https://img.shields.io/badge/Vite-6.x-646cff?logo=vite)

---

## 核心特性

- **Markdown 实时编辑** -- 左侧编辑，右侧实时预览渲染
- **代码语法高亮** -- Highlight.js，支持 50+ 语言
- **Mermaid 图表** -- 流程图、序列图、甘特图等
- **导出 PPTX** -- 一键导出为 PowerPoint 文件
- **5 种布局模板** -- title / content / two-column / code / blank
- **MCP 集成** -- AI 通过 MCP 协议直接操作 PPT，实时同步
- **PowerPoint 插件** -- 作为 Office Add-in 嵌入 PowerPoint 任务窗格
- **数据持久化** -- localStorage 自动保存，刷新不丢失

---

## 架构概览

```
模式一：独立 Web 应用 + MCP AI 辅助
  AI Client <--MCP SSE--> Vite Server <--WebSocket--> Vue3 前端

模式二：PowerPoint 插件 (Office Add-in)
  PowerPoint 任务窗格 (iframe) --> https://localhost:8989 --> Vue3 前端 + MCP
```

---

## 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9
- **PowerPoint** (仅作为插件使用时需要)

### 1. 安装依赖

```bash
git clone <仓库地址>
cd ppt-kit
npm install
```

### 2. 启动项目

**普通 Web 模式**（浏览器直接访问）：

```bash
npm run dev
```

**PowerPoint 插件模式**（需要 HTTPS）：

```bash
# 首次使用需要安装自签证书
npm run certs:install

# 以 HTTPS 模式启动
npm run dev:https
```

### 3. 配置 MCP（可选）

如果你想让 AI（CodeBuddy / Claude / Trae 等）帮你操作 PPT，需要配置 MCP 连接。

**CodeBuddy** 编辑 `~/.codebuddy/mcp.json`：

```json
{
  "mcpServers": {
    "ppt-kit": {
      "type": "sse",
      "url": "http://localhost:8989/mcp/sse",
      "description": "PPT Kit - AI 智能演示文稿工具"
    }
  }
}
```

**Trae** 编辑项目根目录 `.trae/mcp.json`：

```json
{
  "mcpServers": {
    "ppt-kit": {
      "url": "http://localhost:8989/mcp/sse"
    }
  }
}
```

> 注意：Trae 不需要 `"type": "sse"` 字段，有 `url` 即可自动识别。

配置完成后重启 IDE，就可以在聊天中直接让 AI 操作 PPT 了。

---

## 作为 PowerPoint 插件使用

### 步骤概览

| 步骤 | 操作 |
|------|------|
| 1 | `npm install` 安装依赖 |
| 2 | `npm run certs:install` 安装 HTTPS 开发证书 |
| 3 | `npm run dev:https` 以 HTTPS 模式启动 |
| 4 | 打开 PowerPoint → 插入 → 加载项 → 上传 `manifest.xml` |
| 5 | 点击功能区中的 "PPT Kit" 按钮 |

### 详细步骤

#### 1. 安装证书

Office Add-in 要求 HTTPS，需要安装自签证书：

```bash
npm run certs:install
```

> 证书安装到系统信任存储，浏览器首次访问 `https://localhost:8989` 时点击"继续访问"即可。

#### 2. 启动 HTTPS 服务

```bash
npm run dev:https
```

#### 3. 在 PowerPoint 中加载插件

1. 打开 **PowerPoint**（桌面版，需要 Microsoft 365）
2. 点击 **插入** → **我的加载项** → **上传我的加载项**
3. 选择项目根目录下的 `manifest.xml` 文件
4. 加载成功后，功能区会出现 **"PPT Kit"** 按钮
5. 点击按钮，右侧任务窗格会打开 PPT Kit 编辑器

#### 4. 同步到 PowerPoint

在 PPT Kit 编辑器中编辑好幻灯片后，点击顶部的 **"同步到 PPT"** 按钮，内容会写入当前 PowerPoint 演示文稿。

### 证书管理

```bash
npm run certs:install    # 安装证书
npm run certs:uninstall  # 卸载证书
npm run certs:verify     # 验证证书是否已安装
```

---

## MCP 工具列表

| 工具名 | 功能 | 关键参数 |
|--------|------|----------|
| `ppt_get_info` | 获取演示文稿信息 | -- |
| `ppt_list_slides` | 列出所有幻灯片 | `limit`, `offset` |
| `ppt_create_slide` | 创建新幻灯片 | `title` (必填), `layout` |
| `ppt_delete_slide` | 删除指定幻灯片 | `slide_id` (必填) |
| `ppt_update_slide` | 更新幻灯片内容 | `slide_id`, `markdown` |
| `ppt_add_content` | 添加文本/代码/图片/Mermaid | `slide_id`, `content`, `content_type` |
| `ppt_add_code_block` | 添加代码块 | `slide_id`, `code`, `language` |
| `ppt_add_mermaid` | 添加 Mermaid 图表 | `slide_id`, `mermaid_code` |
| `ppt_from_markdown` | 从 Markdown 批量生成幻灯片 | `markdown` (必填) |
| `ppt_export_pptx` | 导出为 PPTX 文件 | `filename` |

---

## 项目结构

```
ppt-kit/
├── manifest.xml            # Office Add-in 描述文件
├── index.html              # Vite 入口 HTML（含 office.js）
├── vite.config.ts          # Vite 配置（HTTPS + MCP 插件）
├── package.json            # 项目依赖
├── scripts/
│   └── certs.mjs           # HTTPS 证书管理脚本
├── public/
│   ├── icons/              # Office Add-in 图标
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── App.vue             # 主应用组件
    ├── main.ts             # 入口文件（Office 环境检测）
    ├── bridge-client.ts    # WebSocket Bridge 客户端
    ├── vite-plugin-mcp.ts  # Vite 插件 - MCP Server 集成
    ├── components/
    │   ├── HeaderBar.vue       # 顶部工具栏（含同步到 PPT 按钮）
    │   ├── SlidePanel.vue      # 左侧幻灯片列表
    │   ├── MarkdownEditor.vue  # Markdown 编辑器
    │   └── SlidePreview.vue    # 实时预览
    ├── mcp-server/
    │   ├── server.ts           # MCP Server + 工具注册
    │   ├── schemas.ts          # Zod 输入验证
    │   ├── types.ts            # 类型定义
    │   ├── bridge.ts           # Bridge 模式
    │   └── stdio.ts            # Stdio 模式
    ├── modules/
    │   ├── export.ts           # PPTX 导出
    │   ├── markdown.ts         # Markdown 解析 + 高亮
    │   ├── mermaid.ts          # Mermaid 图表渲染
    │   └── powerpoint-api.ts   # PowerPoint API 桥接
    ├── store/
    │   └── index.ts            # 响应式状态管理 + localStorage
    └── styles/
        └── main.css            # 全局样式（暗色主题）
```

---

## 技术栈

| 技术 | 用途 |
|------|------|
| [Vue 3](https://vuejs.org/) | 前端框架（Composition API） |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Vite](https://vitejs.dev/) | 构建工具 + 开发服务器 |
| [Office.js](https://learn.microsoft.com/office/dev/add-ins/) | PowerPoint 插件 API |
| [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) | MCP 协议 |
| [Marked](https://marked.js.org/) | Markdown 解析 |
| [Highlight.js](https://highlightjs.org/) | 代码高亮 |
| [Mermaid](https://mermaid.js.org/) | 图表渲染 |
| [PptxGenJS](https://gitbrent.github.io/PptxGenJS/) | PPTX 导出 |

---

## 常见问题

### AI 调用 MCP 返回 mock 数据？

浏览器页面没有打开，或 WebSocket 断开了。确保浏览器已打开前端页面，访问 `/mcp/health` 确认 `browserConnected: true`。

### PowerPoint 中加载插件后显示空白？

确保以 HTTPS 模式启动（`npm run dev:https`），并且浏览器已信任自签证书。首次访问时点击"继续访问不安全的网站"。

### 如何恢复默认幻灯片？

浏览器控制台执行：

```javascript
localStorage.removeItem('ppt-kit-slides')
localStorage.removeItem('ppt-kit-current-index')
location.reload()
```

### 支持哪些 IDE 连接 MCP？

支持所有实现 MCP SSE 协议的客户端，包括：
- **CodeBuddy** -- 配置 `~/.codebuddy/mcp.json`
- **Trae** -- 配置 `.trae/mcp.json`
- **Claude Desktop** -- 配置 `claude_desktop_config.json`

---

## License

MIT
