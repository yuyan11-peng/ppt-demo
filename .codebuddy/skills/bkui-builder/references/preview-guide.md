# 预览 HTML 转换指南

## 概述

AI 生成 `.vue` SFC 代码后，同时生成一个独立 HTML 预览文件，PM/设计师双击即可在浏览器中查看效果。

- **预览模版**: `./assets/preview-template.html`
- **完整示例**: `./assets/examples/table-page-preview.html`
- **输出位置**: 用户项目根目录 `demos/`
- **命名规范**: `kebab-case-preview.html`（如 `app-management-preview.html`）

## SFC → 预览代码转换规则

### Import 处理

| SFC 写法 | 预览写法 | 说明 |
|----------|---------|------|
| `import { ref, reactive } from 'vue'` | 删除 | 已在模版顶部从全局 `Vue` 解构 |
| `import { Message, InfoBox } from 'bkui-vue'` | `const { Message, InfoBox } = bkuiVue` | 从 UMD 全局变量取 |
| `import { Search } from 'bkui-vue/lib/icon'` | 见下方 Icon 处理 | icon 子模块（UMD 不可用） |

**重要**: 必须在加载 bkui-vue 之前定义 `process` polyfill，否则 UMD 构建会报错：
```html
<script>window.process = { env: { NODE_ENV: 'production' } };</script>
```

### Icon 处理（UMD 环境）

> ⚠️ `bkui-vue` UMD 构建**不包含**独立 icon 组件。`bkuiVue.Plus`、`bkuiVue.Icon` 等均为 `undefined`。icon 仅以 ESM 模块存在于 `lib/icon/` 目录。

**方案一（推荐）：importmap + ESM 动态导入**

通过 `<script type="importmap">` 让 icon ESM 模块能解析 `vue` 依赖，再用 `<script type="module">` 动态导入 icon 组件：

```html
<head>
  <script type="importmap">
  {
    "imports": {
      "vue": "https://cdn.jsdelivr.net/npm/vue@3.4/dist/vue.esm-browser.prod.js"
    }
  }
  </script>
</head>
```

```html
<!-- 常规 script 中创建 app 后，将 app 暴露给 module script -->
<script>
    // ... createApp、app.use(bkuiVue.default || bkuiVue) ...
    window.__bkApp = app;
</script>
<script type="module">
    const app = window.__bkApp;
    const { default: Plus } = await import('https://cdn.jsdelivr.net/npm/bkui-vue@2.0.2-beta.112/lib/icon/plus.js');
    app.component('plus-icon', Plus);
    app.mount('#app');
    delete window.__bkApp;
</script>
```

> 注意：importmap 必须在所有 `<script type="module">` 之前声明；`app.mount()` 移至 module script 中以确保 icon 注册完成。可用路径 `lib/icon/<name>.js`（kebab-case）导入任意图标。

**方案二：搜索图标** — 直接用 `bk-input` 的 `type="search"` 属性，组件内置搜索图标：
```html
<bk-input v-model="searchKey" type="search" placeholder="搜索..." />
```

**方案三：inline SVG 兜底** — 不依赖 ESM，用 `app.component()` + `h()` 渲染 inline SVG：
```javascript
app.component('plus-icon', {
  render() {
    return h('span', { style: 'display:inline-flex;align-items:center;justify-content:center;margin-right:6px' }, [
      h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 1024 1024', width: '1em', height: '1em', fill: 'currentColor' }, [
        h('path', { d: 'M544 160a32 32 0 0 0-64 0v320H160a32 32 0 0 0 0 64h320v320a32 32 0 0 0 64 0V544h320a32 32 0 0 0 0-64H544V160z' })
      ])
    ]);
  }
});
```

常用 icon SVG path（viewBox: `0 0 1024 1024`）：
| Icon | path `d` |
|------|----------|
| Plus | `M544 160a32 32 0 0 0-64 0v320H160a32 32 0 0 0 0 64h320v320a32 32 0 0 0 64 0V544h320a32 32 0 0 0 0-64H544V160z` |
| Close | `M563.8 512l262.5-262.5c14.3-14.3 14.3-37.5 0-51.7-14.3-14.3-37.5-14.3-51.7 0L512 460.2 249.5 197.8c-14.3-14.3-37.5-14.3-51.7 0-14.3 14.3-14.3 37.5 0 51.7L460.2 512 197.8 774.5c-14.3 14.3-14.3 37.5 0 51.7 14.3 14.3 37.5 14.3 51.7 0L512 563.8l262.5 262.5c14.3 14.3 37.5 14.3 51.7 0 14.3-14.3 14.3-37.5 0-51.7L563.8 512z` |
| Edit | `M884.4 78.7c-14-14-32.6-21.7-52.4-21.7s-38.4 7.7-52.4 21.7l-58 58L832 247l58-58c28.9-28.9 28.9-75.9-0.1-104.8l-5.5-5.5zM168.6 716.7l-50 196.4 196.4-50 491.2-491.2L696 261.5 168.6 716.7z` |

注册位置必须在 `app.use(bkuiVue)` 之后、`app.mount('#app')` 之前。

### TypeScript 剥离

| SFC 写法 | 预览写法 |
|----------|---------|
| `interface Xxx { ... }` | 删除 |
| `type Xxx = ...` | 删除 |
| `import type { ... }` | 删除 |
| `ref<Type[]>([])` | `ref([])` |
| `(param: Type)` | `(param)` |
| `as string` / `as const` | 删除 |
| `enum Xxx { A, B }` | `const Xxx = { A: 'A', B: 'B' }` |

### setup() 改写

`<script setup>` 的内容放入 `setup()` 函数体，**末尾必须显式 return**：

```javascript
setup() {
  const searchKey = ref('');
  const tableData = ref([]);
  const pagination = reactive({ current: 1, count: 0, limit: 10 });
  const formRef = ref(null);          // 模版 ref 也要 return
  const filteredData = computed(() => { /* ... */ });
  const fetchData = async () => { /* ... */ };
  const handleSearch = () => { fetchData(); };

  onMounted(() => { fetchData(); });   // 顶层调用包裹在 onMounted

  return {
    searchKey, tableData, pagination, formRef,
    filteredData, fetchData, handleSearch
  };
}
```

需要 return 的内容：
- 所有 `ref()` / `reactive()` / `computed()`
- 所有模版 ref（如 `formRef`）
- 所有模版中引用的方法
- 所有模版中引用的导入组件（注意：icon 需通过 `app.component()` 全局注册，无需 return）

### 副作用处理

| SFC 写法 | 预览写法 |
|----------|---------|
| 顶层 `fetchData()` 调用 | `onMounted(() => { fetchData(); })` |
| `async` 函数 | 保持不变，加入 return |
| `Object.assign(formData, {...})` | 保持不变 |

### 样式处理

| SFC 写法 | 预览写法 |
|----------|---------|
| `<style scoped>` | 去掉 `scoped`，内联到 `{{CUSTOM_STYLES}}` |
| `:deep(.bk-xxx)` | `.bk-xxx` |
| `::v-deep(.bk-xxx)` | `.bk-xxx` |

## Mock 数据指引

所有 `TODO` / 空实现替换为可运行的 mock：

1. **模拟延迟**: `await new Promise(r => setTimeout(r, 500))` — 让 PM 看到 loading
2. **表格数据**: 至少 5-8 行，贴近真实场景的中文数据
3. **多种状态**: 包含不同状态值（如 running/stopped/error），让 Tag 颜色有变化
4. **弹窗流程**: 点击确认 → 校验 → 关闭弹窗 → 追加/更新数据 → 可选提示
5. **分页**: `pagination.count` 设为比当前页数据多的值，展示分页效果
6. **禁止占位数据**: 不要用 test1/test2，要用"蓝鲸监控"、"蓝鲸日志"等真实场景数据

## 输出规范

- 输出到用户项目根目录 `demos/` 目录
- 文件名用英文 kebab-case + `-preview.html`
- 同名文件直接覆盖（迭代更新同一文件）
- 首次生成时提醒用户将 `demos/` 加入 `.gitignore`
- 告知用户文件路径，提示在浏览器中打开

## 表格操作列

`bk-table` 的自定义列内容推荐使用 `columns` 定义中的 `render` 函数（模板 slot 在某些场景下不生效）：

```javascript
const columns = [
  { label: '名称', field: 'name' },
  {
    label: '操作',
    field: 'operation',
    width: 120,
    render: ({ row }) => {
      const BkButton = resolveComponent('bk-button');
      return h('span', [
        h(BkButton, { text: true, theme: 'primary', onClick: () => handleEdit(row) }, () => '编辑'),
        h(BkButton, { text: true, theme: 'danger', style: 'margin-left:8px', onClick: () => handleDelete(row) }, () => '删除'),
      ]);
    },
  },
];
```

> 使用 `render` 时需要在 Vue 解构中加入 `h` 和 `resolveComponent`。

## 不支持的场景

- `defineProps` / `defineEmits`（预览是单页面，不涉及组件通信）
- `vue-router`（无路由跳转，Tab 切换等页面内导航可用）
- 真实 API 调用（全部用 mock）
- TypeScript 运行时（全部转为纯 JS）
