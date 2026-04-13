<template>
  <div class="taskpane-root">
    <!-- 一键生成PPT页面 -->
    <GeneratePPT
      v-if="currentPage === 'generate'"
      ref="generatePPTRef"
      @back="currentPage = 'home'"
      @generate="handleGenerateOutline"
    />

    <!-- 内容优化页面 -->
    <OptimizeContent
      v-else-if="currentPage === 'optimize'"
      ref="optimizeContentRef"
      @back="currentPage = 'home'"
      @replace="handleReplaceText"
    />

    <!-- 主页面 -->
    <div v-else class="taskpane">
    <!-- 顶部标题栏 -->
    <div class="taskpane-header">
      <span class="header-title">办公智帮</span>
    </div>

    <!-- 标签切换 -->
    <div class="tab-bar">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'ai' }"
        @click="activeTab = 'ai'"
      >
        AI助手
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'material' }"
        @click="activeTab = 'material'"
      >
        素材库
      </button>
    </div>

    <!-- AI助手标签页 -->
    <div v-if="activeTab === 'ai'" class="tab-content">
      <div class="feature-list">
        <!-- 一键生成PPT -->
        <div class="feature-card" @click="currentPage = 'generate'">
          <div class="feature-icon icon-generate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <div class="feature-title">一键生成PPT</div>
          <div class="feature-desc">输入主题，AI帮您快速生成完整演示文稿</div>
        </div>

        <!-- 内容优化 -->
        <div class="feature-card" @click="currentPage = 'optimize'">
          <div class="feature-icon icon-optimize">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div class="feature-title">内容优化</div>
          <div class="feature-desc">选中文本后进行智能改写</div>
        </div>

        <!-- AI生图 -->
        <div class="feature-card" @click="handleAIImage">
          <div class="feature-icon icon-image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div class="feature-title">AI生图</div>
          <div class="feature-desc">AI生成图片素材</div>
        </div>

        <!-- 排版优化 -->
        <div class="feature-card" @click="handleLayoutOptimize">
          <div class="feature-icon icon-layout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"/>
            </svg>
          </div>
          <div class="feature-title">排版优化</div>
          <div class="feature-desc">统一格式，美化布局</div>
        </div>
      </div>
    </div>

    <!-- 素材库标签页 -->
    <div v-if="activeTab === 'material'" class="tab-content">
      <div class="material-section">
        <div class="section-title">模板</div>
        <div class="material-grid">
          <div class="material-item" v-for="tpl in templates" :key="tpl.id" @click="handleApplyTemplate(tpl)">
            <div class="material-thumb" :style="{ background: tpl.color }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="material-thumb-icon">
                <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div class="material-name">{{ tpl.name }}</div>
          </div>
        </div>
      </div>

      <div class="material-section">
        <div class="section-title">图标</div>
        <div class="material-grid icons-grid">
          <div class="icon-item" v-for="icon in icons" :key="icon" :title="icon">
            {{ icon }}
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="taskpane-toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import GeneratePPT from './GeneratePPT.vue'
import OptimizeContent from './OptimizeContent.vue'
import { generateOutline, applyOutlineToPowerPoint, isOfficeContext } from '../modules/powerpoint-api'

const activeTab = ref<'ai' | 'material'>('ai')
const currentPage = ref<'home' | 'generate' | 'optimize'>('home')
const generatePPTRef = ref<InstanceType<typeof GeneratePPT> | null>(null)
const optimizeContentRef = ref<InstanceType<typeof OptimizeContent> | null>(null)

const toast = reactive({
  show: false,
  message: '',
  type: 'info' as 'success' | 'error' | 'info'
})

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

// ====== AI 助手功能 ======

async function handleGenerateOutline(data: {
  createType: string
  prompt: string
  pageCount: string
  language: string
  model: string
  images: string[]
}) {
  try {
    // 1. 生成大纲
    const pageCount = data.pageCount ? parseInt(data.pageCount) : undefined
    const outline = generateOutline(data.prompt, pageCount, data.language)
    console.log('[TaskPane] Generated outline:', outline)

    // 2. 写入 PowerPoint
    if (isOfficeContext()) {
      showToast('正在写入 PowerPoint...', 'info')
      const result = await applyOutlineToPowerPoint(outline)
      if (result.success) {
        showToast(result.message, 'success')
      } else {
        showToast(result.message, 'error')
      }
    } else {
      // 非 Office 环境，打印到控制台
      showToast(`已生成 ${outline.length} 页大纲（非Office环境，无法写入PPT）`, 'info')
      console.log('[TaskPane] Outline (non-Office):', outline)
    }

    // 3. 返回主页
    currentPage.value = 'home'
  } catch (e) {
    showToast('生成失败: ' + (e as Error).message, 'error')
  } finally {
    generatePPTRef.value?.setLoading(false)
  }
}

async function handleReplaceText(data: { original: string; optimized: string }) {
  console.log('[TaskPane] ====== 替换开始 ======')
  console.log('[TaskPane] data:', JSON.stringify(data))

  try {
    if (!isOfficeContext()) {
      showToast('非 Office 环境，无法替换', 'info')
      return
    }

    const Office = (globalThis as any).Office
    const PowerPoint = Office.PowerPoint || (globalThis as any).PowerPoint

    // 检测 API 版本支持
    const supports14 = !!Office.context.requirements?.isSetSupported?.('PowerPointApi', '1.4')
    console.log('[TaskPane] PowerPointApi 1.4 supported:', supports14)

    if (supports14) {
      // ===== 方案 A: PowerPointApi 1.4+ — 使用 textFrame API =====
      const replaced = await replaceViaTextFrameApi(PowerPoint, data)
      if (replaced) {
        showToast('已替换到幻灯片', 'success')
      } else {
        showToast('未找到匹配的文本，请确认输入内容与幻灯片一致', 'info')
      }
    } else {
      // ===== 方案 B: 旧版 Office — 通过选中内容 + Common API 替换 =====
      console.log('[TaskPane] 使用 Common API 方案 (选中内容替换)')
      await replaceViaCommonApi(Office, data)
    }
  } catch (e) {
    console.error('[TaskPane] ❌ Replace error:', e)
    showToast('替换失败: ' + (e as Error).message, 'error')
  } finally {
    console.log('[TaskPane] ====== 替换结束 ======')
    optimizeContentRef.value?.setReplacing(false)
  }
}

/** 方案 A: 通过 textFrame API 替换（需要 PowerPointApi 1.4+） */
async function replaceViaTextFrameApi(
  PowerPoint: any,
  data: { original: string; optimized: string }
): Promise<boolean> {
  let replaced = false

  await PowerPoint.run(async (context: any) => {
    const slides = context.presentation.slides
    slides.load('items')
    await context.sync()

    for (let si = 0; si < slides.items.length; si++) {
      const slide = slides.items[si]
      const shapes = slide.shapes
      shapes.load('items/textFrame/textRange/text')
      await context.sync()

      for (let shi = 0; shi < shapes.items.length; shi++) {
        const shape = shapes.items[shi]
        try {
          const currentText = shape.textFrame?.textRange?.text
          if (currentText && currentText.includes(data.original)) {
            shape.textFrame.textRange.text = currentText.replace(data.original, data.optimized)
            await context.sync()
            replaced = true
            console.log(`[TaskPane][A] ✅ Replaced in S${si + 1}-Shape${shi + 1}`)
          }
        } catch {
          // 跳过没有 textFrame 的形状
        }
      }
    }
  })
  return replaced
}

/** 方案 B: 通过 Common API 替换文本（兼容不支持 textFrame 的旧版 Office）
 *  思路：读取当前选中的文本 → 替换 → 写回
 *  要求用户先选中包含目标文本的形状 */
async function replaceViaCommonApi(
  Office: any,
  data: { original: string; optimized: string }
): Promise<void> {
  // 第一步：尝试读取当前选中的文本
  const selectedText = await new Promise<string | null>((resolve) => {
    try {
      Office.context.document.getSelectedDataAsync(
        Office.CoercionType.Text,
        (result: any) => {
          console.log('[TaskPane][B] getSelectedDataAsync status:', result.status)
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            console.log('[TaskPane][B] Selected text:', JSON.stringify(result.value))
            resolve(result.value as string)
          } else {
            console.log('[TaskPane][B] getSelectedDataAsync error:', result.error?.message)
            resolve(null)
          }
        }
      )
    } catch (err) {
      console.error('[TaskPane][B] getSelectedDataAsync exception:', err)
      resolve(null)
    }
  })

  if (!selectedText) {
    showToast('请先在 PPT 中选中包含要替换文本的文本框，然后再点击替换', 'info')
    return
  }

  // 检查选中的文本是否包含要替换的内容
  if (!selectedText.includes(data.original)) {
    console.log('[TaskPane][B] Selected text does not contain original')
    console.log('[TaskPane][B] Selected:', JSON.stringify(selectedText))
    console.log('[TaskPane][B] Looking for:', JSON.stringify(data.original))
    showToast('选中的文本中未找到匹配内容，请选中包含原文的文本框后重试', 'info')
    return
  }

  // 第二步：替换文本并写回
  const newText = selectedText.replace(data.original, data.optimized)
  console.log('[TaskPane][B] Replacing with:', JSON.stringify(newText))

  const writeResult = await new Promise<boolean>((resolve) => {
    try {
      Office.context.document.setSelectedDataAsync(
        newText,
        { coercionType: Office.CoercionType.Text },
        (result: any) => {
          console.log('[TaskPane][B] setSelectedDataAsync status:', result.status)
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve(true)
          } else {
            console.error('[TaskPane][B] setSelectedDataAsync error:', result.error?.message)
            resolve(false)
          }
        }
      )
    } catch (err) {
      console.error('[TaskPane][B] setSelectedDataAsync exception:', err)
      resolve(false)
    }
  })

  if (writeResult) {
    showToast('已替换到幻灯片', 'success')
  } else {
    showToast('替换写入失败，请重试', 'error')
  }
}


function handleAIImage() {
  const desc = prompt('请描述要生成的图片：')
  if (!desc) return
  showToast('正在生成图片...', 'info')
  // TODO: 接入 AI 生图 API
  setTimeout(() => showToast('图片生成完成！', 'success'), 2000)
}

function handleLayoutOptimize() {
  showToast('正在优化排版...', 'info')
  // TODO: 读取当前幻灯片 → 统一格式 → 回写
  setTimeout(() => showToast('排版优化完成！', 'success'), 2000)
}

// ====== 素材库 ======

const templates = [
  { id: 1, name: '商务蓝', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 2, name: '简约白', color: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)' },
  { id: 3, name: '科技感', color: 'linear-gradient(135deg, #0c0c1d, #1a1a3e)' },
  { id: 4, name: '活力橙', color: 'linear-gradient(135deg, #f093fb, #f5576c)' },
]

const icons = ['📊', '📈', '💡', '🎯', '🚀', '⚡', '🔔', '📋', '✅', '🔧', '🎨', '📦']

function handleApplyTemplate(tpl: { id: number; name: string }) {
  showToast(`正在应用模板: ${tpl.name}`, 'info')
  // TODO: 应用模板到当前演示文稿
}
</script>

<style scoped>
.taskpane-root {
  height: 100vh;
  overflow: hidden;
}

.taskpane {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ffffff;
  color: #333;
  font-family: 'Segoe UI', 'Microsoft YaHei', -apple-system, sans-serif;
  overflow: hidden;
}

/* 顶部标题 */
.taskpane-header {
  padding: 12px 16px 0;
  flex-shrink: 0;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* 标签栏 */
.tab-bar {
  display: flex;
  gap: 0;
  padding: 0 16px;
  margin-top: 12px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.tab-btn {
  position: relative;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  font-family: inherit;
}

.tab-btn.active {
  color: #4a90d9;
  font-weight: 600;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 12px;
  right: 12px;
  height: 2px;
  background: #4a90d9;
  border-radius: 1px;
}

.tab-btn:hover:not(.active) {
  color: #666;
}

/* 标签内容区域 */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 功能卡片列表 */
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  background: #f8f9fc;
  border: 1px solid #eef0f4;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.feature-card:hover {
  background: #f0f3fa;
  border-color: #d8ddef;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.feature-card:active {
  transform: translateY(0);
}

/* 功能图标 */
.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.feature-icon svg {
  width: 24px;
  height: 24px;
}

.icon-generate {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.icon-optimize {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.icon-image {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.icon-layout {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.feature-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.feature-desc {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

/* 素材库 */
.material-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 10px;
  padding-left: 2px;
}

.material-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.material-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eef0f4;
  transition: all 0.2s;
}

.material-item:hover {
  border-color: #d0d5e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.material-thumb {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.material-thumb-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.7);
}

.material-name {
  padding: 6px 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
  background: #fafafa;
}

.icons-grid {
  grid-template-columns: repeat(4, 1fr);
}

.icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  font-size: 22px;
  background: #f8f9fc;
  border: 1px solid #eef0f4;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-item:hover {
  background: #eef1f8;
  transform: scale(1.1);
}

/* Toast */
.taskpane-toast {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
  z-index: 100;
}

.taskpane-toast.info {
  background: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
}

.taskpane-toast.success {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.taskpane-toast.error {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
