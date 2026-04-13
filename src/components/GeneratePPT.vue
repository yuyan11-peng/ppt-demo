<template>
  <div class="generate-ppt">
    <!-- 顶部导航 -->
    <div class="nav-header">
      <button class="back-btn" @click="$emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        返回
      </button>
      <span class="nav-title">一键生成PPT</span>
    </div>

    <!-- 步骤标题 -->
    <div class="step-header">
      <span class="step-badge">1</span>
      <span class="step-title">输入主题</span>
    </div>

    <!-- 表单内容 -->
    <div class="form-content">
      <!-- 创作类型 -->
      <div class="form-group">
        <label class="form-label">创作类型</label>
        <div class="type-cards">
          <div
            class="type-card"
            :class="{ active: createType === 'scratch' }"
            @click="createType = 'scratch'"
          >
            <div class="type-card-inner">
              <div class="type-card-text">
                <div class="type-card-title">从零开始</div>
                <div class="type-card-desc">创建全新PPT</div>
              </div>
              <div class="type-card-radio">
                <div class="radio-outer" :class="{ checked: createType === 'scratch' }">
                  <div class="radio-inner" v-if="createType === 'scratch'"></div>
                </div>
              </div>
            </div>
          </div>
          <div
            class="type-card"
            :class="{ active: createType === 'continue' }"
            @click="createType = 'continue'"
          >
            <div class="type-card-inner">
              <div class="type-card-text">
                <div class="type-card-title">继续创作</div>
                <div class="type-card-desc">基于现有PPT扩展</div>
              </div>
              <div class="type-card-radio">
                <div class="radio-outer" :class="{ checked: createType === 'continue' }">
                  <div class="radio-inner" v-if="createType === 'continue'"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主题/提示词 -->
      <div class="form-group">
        <label class="form-label">
          主题/提示词
          <span v-if="createType === 'scratch'" class="required-mark">*</span>
        </label>
        <div class="prompt-wrapper">
          <textarea
            v-model="prompt"
            class="prompt-input"
            :placeholder="'请输入您想要制作的PPT主题，例如：产品发布会、季度总结报告等'"
            maxlength="500"
            rows="4"
          ></textarea>
          <button class="upload-btn" @click="handleUploadImage" title="上传图片">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <!-- 已上传图片预览 -->
        <div v-if="uploadedImages.length > 0" class="uploaded-images">
          <div v-for="(img, index) in uploadedImages" :key="index" class="uploaded-image-item">
            <img :src="img" alt="uploaded" />
            <button class="remove-image-btn" @click="removeImage(index)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div class="prompt-counter">{{ prompt.length }}/500</div>
      </div>

      <!-- 页数 -->
      <div class="form-group">
        <label class="form-label">页数（可选）</label>
        <input
          v-model="pageCount"
          type="text"
          class="form-input"
          placeholder="不填写将自动生成合适的页数"
          @input="handlePageCountInput"
        />
      </div>

      <!-- 语言 -->
      <div class="form-group">
        <label class="form-label">语言</label>
        <div class="select-wrapper">
          <select v-model="language" class="form-select">
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
          <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      <!-- 模型选择 -->
      <div class="form-group">
        <label class="form-label">模型选择</label>
        <div class="select-wrapper">
          <select v-model="model" class="form-select">
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5">GPT-3.5</option>
            <option value="claude">Claude</option>
            <option value="deepseek">DeepSeek</option>
          </select>
          <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 生成大纲按钮 -->
    <div class="action-bar">
      <button
        class="generate-btn"
        :disabled="loading || (createType === 'scratch' && !prompt.trim())"
        @click="handleGenerate"
      >
        <span v-if="loading" class="loading-spinner"></span>
        {{ loading ? '正在生成...' : '生成大纲' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  back: []
  generate: [data: {
    createType: string
    prompt: string
    pageCount: string
    language: string
    model: string
    images: string[]
  }]
}>()

const loading = ref(false)

const createType = ref<'scratch' | 'continue'>('scratch')
const prompt = ref('')
const pageCount = ref('')
const language = ref('zh')
const model = ref('gpt-4')
const uploadedImages = ref<string[]>([])

function handlePageCountInput(e: Event) {
  const target = e.target as HTMLInputElement
  // 只允许输入数字
  target.value = target.value.replace(/[^0-9]/g, '')
  pageCount.value = target.value
}

function handleUploadImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = (e: Event) => {
    const files = (e.target as HTMLInputElement).files
    if (!files) return
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          uploadedImages.value.push(ev.target.result as string)
        }
      }
      reader.readAsDataURL(files[i])
    }
  }
  input.click()
}

function removeImage(index: number) {
  uploadedImages.value.splice(index, 1)
}

function handleGenerate() {
  if (createType.value === 'scratch' && !prompt.value.trim()) return
  loading.value = true
  emit('generate', {
    createType: createType.value,
    prompt: prompt.value,
    pageCount: pageCount.value,
    language: language.value,
    model: model.value,
    images: [...uploadedImages.value]
  })
}

defineExpose({
  setLoading(val: boolean) { loading.value = val }
})
</script>

<style scoped>
.generate-ppt {
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
  color: #666;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  font-family: inherit;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #1890ff;
}

.back-btn svg {
  flex-shrink: 0;
}

.nav-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* 步骤标题 */
.step-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 8px;
  flex-shrink: 0;
}

.step-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1890ff;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-title {
  font-size: 17px;
  font-weight: 600;
  color: #222;
}

/* 表单内容 */
.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.required-mark {
  color: #ff4d4f;
  margin-left: 2px;
}

/* 创作类型卡片 */
.type-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.type-card {
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  padding: 14px 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.type-card:hover {
  border-color: #b3d8ff;
}

.type-card.active {
  border-color: #1890ff;
  background: #f0f7ff;
}

.type-card-inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.type-card-text {
  flex: 1;
}

.type-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #222;
  margin-bottom: 4px;
}

.type-card-desc {
  font-size: 12px;
  color: #999;
}

.type-card-radio {
  flex-shrink: 0;
  margin-left: 8px;
  margin-top: 2px;
}

.radio-outer {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.radio-outer.checked {
  border-color: #1890ff;
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1890ff;
}

/* 提示词输入 */
.prompt-wrapper {
  position: relative;
  display: flex;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  transition: border-color 0.2s;
  overflow: hidden;
}

.prompt-wrapper:focus-within {
  border-color: #1890ff;
}

.prompt-input {
  flex: 1;
  padding: 12px;
  border: none;
  outline: none;
  font-size: 14px;
  color: #333;
  resize: none;
  font-family: inherit;
  line-height: 1.5;
  background: transparent;
}

.prompt-input::placeholder {
  color: #bbb;
}

.upload-btn {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12px 10px 12px 0;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
  flex-shrink: 0;
}

.upload-btn:hover {
  color: #1890ff;
}

/* 上传图片预览 */
.uploaded-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.uploaded-image-item {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}

.uploaded-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.prompt-counter {
  text-align: right;
  font-size: 12px;
  color: #bbb;
  margin-top: 4px;
}

/* 通用输入框 */
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  color: #333;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  background: #fff;
}

.form-input::placeholder {
  color: #bbb;
}

.form-input:focus {
  border-color: #1890ff;
}

/* 下拉选择 */
.select-wrapper {
  position: relative;
}

.form-select {
  width: 100%;
  padding: 10px 36px 10px 12px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
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

/* 底部按钮 */
.action-bar {
  padding: 12px 16px 20px;
  flex-shrink: 0;
}

.generate-btn {
  width: 100%;
  padding: 14px 0;
  border: none;
  border-radius: 10px;
  background: #1890ff;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.generate-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.generate-btn:active:not(:disabled) {
  background: #096dd9;
}

.generate-btn:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

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
</style>
