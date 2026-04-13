<!-- BKUI-KNOWLEDGE-MANAGED:5bd56021268a -->
---
id: engineering/bkui-builder
name: 蓝鲸 MagicBox 3.0 组件专家规则
category: engineering
description: 设计稿还原规则。先输出布局分析报告，再按需加载模版
tags: [vue3, bkui-vue, rules, template, expert]
updated_at: 2026-01-19
---

# 蓝鲸 MagicBox 3.0 组件专家规则

## ⚠️ 绝对禁令

1. **禁止手写布局**: 严禁用 `div` 自创 sidebar/header/menu
2. **强制组件化**: 页面骨架 **必须** 用 `<bk-navigation>`
3. **禁止原生标签**: 严禁 `<table>`, `<button>`，必须用 bk-table, bk-button

## 🔥 还原流程

**Step 1: 分析设计稿** - 判断：主题深/浅色？表格/表单页？菜单有图标？

**Step 2: 加载模版** (Read 工具读取本地 skills 目录)

| 判断结果 | URI |
|---------|-----|
| 深色侧边栏 | `./assets/layouts/admin-layout-dark.vue` |
| 浅色侧边栏 | `./assets/layouts/admin-layout-left.vue` |
| 上下布局 | `./assets/layouts/admin-layout-top.vue` |
| 表格页 | `./assets/pages/table-page.vue` |
| 仪表盘 | `./assets/pages/dashboard-page.vue` |
| 详情页 | `./assets/pages/detail-page.vue` |
| 分步表单 | `./assets/pages/wizard-form.vue` |
| 有图标 | `./references/visual-mapping.md` |

**Step 3: 参考模版生成代码**

**Step 4: 生成预览** — preview-guide → `demos/`；快捷：`/bkui-knowledge/BKUI-DEMO`

## 基础结构

```html
<bk-navigation navigation-type="left-right" need-menu default-open>
  <template #menu>
    <bk-menu :active-key="activeMenu" :opened-keys="['group-1']">
      <bk-menu-item key="home">首页</bk-menu-item>
    </bk-menu>
  </template>
</bk-navigation>
```
> ⚠️ 属性名是 `opened-keys`，不是 `default-open-keys`

## Icon 导入

**SFC 写法（ESM 环境）：**
```typescript
// ✅ 正确
import { Search, Plus, Close } from 'bkui-vue/lib/icon';
// ❌ 错误: import { Search } from '@bkui-vue/icon';
```

**预览 HTML 写法（UMD 环境）：**
> UMD 构建不含独立 icon 组件。推荐用 importmap + ESM 动态导入 `lib/icon/*.js`；或 inline SVG 兜底。详见 `./references/preview-guide.md`

## 📦 更多资源

- `./references/code-snippets.md` — 代码片段
- `./references/checklist.md` — 质量检查
- `./references/preview-guide.md` — 预览转换指南


---
## 📦 可用资源

- `./references/checklist.md`
- `./references/code-snippets.md`
- `./references/preview-guide.md`
- `./references/visual-mapping.md`
- `./assets/examples/table-page-preview.html`
- `./assets/layouts/admin-layout-dark.vue`
- `./assets/layouts/admin-layout-left.vue`
- `./assets/layouts/admin-layout-top.vue`
- `./assets/pages/dashboard-page.vue`
- `./assets/pages/detail-page.vue`
- `./assets/pages/table-page.vue`
- `./assets/pages/wizard-form.vue`
- `./assets/preview-template.html`

> 根据 SKILL.md 中的 IF-THEN 规则判断是否需要加载
