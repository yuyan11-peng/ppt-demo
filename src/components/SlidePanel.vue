<template>
  <aside class="slide-panel">
    <div class="panel-header">
      <span class="panel-title">幻灯片</span>
      <button class="btn-add" @click="$emit('create')" title="新建幻灯片">
        <span>+</span>
      </button>
    </div>
    <div class="slide-list">
      <div
        v-for="(slide, index) in slides"
        :key="slide.id"
        class="slide-item"
        :class="{ active: index === currentIndex }"
        @click="$emit('select', index)"
      >
        <div class="slide-number">{{ index + 1 }}</div>
        <div class="slide-thumb" :class="slide.layout">
          <div class="thumb-bar"></div>
          <div class="thumb-render" v-html="getRenderedHtml(slide.markdown)"></div>
        </div>
        <div class="slide-info">
          <div class="slide-title">{{ slide.title || '无标题' }}</div>
          <div class="slide-layout-tag">{{ layoutLabels[slide.layout] }}</div>
        </div>
        <div class="slide-actions" @click.stop>
          <button class="action-btn" @click="$emit('move-up', index)" :disabled="index === 0" title="上移">↑</button>
          <button class="action-btn" @click="$emit('move-down', index)" :disabled="index === slides.length - 1" title="下移">↓</button>
          <button class="action-btn" @click="$emit('duplicate', index)" title="复制">⧉</button>
          <button class="action-btn danger" @click="$emit('delete', index)" :disabled="slides.length <= 1" title="删除">✕</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Slide } from '../store'
import { parseMarkdown } from '../modules/markdown'

defineProps<{
  slides: Slide[]
  currentIndex: number
}>()

defineEmits<{
  select: [index: number]
  create: []
  delete: [index: number]
  duplicate: [index: number]
  'move-up': [index: number]
  'move-down': [index: number]
}>()

const layoutLabels: Record<string, string> = {
  title: '标题页',
  content: '内容页',
  'two-column': '两栏',
  code: '代码页',
  blank: '空白页'
}

// 缓存渲染结果
const renderCache = new Map<string, string>()
function getRenderedHtml(markdown: string): string {
  if (renderCache.has(markdown)) {
    return renderCache.get(markdown)!
  }
  const html = parseMarkdown(markdown)
  renderCache.set(markdown, html)
  if (renderCache.size > 50) {
    const firstKey = renderCache.keys().next().value
    if (firstKey) renderCache.delete(firstKey)
  }
  return html
}
</script>

<style scoped>
.slide-panel {
  width: 260px;
  min-width: 260px;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
}

.btn-add {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  transition: var(--transition);
}

.btn-add:hover {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.slide-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 10px 6px;
}

.slide-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  margin-bottom: 6px;
  border: 2px solid transparent;
  position: relative;
}

.slide-item:hover {
  background: var(--color-bg-tertiary);
}

.slide-item.active {
  background: rgba(108, 122, 224, 0.08);
  border-color: rgba(108, 122, 224, 0.5);
}

.slide-number {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 4px;
  z-index: 2;
}

/* ===== 缩略图 ===== */
.slide-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #1a1c2e 0%, #22243a 100%);
  border: 1px solid var(--color-border);
  padding: 10px 12px;
}

.slide-thumb.title {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 顶部渐变条 */
.thumb-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
}

/* 内容渲染区 —— 不加 markdown-preview class，用独立样式 */
.thumb-render {
  height: 100%;
  overflow: hidden;
  line-height: 1.4;
  color: var(--color-text-secondary);
  font-size: 7px;
}

/* ===== 缩略图内 Markdown 元素样式（小尺寸直接渲染） ===== */
.thumb-render :deep(h1) {
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--color-text);
  line-height: 1.3;
  border: none;
  padding: 0;
}

.thumb-render :deep(h2) {
  font-size: 10px;
  font-weight: 600;
  margin: 0 0 3px 0;
  color: var(--color-text);
  line-height: 1.3;
  border: none;
  padding: 0;
}

.thumb-render :deep(h3) {
  font-size: 9px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: var(--color-text);
  line-height: 1.3;
}

.thumb-render :deep(p) {
  font-size: 7px;
  margin: 0 0 3px 0;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.thumb-render :deep(ul),
.thumb-render :deep(ol) {
  padding-left: 12px;
  margin: 0 0 3px 0;
  font-size: 7px;
  line-height: 1.4;
  color: var(--color-text-secondary);
}

.thumb-render :deep(li) {
  margin-bottom: 1px;
}

.thumb-render :deep(strong) {
  color: var(--color-text);
  font-weight: 600;
}

.thumb-render :deep(em) {
  color: var(--color-primary);
}

.thumb-render :deep(code) {
  font-size: 6px;
  padding: 1px 3px;
  background: rgba(108, 122, 224, 0.15);
  border-radius: 2px;
  color: var(--color-accent);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.thumb-render :deep(pre) {
  margin: 2px 0;
  padding: 4px;
  font-size: 5.5px;
  line-height: 1.3;
  border-radius: 3px;
  background: var(--color-code-bg);
  overflow: hidden;
}

.thumb-render :deep(pre code) {
  padding: 0;
  background: none;
  color: inherit;
  font-size: 5.5px;
}

.thumb-render :deep(blockquote) {
  margin: 2px 0;
  padding: 2px 6px;
  font-size: 6px;
  border-left: 2px solid var(--color-primary);
  background: rgba(108, 122, 224, 0.06);
  color: var(--color-text-dim);
}

.thumb-render :deep(table) {
  font-size: 6px;
  margin: 2px 0;
  border-collapse: collapse;
  width: 100%;
}

.thumb-render :deep(th),
.thumb-render :deep(td) {
  padding: 2px 4px;
  font-size: 6px;
  border: 1px solid var(--color-border);
}

.thumb-render :deep(th) {
  background: var(--color-bg-tertiary);
  font-weight: 600;
  color: var(--color-text);
}

/* title 布局特殊样式 */
.slide-thumb.title .thumb-render :deep(h1) {
  font-size: 16px;
  margin-bottom: 6px;
}

.slide-thumb.title .thumb-render :deep(h2) {
  font-size: 10px;
}

.slide-thumb.title .thumb-render :deep(p),
.slide-thumb.title .thumb-render :deep(ul),
.slide-thumb.title .thumb-render :deep(ol) {
  font-size: 8px;
}

/* 底部信息 */
.slide-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 2px 0;
  min-width: 0;
}

.slide-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.slide-layout-tag {
  font-size: 10px;
  color: var(--color-text-dim);
  margin-left: 8px;
  flex-shrink: 0;
}

.slide-actions {
  display: none;
  gap: 2px;
  padding: 4px 2px 0;
}

.slide-item:hover .slide-actions {
  display: flex;
}

.action-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}

.action-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: #fff;
}

.action-btn.danger:hover:not(:disabled) {
  background: var(--color-danger);
  color: #fff;
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
