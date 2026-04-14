<template>
  <div class="taskpane-root">
    <!-- ===== 一键生成PPT页面 ===== -->
    <GeneratePPT
      v-if="currentPage === 'generate'"
      ref="generatePPTRef"
      @back="currentPage = 'home'"
      @generate="handleGenerateOutline"
    />

    <!-- ===== 内容优化页面 ===== -->
    <OptimizeContent
      v-else-if="currentPage === 'optimize'"
      ref="optimizeContentRef"
      @back="currentPage = 'home'"
      @replace="handleReplaceText"
    />

    <!-- ===== AI生图页面 ===== -->
    <div v-else-if="currentPage === 'aiimage'" class="sub-page">
      <div class="page-header">
        <button class="back-btn" @click="currentPage = 'home'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="page-title">AI 生图</span>
      </div>
      <div class="page-body">
        <div class="form-section">
          <label class="form-label">描述你想要的图片</label>
          <textarea class="form-textarea" v-model="aiImagePrompt" placeholder="例如：一只在星空下奔跑的狐狸..." rows="4"></textarea>
          <button class="primary-btn" @click="handleAIImageGenerate" :disabled="aiImageLoading">
            {{ aiImageLoading ? '生成中...' : '生成图片' }}
          </button>
        </div>
        <div v-if="aiImageResult" class="result-section">
          <img :src="aiImageResult" alt="生成的图片" class="result-image" />
        </div>
      </div>
    </div>

    <!-- ===== 排版优化页面 ===== -->
    <div v-else-if="currentPage === 'layout'" class="sub-page">
      <div class="page-header">
        <button class="back-btn" @click="currentPage = 'home'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="page-title">排版优化</span>
      </div>
      <div class="page-body">
        <p class="info-text">点击下方按钮将自动分析当前幻灯片并统一格式、美化布局。</p>
        <button class="primary-btn" @click="handleLayoutOptimize" :disabled="layoutLoading">
          {{ layoutLoading ? '优化中...' : '开始排版优化' }}
        </button>
      </div>
    </div>

    <!-- ===== 模板页面 ===== -->
    <div v-else-if="currentPage === 'template'" class="sub-page">
      <div class="page-header">
        <button class="back-btn" @click="currentPage = 'home'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="page-title">模板库</span>
      </div>
      <div class="page-body">
        <div class="template-grid">
          <div class="template-card" v-for="tpl in templates" :key="tpl.id" @click="handleApplyTemplate(tpl)">
            <div class="template-thumb" :style="{ background: tpl.color }"></div>
            <div class="template-name">{{ tpl.name }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 图片页面 ===== -->
    <div v-else-if="currentPage === 'images'" class="sub-page">
      <div class="page-header">
        <button class="back-btn" @click="currentPage = 'home'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="page-title">图片素材</span>
      </div>
      <div class="page-body">
        <p class="info-text">浏览并选择图片插入到当前幻灯片中</p>
        <div class="image-grid">
          <div class="image-placeholder" v-for="n in 6" :key="n">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <span>图片 {{ n }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 图标页面 ===== -->
    <div v-else-if="currentPage === 'icons'" class="sub-page">
      <div class="page-header">
        <button class="back-btn" @click="currentPage = 'home'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="page-title">图标素材</span>
      </div>
      <div class="page-body">
        <div class="icon-grid">
          <div class="icon-item" v-for="(icon, idx) in iconList" :key="idx" :title="icon.name" @click="handleInsertIcon(icon)">
            <span class="icon-char">{{ icon.char }}</span>
            <span class="icon-name">{{ icon.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 主面板（侧边栏导航） ===== -->
    <div v-else class="main-panel">
      <!-- 侧边导航栏 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="logo-text">办公帮帮</span>
        </div>
        <nav class="sidebar-nav">
          <!-- AI 助手区域 -->
          <div class="nav-group-label">AI 助手</div>
          <button
            class="nav-item"
            :class="{ active: currentPage === 'generate' || currentNav === 'generate' }"
            @click="navigateTo('generate')"
          >
            <span class="nav-icon icon-generate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </span>
            <span>一键生成PPT</span>
          </button>
          <button class="nav-item" @click="navigateTo('aiimage')">
            <span class="nav-icon icon-image">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </span>
            <span>AI生图</span>
          </button>
          <button class="nav-item" @click="navigateTo('optimize')">
            <span class="nav-icon icon-optimize">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            </span>
            <span>内容优化</span>
          </button>
          <button class="nav-item" @click="navigateTo('layout')">
            <span class="nav-icon icon-layout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"/></svg>
            </span>
            <span>排版优化</span>
          </button>

          <!-- 素材库区域 -->
          <div class="nav-group-label">素材库</div>
          <button class="nav-item" @click="navigateTo('template')">
            <span class="nav-icon icon-template">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </span>
            <span>模板</span>
          </button>
          <button class="nav-item" @click="navigateTo('images')">
            <span class="nav-icon icon-pictures">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </span>
            <span>图片</span>
          </button>
          <button class="nav-item" @click="navigateTo('icons')">
            <span class="nav-icon icon-icons">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/></svg>
            </span>
            <span>图标</span>
          </button>
        </nav>
      </aside>

      <!-- 右侧内容区 -->
      <main class="content-area">
        <!-- 欢迎页 -->
        <div class="welcome-content">
          <div class="welcome-logo">
            <svg viewBox="0 0 48 48" fill="none" width="64" height="64">
              <rect x="4" y="8" width="40" height="32" rx="4" stroke="#6c7ae0" stroke-width="2.5" fill="#f0f3fa"/>
              <path d="M14 22h8m-4-4v8m10-4h8" stroke="#6c7ae0" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="welcome-title">办公帮帮</h2>
          <p class="welcome-desc">AI 驱动的智能演示助手</p>
          <div class="quick-actions">
            <button class="quick-action-card" @click="navigateTo('generate')">
              <span class="quick-icon icon-generate">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </span>
              <span>一键生成 PPT</span>
            </button>
            <button class="quick-action-card" @click="navigateTo('aiimage')">
              <span class="quick-icon icon-image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </span>
              <span>AI 生图</span>
            </button>
            <button class="quick-action-card" @click="navigateTo('optimize')">
              <span class="quick-icon icon-optimize">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              </span>
              <span>内容优化</span>
            </button>
            <button class="quick-action-card" @click="navigateTo('layout')">
              <span class="quick-icon icon-layout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"/></svg>
              </span>
              <span>排版优化</span>
            </button>
          </div>
        </div>
      </main>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="taskpane-toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import GeneratePPT from './GeneratePPT.vue'
import OptimizeContent from './OptimizeContent.vue'
import { generateOutline, applyOutlineToPowerPoint, isOfficeContext } from '../modules/powerpoint-api'

// 页面状态：'home' | 'generate' | 'optimize' | 'aiimage' | 'layout' | 'template' | 'images' | 'icons'
const currentPage = ref<'home'>('home')
const currentNav = ref('')

// 从 URL 参数读取初始页面（Office Add-in 按钮点击时 URL 带 ?action=xxx）
function getInitialPageFromUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search)
    const action = params.get('action')
    if (action) {
      const pageMap: Record<string, string> = {
        'generate': 'generate',
        'aiimage': 'aiimage',
        'optimize-content': 'optimize',
        'optimize': 'optimize',
        'optimize-layout': 'layout',
        'layout': 'layout',
        'templates': 'template',
        'template': 'template',
        'images': 'images',
        'icons': 'icons',
        'sidebar': 'home',
      }
      return pageMap[action] || 'home'
    }
  } catch { /* ignore */ }
  return 'home'
}

// 初始化时根据 URL 参数跳转
onMounted(() => {
  const initialPage = getInitialPageFromUrl()
  if (initialPage !== 'home') {
    currentPage.value = initialPage as any
    currentNav.value = initialPage
  }
})
const generatePPTRef = ref<InstanceType<typeof GeneratePPT> | null>(null)
const optimizeContentRef = ref<InstanceType<typeof OptimizeContent> | null>(null)

// 子页面状态
const aiImagePrompt = ref('')
const aiImageLoading = ref(false)
const aiImageResult = ref('')
const layoutLoading = ref(false)

// Toast
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

// 导航
function navigateTo(page: typeof currentPage.value) {
  currentPage.value = page
  currentNav.value = page
}

// ===== 数据 =====

const templates = [
  { id: 1, name: '商务蓝', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 2, name: '简约白', color: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)' },
  { id: 3, name: '科技感', color: 'linear-gradient(135deg, #0c0c1d, #1a1a3e)' },
  { id: 4, name: '活力橙', color: 'linear-gradient(135deg, #f093fb, #f5576c)' },
]

const iconList = [
  { char: '\uD83D\uDCCA', name: '图表' }, { char: '\uD83D\uDCC8', name: '趋势' },
  { char: '\uD83D\uDCA1', name: '灵感' }, { char: '\uD83C\uDFAF', name: '目标' },
  { char: '\uD83D\uDE80', name: '启动' }, { char: '\u26A1', name: '闪电' },
  { char: '\uD83D\uDD14', name: '通知' }, { char: '\uD83D\uDCCB', name: '清单' },
  { char: '\u2705', name: '完成' }, { char: '\uD83D\uDD27', name: '工具' },
  { char: '\uD83C\uDFA8', name: '设计' }, { char: '\uD83D\uDCE6', name: '包裹' },
]

// ===== 功能处理 =====

async function handleGenerateOutline(data: {
  createType: string
  prompt: string
  pageCount: string
  language: string
  model: string
  images: string[]
}) {
  try {
    const pageCount = data.pageCount ? parseInt(data.pageCount) : undefined
    const outline = generateOutline(data.prompt, pageCount, data.language)

    if (isOfficeContext()) {
      showToast('正在写入 PowerPoint...', 'info')
      const result = await applyOutlineToPowerPoint(outline)
      showToast(result.message, result.success ? 'success' : 'error')
    } else {
      showToast(`已生成 ${outline.length} 页大纲`, 'info')
    }
    currentPage.value = 'home'
  } catch (e) {
    showToast('生成失败: ' + (e as Error).message, 'error')
  } finally {
    generatePPTRef.value?.setLoading(false)
  }
}

async function handleReplaceText(data: { original: string; optimized: string }) {
  try {
    if (!isOfficeContext()) {
      showToast('非 Office 环境，无法替换', 'info')
      return
    }

    const Office = (globalThis as any).Office
    const PowerPoint = Office.PowerPoint || (globalThis as any).PowerPoint
    const supports14 = !!Office.context.requirements?.isSetSupported?.('PowerPointApi', '1.4')

    if (supports14) {
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
              }
            } catch { /* skip */ }
          }
        }
      })
      showToast(replaced ? '已替换到幻灯片' : '未找到匹配文本', replaced ? 'success' : 'info')
    } else {
      showToast('请先选中包含要替换文本的文本框', 'info')
    }
  } catch (e) {
    showToast('替换失败: ' + (e as Error).message, 'error')
  } finally {
    optimizeContentRef.value?.setReplacing(false)
  }
}

function handleAIImageGenerate() {
  if (!aiImagePrompt.value.trim()) return
  aiImageLoading.value = true
  showToast('正在生成图片...', 'info')
  // TODO: 接入 AI 生图 API
  setTimeout(() => {
    aiImageLoading.value = false
    showToast('图片生成完成！', 'success')
  }, 2000)
}

function handleLayoutOptimize() {
  layoutLoading.value = true
  showToast('正在优化排版...', 'info')
  setTimeout(() => {
    layoutLoading.value = false
    showToast('排版优化完成！', 'success')
  }, 2000)
}

function handleApplyTemplate(tpl: { id: number; name: string }) {
  showToast(`正在应用模板: ${tpl.name}`, 'info')
}

function handleInsertIcon(icon: { char: string; name: string }) {
  showToast(`已选择图标: ${icon.name}`, 'info')
}
</script>

<style scoped>
/* ========== 布局 ========== */
.taskpane-root {
  height: 100vh;
  overflow: hidden;
  background: #fff;
  color: #333;
  font-family: 'Segoe UI', 'Microsoft YaHei', -apple-system, sans-serif;
}

.main-panel {
  display: flex;
  height: 100vh;
}

/* ========== 侧边栏 ========== */
.sidebar {
  width: 180px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #f8faff 0%, #eff3ff 100%);
  border-right: 1px solid #e4e9f2;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  padding: 16px 14px 12px;
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
  color: #4a6cf7;
  letter-spacing: 0.5px;
}

.nav-group-label {
  padding: 14px 14px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #aab0c0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13.5px;
  color: #555d7a;
  font-family: inherit;
  transition: all 0.15s ease;
  text-align: left;
  border-radius: 0;
}

.nav-item:hover {
  background: rgba(74, 108, 247, 0.08);
  color: #4a6cf7;
}

.nav-item.active {
  background: rgba(74, 108, 247, 0.1);
  color: #4a6cf7;
  font-weight: 600;
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon svg {
  width: 18px;
  height: 18px;
}

.icon-generate { color: #f56c6c; }
.icon-image { color: #e6a23c; }
.icon-optimize { color: #67c23a; }
.icon-layout { color: #409eff; }
.icon-template { color: #9b59b6; }
.icon-pictures { color: #17a2b8; }
.icon-icons { color: #e67e22; }

/* ========== 内容区 ========== */
.content-area {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
}

.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  min-height: 100%;
}

.welcome-logo {
  margin-bottom: 12px;
}

.welcome-title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.welcome-desc {
  font-size: 13px;
  color: #999;
  margin-bottom: 32px;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  max-width: 320px;
  width: 100%;
}

.quick-action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 12px;
  border: 1px solid #eef0f4;
  border-radius: 12px;
  background: #fafbfe;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  font-family: inherit;
}

.quick-action-card:hover {
  border-color: #d8def0;
  background: #f0f3fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.quick-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.quick-icon svg {
  width: 20px;
  height: 20px;
}

.quick-icon.icon-generate { background: rgba(245, 108, 108, 0.1); color: #f56c6c; }
.quick-icon.icon-image { background: rgba(230, 162, 60, 0.1); color: #e6a23c; }
.quick-icon.icon-optimize { background: rgba(103, 194, 58, 0.1); color: #67c23a; }
.quick-icon.icon-layout { background: rgba(64, 158, 255, 0.1); color: #409eff; }

/* ========== 子页面 ========== */
.sub-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.back-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.back-btn:hover { background: #eee; }
.back-btn svg { width: 16px; height: 16px; color: #555; }

.page-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
}

.info-text {
  font-size: 13px;
  color: #888;
  line-height: 1.6;
  margin-bottom: 16px;
}

.form-section { margin-top: 8px; }

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #444;
  margin-bottom: 8px;
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
}

.form-textarea:focus { border-color: #4a6cf7; }

.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  background: #4a6cf7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  font-family: inherit;
  margin-top: 12px;
}

.primary-btn:hover { opacity: 0.9; }
.primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.result-section { margin-top: 20px; }
.result-image { max-width: 100%; border-radius: 8px; border: 1px solid #eee; }

/* ========== 模板网格 ========== */
.template-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.template-card {
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #eef0f4;
  transition: all 0.2s;
}

.template-card:hover { border-color: #d0d5e0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }

.template-thumb { height: 90px; }
.template-name {
  padding: 8px;
  font-size: 12.5px;
  color: #555;
  text-align: center;
  background: #fafafa;
  font-weight: 500;
}

/* ========== 图片网格 ========== */
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.image-placeholder {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f5f7fa;
  border: 1px solid #eef0f4;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 11px;
  color: #aaa;
}

.image-placeholder:hover { border-color: #4a6cf7; background: #f0f3ff; }
.image-placeholder svg { width: 28px; height: 28px; color: #ccc; }

/* ========== 图标网格 ========== */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 4px;
  background: #f8f9fc;
  border: 1px solid #eef0f4;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-item:hover { background: #eef1f8; transform: scale(1.05); border-color: #d0d5e0; }

.icon-char { font-size: 24px; line-height: 1; }
.icon-name { font-size: 11px; color: #777; }

/* ========== Toast ========== */
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

.taskpane-toast.info { background: #ecf5ff; color: #409eff; border: 1px solid #d9ecff; }
.taskpane-toast.success { background: #f0f9eb; color: #67c23a; border: 1px solid #e1f3d8; }
.taskpane-toast.error { background: #fef0f0; color: #f56c6c; border: 1px solid #fde2e2; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }
</style>
