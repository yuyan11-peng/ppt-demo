<template>
  <div class="optimize-content">
    <!-- 顶部导航 -->
    <div class="nav-header">
      <el-button :icon="ArrowLeft" text @click="$emit('back')">返回</el-button>
      <span class="nav-title">内容优化</span>
    </div>

    <!-- 表单区域 -->
    <div class="form-content">
      <!-- 优化类型 -->
      <div class="form-section">
        <div class="section-header">
          <el-icon :size="16" color="#409eff"><EditPen /></el-icon>
          <span class="section-title">优化类型</span>
        </div>
        <el-select v-model="optimizeType" placeholder="请选择优化类型" style="width: 100%;">
          <el-option label="重写" value="rewrite" />
          <el-option label="润色" value="polish" />
          <el-option label="扩写" value="expand" />
          <el-option label="精简" value="simplify" />
          <el-option label="正式化" value="formal" />
          <el-option label="创意化" value="creative" />
        </el-select>
      </div>

      <!-- 输入文本 -->
      <div class="form-section">
        <label class="input-label">输入要优化的文本</label>
        <el-input
          v-model="inputText"
          type="textarea"
          placeholder="这是我的标题xxx"
          :rows="5"
          resize="vertical"
        />
      </div>

      <!-- 开始优化按钮 -->
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!inputText.trim()"
        @click="handleOptimize"
        style="width: 100%; margin-bottom: 20px;"
      >
        {{ loading ? '优化中...' : '开始优化' }}
      </el-button>

      <!-- 优化结果 -->
      <el-card v-if="result" shadow="never" class="result-card">
        <template #header>
          <div class="result-header">
            <span class="result-title">优化结果</span>
            <el-tooltip :content="copied ? '已复制' : '复制'" placement="top">
              <el-button
                :icon="copied ? Check : CopyDocument"
                text
                size="small"
                @click="handleCopy"
              />
            </el-tooltip>
          </div>
        </template>
        <div class="result-content">{{ result }}</div>
        <el-button
          :loading="replacing"
          :disabled="replacing"
          @click="handleReplace"
          style="width: 100%; margin-top: 12px;"
        >
          {{ replacing ? '替换中...' : '应用到 PPT' }}
        </el-button>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, EditPen, Check, CopyDocument } from '@element-plus/icons-vue'

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

  // 模拟 AI 优化延迟
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

.form-section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.input-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

/* 结果卡片 */
.result-card {
  border-radius: 10px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.result-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  min-height: 60px;
}
</style>
