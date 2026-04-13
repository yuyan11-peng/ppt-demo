<template>
  <div class="preview-panel">
    <div class="preview-toolbar">
      <span class="toolbar-label">实时预览</span>
      <div class="preview-mode-toggle">
        <button
          class="mode-btn"
          :class="{ active: mode === 'slide' }"
          @click="mode = 'slide'"
        >
          幻灯片
        </button>
        <button
          class="mode-btn"
          :class="{ active: mode === 'document' }"
          @click="mode = 'document'"
        >
          文档
        </button>
      </div>
    </div>
    <div class="preview-area" ref="previewAreaRef">
      <!-- Slide Mode -->
      <div v-if="mode === 'slide'" class="slide-view">
        <div class="slide-frame" :class="layout">
          <div class="slide-content markdown-preview" v-html="renderedHtml"></div>
        </div>
      </div>
      <!-- Document Mode -->
      <div v-else class="document-view">
        <div class="document-content markdown-preview" v-html="renderedHtml"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { parseMarkdown } from '../modules/markdown'
import { renderMermaid } from '../modules/mermaid'

const props = defineProps<{
  markdown: string
  layout: string
}>()

const mode = ref<'slide' | 'document'>('slide')
const previewAreaRef = ref<HTMLElement | null>(null)

const renderedHtml = computed(() => {
  return parseMarkdown(props.markdown)
})

async function doRenderMermaid() {
  await nextTick()
  if (previewAreaRef.value) {
    await renderMermaid(previewAreaRef.value)
  }
}

watch(renderedHtml, () => {
  doRenderMermaid()
})

watch(mode, () => {
  doRenderMermaid()
})

onMounted(() => {
  doRenderMermaid()
})
</script>

<style scoped>
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  overflow: hidden;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 14px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.toolbar-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-mode-toggle {
  display: flex;
  gap: 2px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.mode-btn {
  padding: 4px 12px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
}

.mode-btn.active {
  background: var(--color-primary);
  color: #fff;
}

.mode-btn:not(.active):hover {
  color: var(--color-text);
}

.preview-area {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background: var(--color-bg);
}

/* Slide Mode */
.slide-view {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.slide-frame {
  width: 100%;
  max-width: 720px;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  padding: 32px 40px;
  overflow: auto;
  position: relative;
}

.slide-frame::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.slide-frame.title {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.slide-frame.title .slide-content :deep(h1) {
  font-size: 2.2em;
  margin-bottom: 20px;
}

.slide-frame.code .slide-content :deep(pre) {
  font-size: 12px;
}

.slide-content {
  height: 100%;
}

/* Document Mode */
.document-view {
  max-width: 720px;
  margin: 0 auto;
}

.document-content {
  padding: 24px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}
</style>
