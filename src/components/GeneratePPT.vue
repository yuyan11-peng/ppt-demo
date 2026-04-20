<template>
  <div class="generate-ppt">
    <!-- 顶部导航 -->
    <div class="nav-header">
      <button class="back-btn" @click="handleBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        返回
      </button>
      <span class="nav-title">一键生成PPT</span>
    </div>

    <!-- ========== 第一步：输入主题 ========== -->
    <template v-if="step === 1">
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
              placeholder="请输入您想要制作的PPT主题，例如：产品发布会、季度总结报告等"
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
    </template>

    <!-- ========== 第二步：编辑大纲 ========== -->
    <template v-if="step === 2">
      <!-- 步骤标题 -->
      <div class="step-header">
        <span class="step-badge">2</span>
        <span class="step-title">编辑大纲</span>
      </div>

      <!-- Tab 切换 + 内容区 -->
      <div class="step2-container">
        <!-- Tab 栏 -->
        <div class="tab-bar">
          <div
            class="tab-item"
            :class="{ active: subTab === 'outline' }"
            @click="subTab = 'outline'"
          >大纲结构</div>
          <div
            class="tab-item"
            :class="{ active: subTab === 'content' }"
            @click="subTab = 'content'"
          >页面内容</div>
        </div>

        <!-- Tab 内容：大纲结构 -->
        <div v-show="subTab === 'outline'" class="tab-panel outline-panel">
          <div class="outline-list">
            <div
              v-for="(item, index) in outlineList"
              :key="index"
              class="outline-item"
              :class="{ selected: selectedPage === index }"
              @click="handleOutlineClick(index)"
            >
              <span class="outline-index">{{ index + 1 }}</span>
              <span class="outline-text">{{ item.title || '第 ' + (index + 1) + ' 页' }}</span>
            </div>
          </div>
        </div>

        <!-- Tab 内容：页面内容 -->
        <div v-show="subTab === 'content'" class="tab-panel content-panel">
          <!-- 选择页面（下拉框） -->
          <div class="form-group">
            <label class="form-label">选择页面</label>
            <div class="select-wrapper">
              <select v-model="selectedPage" class="form-select">
                <option v-for="(item, idx) in outlineList" :key="idx" :value="idx">
                  第 {{ idx + 1 }} 页 - {{ item.title || '未命名' }}
                </option>
              </select>
              <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          <!-- 灰色包裹区域：页面标题 + 布局 + 内容 -->
          <div class="content-editor-card">
            <!-- 页面标题 -->
            <div class="form-group">
              <label class="form-label">页面标题</label>
              <input
                v-model="currentPageTitle"
                type="text"
                class="form-input"
                placeholder="请输入页面标题"
              />
            </div>

            <!-- 页面布局（三个布局选项） -->
            <div class="form-group">
              <label class="form-label">页面布局</label>
              <div class="layout-options">
                <div
                  v-for="(layout, lIdx) in layoutOptions"
                  :key="lIdx"
                  class="layout-option"
                  :class="{ active: currentLayout === lIdx }"
                  @click="currentLayout = lIdx"
                >
                  <div class="layout-icon" v-html="layout.icon"></div>
                  <span class="layout-label">{{ layout.label }}</span>
                </div>
              </div>
            </div>

            <!-- 页面内容（文本域 + AI生成按钮在label右侧） -->
            <div class="form-group form-group-content">
              <div class="content-label-row">
                <label class="form-label">页面内容</label>
                <button class="ai-generate-btn" @click="handleAiGenerate">AI生成内容</button>
              </div>
              <textarea
                v-model="currentPageContent"
                class="content-textarea"
                placeholder="请输入或通过AI生成页面内容..."
                rows="8"
              ></textarea>
            </div>

            <!-- 操作按钮行 -->
            <div class="content-actions">
              <button class="action-btn action-btn-delete" @click="handleDeletePage">删除页面</button>
              <button class="action-btn action-btn-save" @click="handleSaveContent">保存内容</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏（每行一个按钮） -->
      <div class="action-bar-step2">
        <button class="step2-action-btn step2-gray" @click="step = 1">上一步</button>
        <button class="step2-action-btn step2-gray" @click="handleRegenerate">重新生成</button>
        <button class="step2-action-btn step2-blue" @click="handleSelectTemplate">选择模板</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

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
const step = ref(1) // 1=输入主题, 2=编辑大纲
const subTab = ref<'outline' | 'content'>('outline')

const createType = ref<'scratch' | 'continue'>('scratch')
const prompt = ref('')
const pageCount = ref('')
const language = ref('zh')
const model = ref('gpt-4')
const uploadedImages = ref<string[]>([])

// 监听鼠标选中文本事件 - 使用Office.js API
function handleTextSelection() {
  try {
    const Office = (globalThis as any).Office;
    if (!Office?.context?.document) {
      console.log('Office context not available');
      return;
    }

    Office.context.document.getSelectedDataAsync(
      Office.CoercionType.Text,
      (asyncResult: any) => {
        console.log('回调状态:', asyncResult.status);
        console.log('AsyncResultStatus:', Office.AsyncResultStatus.Succeeded);

        if (asyncResult.status === Office.AsyncResultStatus.Succeeded && asyncResult.value) {
          const selectedText = asyncResult.value.trim();
          if (selectedText) {
            prompt.value = selectedText;
          }
        } else if (asyncResult.status === Office.AsyncResultStatus.Failed) {
          console.error('获取选中文本失败:', asyncResult.error?.message);
        }
      }
    );
  } catch (error) {
    console.error('获取选中文本失败:', error);
  }
}

onMounted(() => {
  // 监听鼠标松开事件
  document.addEventListener('mouseup', handleTextSelection);
});

onUnmounted(() => {
  // 移除事件监听器
  document.removeEventListener('mouseup', handleTextSelection);
});

// 大纲数据
interface OutlineItem {
  title: string
}
const outlineList = ref<OutlineItem[]>([
  { title: '封面页' },
  { title: '目录' },
  { title: '项目背景' },
  { title: '核心功能介绍' },
  { title: '数据展示' },
  { title: '总结与展望' },
])
const selectedPage = ref(0)

// 当前页面编辑数据
const currentPageTitle = ref('')
const currentPageContent = ref('')
const currentLayout = ref(0) // 默认选中第一个布局

// 布局选项
const layoutOptions = [
  {
    label: '纯文字',
    icon: '<div style="width:36px;height:26px;border:1.5px solid #d9d9d9;border-radius:4px;display:flex;align-items:center;justify-content:center;padding:3px;"><div style="width:100%;height:4px;background:#d9d9d9;border-radius:2px;margin-bottom:3px;"></div><div style="width:80%;height:4px;background:#d9d9d9;border-radius:2px;margin-bottom:3px;"></div><div style="width:60%;height:4px;background:#d9d9d9;border-radius:2px;"></div></div>'
  },
  {
    label: '图文混排',
    icon: '<div style="width:36px;height:26px;border:1.5px solid #d9d9d9;border-radius:4px;display:flex;padding:3px;gap:3px;"><div style="flex:0 0 13px;background:#e8e8e8;border-radius:3px;"></div><div style="flex:1;display:flex;flex-direction:column;gap:2px;"><div style="width:100%;height:3px;background:#d9d9d9;border-radius:1px;"></div><div style="width:70%;height:3px;background:#d9d9d9;border-radius:1px;"></div></div></div>'
  },
  {
    label: '左右分栏',
    icon: '<div style="width:36px;height:26px;border:1.5px solid #d9d9d9;border-radius:4px;display:flex;padding:3px;gap:3px;"><div style="flex:1;border-right:1.5px solid #eee;padding-right:3px;display:flex;flex-direction:column;gap:2px;"><div style="width:100%;height:3px;background:#d9d9d9;border-radius:1px;"></div><div style="width:60%;height:3px;background:#d9d9d9;border-radius:1px;"></div></div><div style="flex:1;display:flex;flex-direction:column;gap:2px;"><div style="width:100%;height:3px;background:#d9d9d9;border-radius:1px;"></div><div style="width:60%;height:3px;background:#d9d9d9;border-radius:1px;"></div></div></div>'
  },
]

function handleBack() {
  if (step.value === 2) {
    step.value = 1
  } else {
    emit('back')
  }
}

function handleOutlineClick(index: number) {
  selectedPage.value = index
  // 可选：点击大纲时自动切换到页面内容Tab
  // subTab.value = 'content'
}

function handlePageCountInput(e: Event) {
  const target = e.target as HTMLInputElement
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

  setTimeout(() => {
    loading.value = false
    step.value = 2
    // 初始化第一页的编辑数据
    currentPageTitle.value = outlineList.value[0]?.title || ''
    currentPageContent.value = ''
  }, 800)
}

function handleAiGenerate() {
  // TODO: AI 生成当前页面内容
}

function handleDeletePage() {
  // TODO: 删除当前页面
}

function handleSaveContent() {
  // TODO: 保存当前页面内容到 outline 数据中
}

function handleRegenerate() {
  // TODO: 重新生成大纲
}

function handleSelectTemplate() {
  // TODO: 选择模板并生成 PPT
}

defineExpose({
  setLoading(val: boolean) { loading.value = val },
  setOutline(list: OutlineItem[]) { outlineList.value = list },
  getStep() { return step.value }
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

/* ======== 顶部导航 ======== */
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

.back-btn:hover { color: #1890ff; }
.back-btn svg { flex-shrink: 0; }

.nav-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* ======== 步骤标题 ======== */
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

/* ======== 第一步：表单内容 ======== */
.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 16px;
}

.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.required-mark { color: #ff4d4f; margin-left: 2px; }

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
.type-card:hover { border-color: #b3d8ff; }
.type-card.active { border-color: #1890ff; background: #f0f7ff; }

.type-card-inner { display: flex; align-items: flex-start; justify-content: space-between; }
.type-card-text { flex: 1; }

.type-card-title { font-size: 14px; font-weight: 600; color: #222; margin-bottom: 4px; }
.type-card-desc { font-size: 12px; color: #999; }

.type-card-radio { flex-shrink: 0; margin-left: 8px; margin-top: 2px; }

.radio-outer {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid #d9d9d9;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.radio-outer.checked { border-color: #1890ff; }
.radio-inner { width: 10px; height: 10px; border-radius: 50%; background: #1890ff; }

/* 提示词输入 */
.prompt-wrapper {
  width: 100%; position: relative;
  display: flex; border: 1.5px solid #e8e8e8;
  border-radius: 10px; transition: border-color 0.2s; overflow: hidden;
}
.prompt-wrapper:focus-within { border-color: #1890ff; }

.prompt-input {
  flex: 1; padding: 12px; border: none; outline: none;
  font-size: 14px; color: #333; resize: none;
  font-family: inherit; line-height: 1.5; background: transparent;
}
.prompt-input::placeholder { color: #bbb; }

.upload-btn {
  display: flex; align-items: flex-start; justify-content: center;
  padding: 12px 10px 12px 0; background: none; border: none;
  color: #999; cursor: pointer; transition: color 0.2s; flex-shrink: 0;
}
.upload-btn:hover { color: #1890ff; }

/* 上传图片预览 */
.uploaded-images { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.uploaded-image-item {
  position: relative; width: 60px; height: 60px;
  border-radius: 8px; overflow: hidden; border: 1px solid #e8e8e8;
}
.uploaded-image-item img { width: 100%; height: 100%; object-fit: cover; }

.remove-image-btn {
  position: absolute; top: 2px; right: 2px;
  width: 18px; height: 18px; border-radius: 50%;
  background: rgba(0,0,0,0.5); border: none; color: #fff;
  cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;
}

.prompt-counter { text-align: right; font-size: 12px; color: #bbb; margin-top: 4px; }

/* 通用输入框 */
.form-input {
  width: 100%; padding: 10px 12px; border: 1.5px solid #e8e8e8;
  border-radius: 10px; font-size: 14px; color: #333; outline: none;
  transition: border-color 0.2s; font-family: inherit; background: #fff;
}
.form-input::placeholder { color: #bbb; }
.form-input:focus { border-color: #1890ff; }

/* 下拉选择 */
.select-wrapper { position: relative; }

.form-select {
  width: 100%; padding: 10px 36px 10px 12px; border: 1.5px solid #e8e8e8;
  border-radius: 10px; font-size: 14px; color: #333; outline: none;
  appearance: none; -webkit-appearance: none; background: #fff;
  cursor: pointer; font-family: inherit; transition: border-color 0.2s;
}
.form-select:focus { border-color: #1890ff; }

.select-arrow {
  position: absolute; right: 12px; top: 50%;
  transform: translateY(-50%); color: #999; pointer-events: none;
}

/* 第一步底部按钮 */
.action-bar { padding: 12px 16px 20px; flex-shrink: 0; }

.generate-btn {
  width: 100%; padding: 14px 0; border: none; border-radius: 10px;
  background: #1890ff; color: #fff; font-size: 16px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.generate-btn:hover:not(:disabled) { background: #40a9ff; }
.generate-btn:active:not(:disabled) { background: #096dd9; }
.generate-btn:disabled { background: #a0cfff; cursor: not-allowed; }

.loading-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }


/* ============================================================
   第二步：编辑大纲
   ============================================================ */
.step2-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 16px;
}

/* ---- Tab 栏 ---- */
.tab-bar {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  flex-shrink: 0;
}

.tab-item {
  flex: 1; text-align: center; padding: 12px 0;
  font-size: 14px; font-weight: 500; color: #999;
  cursor: pointer; transition: all 0.2s;
  position: relative; user-select: none;
}
.tab-item:hover { color: #666; }
.tab-item.active { color: #1890ff; }
.tab-item.active::after {
  content: ''; position: absolute; bottom: 0;
  left: 20%; right: 20%; height: 2.5px;
  background: #1890ff; border-radius: 2px;
}

/* ---- Tab 面板 ---- */
.tab-panel {
  flex: 1; overflow-y: auto;
}
/* 大纲面板保留内边距 */
.outline-panel { padding: 16px 0; }
/* 内容面板不需要额外内边距，外层step2-container已有padding */
.content-panel { display: flex; flex-direction: column; gap: 14px; }
.outline-panel .outline-list { display: flex; flex-direction: column; gap: 0; }

.outline-item {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 14px; border-bottom: 1px solid #f0f0f0;
  cursor: pointer; transition: background 0.15s;
}
.outline-item:last-child { border-bottom: none; }
.outline-item:hover { background: #f9f9f9; }
.outline-item.selected { background: #e6f4ff; }

.outline-index {
  width: 26px; height: 26px; border-radius: 50%;
  background: #f0f0f0; color: #888; font-size: 12px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.outline-item:hover .outline-index,
.outline-item.selected .outline-index { background: #e6f4ff; color: #1890ff; }

.outline-text { font-size: 14px; color: #333; line-height: 1.4; }

/* ---- 页面内容面板 ---- */

/* 灰色包裹卡片：页面标题 + 布局 + 内容 */
.content-editor-card {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 16px;
}

/* 布局选择 */
.layout-options {
  display: flex; gap: 10px;
}

.layout-option {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; gap: 6px; padding: 10px 6px;
  border: 1.5px solid #e8e8e8; border-radius: 8px;
  cursor: pointer; transition: all 0.2s; background: #fff;
}
.layout-option:hover { border-color: #b3d8ff; }
.layout-option.active { border-color: #1890ff; background: #f0f7ff; }

.layout-icon { display: flex; align-items: center; justify-content: center; }
.layout-label { font-size: 12px; color: #666; }
.layout-option.active .layout-label { color: #1890ff; font-weight: 500; }

/* 页面内容：label + AI按钮同行 */
.content-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.content-label-row .form-label {
  margin-bottom: 0;
}

.content-textarea {
  width: 100%; padding: 12px;
  border: 1.5px solid #e8e8e8; border-radius: 10px;
  font-size: 14px; color: #333; outline: none; resize: vertical;
  font-family: inherit; line-height: 1.6; transition: border-color 0.2s;
  box-sizing: border-box; background: #fff;
}
.content-textarea::placeholder { color: #bbb; }
.content-textarea:focus { border-color: #1890ff; }

.ai-generate-btn {
  padding: 6px 14px; border: none; border-radius: 6px;
  background: #222; color: #fff; font-size: 12px; font-weight: 500;
  cursor: pointer; white-space: nowrap; font-family: inherit;
  transition: background 0.2s; flex-shrink: 0;
}
.ai-generate-btn:hover { background: #444; }

/* 页面操作按钮行 */
.content-actions {
  display: flex; gap: 10px; margin-top: 4px;
}

.action-btn {
  padding: 9px 18px; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  font-family: inherit; transition: all 0.2s;
}

.action-btn-delete {
  background: #f0f0f0; color: #888; /* 灰色短按钮，宽度自适应 */
}
.action-btn-delete:hover { background: #e0e0e0; color: #666; }

.action-btn-save {
  flex: 1; background: #1890ff; color: #fff; /* 蓝色长按钮 */
}
.action-btn-save:hover { background: #40a9ff; }

/* ---- 底部操作栏（第二步：三个按钮各占一行）---- */
.action-bar-step2 {
  display: flex; flex-direction: column; gap: 10px;
  padding: 12px 16px 20px; flex-shrink: 0;
}

.step2-action-btn {
  width: 100%; padding: 12px 0; border: none; border-radius: 10px;
  font-size: 14px; font-weight: 500; cursor: pointer;
  font-family: inherit; transition: all 0.2s;
}

.step2-gray {
  background: #f5f5f5; color: #888;
}
.step2-gray:hover { background: #ebebeb; color: #666; }

.step2-blue {
  background: #1890ff; color: #fff;
}
.step2-blue:hover { background: #40a9ff; }
</style>
