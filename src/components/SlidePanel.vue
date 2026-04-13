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
        <div class="slide-thumb">
          <div class="thumb-content">
            <div class="thumb-layout" :class="slide.layout">
              <div class="thumb-title-line"></div>
              <div class="thumb-body-lines">
                <div class="thumb-line" v-for="n in 3" :key="n"></div>
              </div>
            </div>
          </div>
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
</script>

<style scoped>
.slide-panel {
  width: 240px;
  min-width: 240px;
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
  padding: 8px;
}

.slide-item {
  display: grid;
  grid-template-columns: 24px 56px 1fr;
  grid-template-rows: auto auto;
  gap: 0 8px;
  padding: 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  margin-bottom: 4px;
  border: 1px solid transparent;
  position: relative;
}

.slide-item:hover {
  background: var(--color-bg-tertiary);
}

.slide-item.active {
  background: rgba(108, 122, 224, 0.1);
  border-color: rgba(108, 122, 224, 0.3);
}

.slide-number {
  grid-row: 1 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--color-text-dim);
  font-weight: 600;
}

.slide-thumb {
  grid-row: 1 / 3;
  width: 56px;
  height: 36px;
  border-radius: 4px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.thumb-content {
  padding: 4px;
  height: 100%;
}

.thumb-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.thumb-title-line {
  height: 4px;
  background: var(--color-primary);
  border-radius: 1px;
  width: 60%;
  opacity: 0.6;
}

.thumb-body-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.thumb-line {
  height: 2px;
  background: var(--color-border);
  border-radius: 1px;
}

.thumb-line:nth-child(1) { width: 90%; }
.thumb-line:nth-child(2) { width: 70%; }
.thumb-line:nth-child(3) { width: 50%; }

.thumb-layout.title .thumb-title-line {
  width: 80%;
  height: 6px;
  margin-top: 6px;
}

.thumb-layout.code .thumb-body-lines {
  background: rgba(26, 29, 46, 0.5);
  border-radius: 2px;
  padding: 2px;
}

.slide-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.slide-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slide-layout-tag {
  font-size: 10px;
  color: var(--color-text-dim);
  margin-top: 2px;
}

.slide-actions {
  grid-column: 3;
  display: none;
  gap: 2px;
  margin-top: 4px;
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
