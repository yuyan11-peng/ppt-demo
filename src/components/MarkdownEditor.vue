<template>
  <div class="editor-panel">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <span class="toolbar-label">Markdown 编辑器</span>
      </div>
      <div class="toolbar-right">
        <select class="layout-select" :value="layout" @change="$emit('update:layout', ($event.target as HTMLSelectElement).value)">
          <option value="title">标题页</option>
          <option value="content">内容页</option>
          <option value="two-column">两栏布局</option>
          <option value="code">代码页</option>
          <option value="blank">空白页</option>
        </select>
      </div>
    </div>
    <div class="editor-area">
      <div class="line-numbers">
        <div v-for="n in lineCount" :key="n" class="line-num">{{ n }}</div>
      </div>
      <textarea
        ref="textareaRef"
        class="editor-textarea"
        :value="markdown"
        @input="onInput"
        @keydown="onKeydown"
        @scroll="syncScroll"
        spellcheck="false"
        placeholder="输入 Markdown 内容..."
      ></textarea>
    </div>
    <div class="editor-footer">
      <span class="footer-stat">行 {{ currentLine }} · 列 {{ currentCol }}</span>
      <span class="footer-stat">{{ charCount }} 字符</span>
      <span class="footer-stat">Markdown</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps<{
  markdown: string
  layout: string
}>()

const emit = defineEmits<{
  'update:markdown': [value: string]
  'update:layout': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const currentLine = ref(1)
const currentCol = ref(1)

const lineCount = computed(() => {
  return Math.max(props.markdown.split('\n').length, 20)
})

const charCount = computed(() => props.markdown.length)

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:markdown', target.value)
  updateCursorPosition(target)
}

function updateCursorPosition(textarea: HTMLTextAreaElement) {
  const pos = textarea.selectionStart
  const text = textarea.value.substring(0, pos)
  const lines = text.split('\n')
  currentLine.value = lines.length
  currentCol.value = (lines[lines.length - 1]?.length || 0) + 1
}

function onKeydown(e: KeyboardEvent) {
  const textarea = e.target as HTMLTextAreaElement

  // Tab support
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value

    if (e.shiftKey) {
      // Shift+Tab: remove indent
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      if (value.substring(lineStart, lineStart + 2) === '  ') {
        const newValue = value.substring(0, lineStart) + value.substring(lineStart + 2)
        emit('update:markdown', newValue)
        nextTick(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 2
        })
      }
    } else {
      // Tab: insert indent
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      emit('update:markdown', newValue)
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }

  // Auto-close backticks
  if (e.key === '`' && !e.shiftKey) {
    const start = textarea.selectionStart
    const value = textarea.value
    const before = value.substring(Math.max(0, start - 2), start)
    if (before === '``') {
      e.preventDefault()
      const insert = '`\n\n```'
      const newValue = value.substring(0, start) + insert + value.substring(start)
      emit('update:markdown', newValue)
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }

  setTimeout(() => updateCursorPosition(textarea), 0)
}

function syncScroll(e: Event) {
  const textarea = e.target as HTMLTextAreaElement
  const lineNumbers = textarea.parentElement?.querySelector('.line-numbers') as HTMLElement
  if (lineNumbers) {
    lineNumbers.scrollTop = textarea.scrollTop
  }
}

watch(() => props.markdown, () => {
  if (textareaRef.value) {
    updateCursorPosition(textareaRef.value)
  }
})
</script>

<style scoped>
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  border-right: 1px solid var(--color-border);
}

.editor-toolbar {
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

.layout-select {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  outline: none;
}

.layout-select:focus {
  border-color: var(--color-primary);
}

.layout-select option {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.editor-area {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--color-bg);
}

.line-numbers {
  width: 48px;
  min-width: 48px;
  padding: 12px 0;
  overflow: hidden;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  user-select: none;
}

.line-num {
  height: 22px;
  line-height: 22px;
  font-size: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--color-text-dim);
  text-align: right;
  padding-right: 12px;
}

.editor-textarea {
  flex: 1;
  padding: 12px 16px;
  background: transparent;
  color: var(--color-text);
  border: none;
  outline: none;
  resize: none;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13.5px;
  line-height: 22px;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}

.editor-textarea::placeholder {
  color: var(--color-text-dim);
}

.editor-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 28px;
  padding: 0 14px;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
}

.footer-stat {
  font-size: 11px;
  color: var(--color-text-dim);
}
</style>
