<template>
  <div class="optimize-content">
    <!-- 顶部导航 -->
    <div class="nav-header">
      <button class="back-btn" @click="$emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        返回
      </button>
      <span class="nav-title">内容优化</span>
    </div>

    <!-- 表单区域 -->
    <div class="form-content">
      <!-- 优化类型 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-icon">📝</span>
          <span class="section-title">优化类型</span>
        </div>
        <div class="select-wrapper">
          <select v-model="optimizeType" class="form-select">
            <option value="rewrite">重写</option>
            <option value="polish">润色</option>
            <option value="expand">扩写</option>
            <option value="simplify">精简</option>
            <option value="formal">正式化</option>
            <option value="creative">创意化</option>
          </select>
          <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      <!-- 输入文本 -->
      <div class="form-section">
        <label class="input-label">输入要优化的文本</label>
        <textarea
          v-model="inputText"
          class="text-input"
          placeholder="这是我的标题xxx"
          rows="5"
        ></textarea>
      </div>

      <!-- 开始优化按钮 -->
      <button
        class="optimize-btn"
        :disabled="!inputText.trim() || loading"
        @click="handleOptimize"
      >
        <span v-if="loading" class="loading-spinner"></span>
        {{ loading ? '优化中...' : '开始优化' }}
      </button>

      <!-- 优化结果 -->
      <div v-if="result" class="result-section">
        <div class="result-header">
          <span class="result-title">优化结果</span>
          <button class="copy-btn" @click="handleCopy" :title="copied ? '已复制' : '复制'">
            <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </button>
        </div>
        <div class="result-content">{{ result }}</div>
        <button
          class="replace-btn"
          @click="handleReplace"
          :disabled="replacing"
        >
          {{ replacing ? '替换中...' : '替换' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  back: []
  replace: [data: { original: string; optimized: string }]
}>()

const optimizeType = ref('rewrite')
const inputText = ref('')
const loading = ref(false)
const result = ref('')
const copied = ref(false)
const replacing = ref(false)

const optimizeTypeLabels: Record<string, string> = {
  rewrite: '重写',
  polish: '润色',
  expand: '扩写',
  simplify: '精简',
  formal: '正式化',
  creative: '创意化',
}

function simulateOptimize(text: string, type: string): string {
  const suffix = `（${optimizeTypeLabels[type] || '优化'}版）`
  switch (type) {
    case 'rewrite':
      return text + suffix
    case 'polish':
      return text + '——经过精心润色，更加流畅自然'
    case 'expand':
      return text + '。在此基础上，我们进一步深入分析了相关背景和影响因素，提出了更加全面的解决方案，以期达到最佳效果。'
    case 'simplify':
      return text.slice(0, Math.max(text.length / 2, 5)) + '（精简版）'
    case 'formal':
      return '尊敬的各位：' + text + '。以上内容仅供参考。'
    case 'creative':
      return '✨ ' + text + ' — 让创意无限延伸！'
    default:
      return text + suffix
  }
}

async function handleOptimize() {
  if (!inputText.value.trim()) return
  loading.value = true
  result.value = ''
  copied.value = false

  // 模拟 AI 优化延迟（后续接入 AI API）
  await new Promise(resolve => setTimeout(resolve, 1000))

  result.value = simulateOptimize(inputText.value, optimizeType.value)
  loading.value = false
}

function handleCopy() {
  if (!result.value) return
  navigator.clipboard.writeText(result.value).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }).catch(() => {
    // fallback
    const textarea = document.createElement('textarea')
    textarea.value = result.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}

function handleReplace() {
  if (!result.value) return
  replacing.value = true
  emit('replace', { original: inputText.value, optimized: result.value })
}

defineExpose({
  setReplacing(val: boolean) { replacing.value = val }
})
</script>

<style scoped>
.optimize-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ffffff;
  font-family: 'Segoe UI', 'Microsoft YaHei', -apple-system, sans-serif;
}

/* 顶部导航 */
.nav-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  color: #1890ff;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  font-family: inherit;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #40a9ff;
}

.nav-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* 表单内容 */
.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 表单分区 */
.form-section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.section-icon {
  font-size: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 下拉选择 */
.select-wrapper {
  position: relative;
}

.form-select {
  width: 100%;
  padding: 10px 36px 10px 12px;
  border: 1.5px solid #e8e8e8;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-select:focus {
  border-color: #1890ff;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

/* 输入标签 */
.input-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

/* 文本输入 */
.text-input {
  width: 100%;
  padding: 12px;
  border: 1.5px solid #e8e8e8;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  resize: vertical;
  outline: none;
  font-family: inherit;
  line-height: 1.5;
  transition: border-color 0.2s;
  min-height: 100px;
}

.text-input::placeholder {
  color: #bbb;
}

.text-input:focus {
  border-color: #1890ff;
}

/* 优化按钮 */
.optimize-btn {
  width: 100%;
  padding: 12px 0;
  border: none;
  border-radius: 8px;
  background: #1890ff;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.optimize-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.optimize-btn:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

/* Loading spinner */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 优化结果 */
.result-section {
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fff;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.result-content {
  padding: 14px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  min-height: 60px;
  background: #fff;
}

.replace-btn {
  display: block;
  width: calc(100% - 28px);
  margin: 0 14px 14px;
  padding: 10px 0;
  border: 1.5px solid #e8e8e8;
  border-radius: 8px;
  background: #fafafa;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.replace-btn:hover:not(:disabled) {
  background: #f0f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.replace-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
