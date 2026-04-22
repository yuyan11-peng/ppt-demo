<template>
  <!-- Office 环境：显示任务窗格 + 新窗口打开按钮 -->
  <div v-if="inOffice" class="office-container">
    <div class="office-topbar">
      <span class="office-topbar-title">Office Buddy</span>
      <button class="open-window-btn" @click="handleOpenInNewWindow" title="在新窗口中打开">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        新窗口打开
      </button>
    </div>
    <TaskPane />
  </div>

  <!-- 新窗口模式（?mode=editor）：左侧缩略图 + 中间当前幻灯片 + 右侧功能区 -->
  <div v-else class="editor-container">
    <!-- 左侧：PPT 幻灯片缩略图列表 -->
    <div class="left-panel">
      <div class="left-panel-header">
        <span class="left-panel-title">幻灯片</span>
        <span class="left-panel-count">{{ pptSlides.length }} 页</span>
      </div>
      <div class="slide-list">
        <div
          v-for="(slide, index) in pptSlides"
          :key="slide.id"
          class="slide-thumb-item"
          :class="{ active: index === activeSlideIndex }"
          @click="activeSlideIndex = index"
        >
          <div class="slide-thumb-number">{{ index + 1 }}</div>
          <div class="slide-thumb-card" :class="slide.layout">
            <div class="thumb-gradient-bar"></div>
            <div class="thumb-content" v-html="getRenderedHtml(slide.markdown)"></div>
          </div>
          <div class="slide-thumb-label">{{ slide.title || '无标题' }}</div>
        </div>
        <div v-if="pptSlides.length === 0 && !slidesLoading" class="empty-hint">
          <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="#ddd" stroke-width="1.5">
            <rect x="6" y="6" width="36" height="36" rx="3" />
            <line x1="14" y1="16" x2="34" y2="16" />
            <line x1="14" y1="22" x2="30" y2="22" />
            <line x1="14" y1="28" x2="26" y2="28" />
          </svg>
          <p>暂无幻灯片数据</p>
          <p class="empty-sub">请从 PowerPoint 插件中点击"新窗口打开"</p>
        </div>
        <div v-if="slidesLoading" class="loading-hint">
          <span class="loading-spinner"></span>
          <p>正在读取幻灯片...</p>
        </div>
      </div>
    </div>

    <!-- 中间：当前选中幻灯片预览 -->
    <div class="center-panel">
      <div v-if="currentSlide" class="slide-preview-area">
        <!-- 幻灯片画布 - 模拟 PPT 编辑区 -->
        <div class="slide-canvas">
          <div class="slide-page" :class="currentSlide.layout">
            <div v-html="getRenderedHtml(currentSlide.markdown)" class="preview-content"></div>
          </div>
        </div>
      </div>
      <div v-else class="empty-center">
        <p>选择一张幻灯片进行预览</p>
      </div>
    </div>

    <!-- 右侧：办公帮帮功能（TaskPane） -->
    <div class="right-panel">
      <TaskPane />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TaskPane from './components/TaskPane.vue'
import { isOfficeContext, fetchSlidesFromPowerPoint } from './modules/powerpoint-api'
import { parseMarkdown } from './modules/markdown'

// localStorage key：用于 Office → 新窗口传递 PPT 幻灯片数据
const PPT_SLIDES_KEY = 'ppt-kit-ppt-slides'

// 检测运行环境
const urlParams = new URLSearchParams(window.location.search)
const forceEditor = urlParams.get('mode') === 'editor'
const inOffice = ref(forceEditor ? false : isOfficeContext())

// 新窗口左侧：PPT 幻灯片数据（从 localStorage 读取）
interface PPTSlide {
  id: string
  title: string
  markdown: string
  layout: 'title' | 'content' | 'two-column' | 'code' | 'blank'
}

const pptSlides = ref<PPTSlide[]>([])
const activeSlideIndex = ref(0)
const slidesLoading = ref(false)

// 当前选中的幻灯片
const currentSlide = computed(() => {
  if (pptSlides.value.length === 0) return null
  return pptSlides.value[activeSlideIndex.value]
})

// 缓存 markdown 渲染结果
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

async function handleOpenInNewWindow() {
  // 在 Office 环境中，先从 PowerPoint API 读取幻灯片数据，存入 localStorage
  if (isOfficeContext()) {
    try {
      const slides = await fetchSlidesFromPowerPoint()
      if (slides.length > 0) {
        localStorage.setItem(PPT_SLIDES_KEY, JSON.stringify(slides))
      }
    } catch (e) {
      console.warn('[App] 读取 PowerPoint 幻灯片失败:', e)
    }
  }
  const url = window.location.origin + window.location.pathname + '?mode=editor'
  window.open(url, '_blank')
}

// 新窗口挂载时：从 localStorage 读取幻灯片数据
onMounted(() => {
  if (!forceEditor) {
    inOffice.value = isOfficeContext()
  }

  // 如果是新窗口模式，从 localStorage 读取 Office 端传递的幻灯片数据
  if (forceEditor) {
    slidesLoading.value = true
    try {
      const raw = localStorage.getItem(PPT_SLIDES_KEY)
      if (raw) {
        pptSlides.value = JSON.parse(raw) as PPTSlide[]
      }
    } catch (e) {
      console.warn('[App] 读取 localStorage 幻灯片数据失败:', e)
    } finally {
      slidesLoading.value = false
    }
  }
})
</script>

<style scoped>
/* ===== Office 环境：TaskPane + 悬浮按钮 ===== */
.office-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
}

.office-container > .taskpane-root {
  flex: 1;
  overflow: hidden;
}

/* 顶部工具栏 */
.office-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f7f8fa;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.office-topbar-title {
  font-size: 13px;
  font-weight: 600;
  color: #999;
}

.open-window-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #666;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.open-window-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
  background: #f0f7ff;
}

.open-window-btn:active {
  background: #e6f4ff;
}

/* ===== 新窗口编辑器布局：三栏 - 左侧缩略图 | 中间幻灯片预览 | 右侧功能区 ===== */
.editor-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #fff;
  color: #333;
}

/* 左侧面板 - 缩略图列表 */
.left-panel {
  width: 200px;
  min-width: 180px;
  max-width: 240px;
  background: #f0f0f0;
  border-right: 1px solid #d9d9d9;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.left-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e6eb;
  background: #fff;
  flex-shrink: 0;
}

.left-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.left-panel-count {
  font-size: 12px;
  color: #999;
}

.slide-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 8px;
}

/* 幻灯片缩略图条目 */
.slide-thumb-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 6px;
  transition: all 0.2s;
}

.slide-thumb-item:hover {
  background: #e0e0e0;
}

.slide-thumb-item.active {
  background: #d6e4f0;
  border-color: #1890ff;
}

.slide-thumb-number {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  z-index: 2;
}

/* 幻灯片缩略图卡片 - 白底，模拟 PPT 幻灯片 */
.slide-thumb-card {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background: #ffffff;
  border: 1px solid #d0d0d0;
  padding: 8px 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.slide-thumb-card.title {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 顶部渐变条 - PPT 主题色 */
.thumb-gradient-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #b7472a, #d4532b);
}

/* 缩略图内容渲染 - 白底深色文字 */
.thumb-content {
  height: 100%;
  overflow: hidden;
  line-height: 1.3;
  color: #555;
  font-size: 7px;
}

/* ===== 缩略图内 Markdown 元素样式 - 白底主题 ===== */
.thumb-content :deep(h1) {
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 3px 0;
  color: #1a1a1a;
  line-height: 1.2;
  border: none;
  padding: 0;
}

.thumb-content :deep(h2) {
  font-size: 9px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: #1a1a1a;
  line-height: 1.2;
  border: none;
  padding: 0;
}

.thumb-content :deep(h3) {
  font-size: 8px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: #333;
  line-height: 1.2;
}

.thumb-content :deep(p) {
  font-size: 6.5px;
  margin: 0 0 2px 0;
  color: #555;
  line-height: 1.3;
}

.thumb-content :deep(ul),
.thumb-content :deep(ol) {
  padding-left: 10px;
  margin: 0 0 2px 0;
  font-size: 6.5px;
  line-height: 1.3;
  color: #555;
}

.thumb-content :deep(li) {
  margin-bottom: 1px;
}

.thumb-content :deep(strong) {
  color: #1a1a1a;
  font-weight: 600;
}

.thumb-content :deep(code) {
  font-size: 5.5px;
  padding: 1px 2px;
  background: #f0f0f0;
  border-radius: 2px;
  color: #c7254e;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.thumb-content :deep(pre) {
  margin: 2px 0;
  padding: 3px;
  font-size: 5px;
  line-height: 1.2;
  border-radius: 3px;
  background: #f5f5f5;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.thumb-content :deep(pre code) {
  padding: 0;
  background: none;
  color: #333;
  font-size: 5px;
}

.thumb-content :deep(blockquote) {
  margin: 2px 0;
  padding: 2px 5px;
  font-size: 5.5px;
  border-left: 2px solid #b7472a;
  background: #faf5f3;
  color: #555;
}

.thumb-content :deep(table) {
  font-size: 5.5px;
  margin: 2px 0;
  border-collapse: collapse;
  width: 100%;
}

.thumb-content :deep(th),
.thumb-content :deep(td) {
  padding: 1px 3px;
  font-size: 5.5px;
  border: 1px solid #d0d0d0;
}

.thumb-content :deep(th) {
  background: #f0f0f0;
  font-weight: 600;
  color: #1a1a1a;
}

/* title 布局特殊样式 */
.slide-thumb-card.title .thumb-content :deep(h1) {
  font-size: 15px;
  margin-bottom: 4px;
}

.slide-thumb-card.title .thumb-content :deep(p),
.slide-thumb-card.title .thumb-content :deep(ul),
.slide-thumb-card.title .thumb-content :deep(ol) {
  font-size: 7px;
}

/* 缩略图底部标题 */
.slide-thumb-label {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}

/* 空状态提示 */
.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  color: #bbb;
  text-align: center;
}

.empty-hint p {
  font-size: 14px;
  margin: 8px 0 0;
}

.empty-sub {
  font-size: 12px;
  margin-top: 4px !important;
  color: #ccc;
}

/* 加载状态 */
.loading-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  color: #999;
  text-align: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e6eb;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-hint p {
  font-size: 13px;
  margin: 0;
}

/* ===== 中间面板：当前幻灯片预览 ===== */
.center-panel {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: auto;
  background: #e8e8e8;
}

.slide-preview-area {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

/* 幻灯片画布 */
.slide-canvas {
  width: 100%;
  max-width: 960px;
  aspect-ratio: 16 / 9;
  background: #fff;
  border-radius: 2px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  margin-top: 10px;
}

/* 幻灯片页面内容 - 比例 16:9 白底 */
.slide-page {
  width: 100%;
  height: 100%;
  padding: 48px 64px;
  overflow: auto;
  position: relative;
}

.slide-page.title {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 预览区 Markdown 内容渲染 */
.preview-content {
  color: #222;
  font-size: 16px;
  line-height: 1.6;
}

.preview-content :deep(h1) {
  font-size: 38px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #111;
  border-bottom: none;
}

.preview-content :deep(h2) {
  font-size: 28px;
  font-weight: 600;
  margin: 24px 0 12px 0;
  color: #222;
  border-bottom: none;
}

.preview-content :deep(h3) {
  font-size: 22px;
  font-weight: 600;
  margin: 18px 0 8px 0;
  color: #333;
}

.preview-content :deep(p) {
  margin-bottom: 12px;
  font-size: 16px;
  color: #333;
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
  padding-left: 28px;
  margin-bottom: 14px;
}

.preview-content :deep(li) {
  margin-bottom: 6px;
  font-size: 15px;
  line-height: 1.5;
}

.preview-content :deep(strong) {
  font-weight: 600;
  color: #111;
}

.preview-content :deep(code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9em;
  color: #c7254e;
}

.preview-content :deep(pre) {
  background: #f7f7f7;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 16px;
  margin: 16px 0;
  overflow-x: auto;
}

.preview-content :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 13px;
  color: #333;
}

.preview-content :deep(blockquote) {
  border-left: 4px solid #b7472a;
  padding: 8px 16px;
  margin: 16px 0;
  background: #fafafa;
  color: #555;
}

.preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.preview-content :deep(th) {
  background: #f0f0f0;
  font-weight: 600;
}

.empty-center {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #999;
  font-size: 16px;
}

/* 右侧面板 */
.right-panel {
  width: 320px;
  min-width: 280px;
  max-width: 380px;
  overflow: hidden;
  background: #fff;
  border-left: 1px solid #e5e6eb;
}

/* 穿透 TaskPane 样式，确保它占满右侧区域 */
.right-panel :deep(.taskpane-root) {
  height: 100%;
}
</style>
