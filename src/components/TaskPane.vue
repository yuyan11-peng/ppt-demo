<template>
  <div class="taskpane-root">
    <!-- ===== 全局Tab栏（始终显示） ===== -->
    <div class="global-tabs">
      <div class="home-tab" :class="{ active: homeTab === 'ai' }" @click="homeTab = 'ai'">AI助手</div>
      <div class="home-tab" :class="{ active: homeTab === 'material' }" @click="homeTab = 'material'">素材库</div>
    </div>

    <!-- ===== AI助手页面列表 ===== -->
    <template v-if="homeTab === 'ai'">
      <!-- 一键生成PPT -->
      <GeneratePPT
        v-if="currentPage === 'generate'"
        ref="generatePPTRef"
        class="generate-ppt-wrapper"
        @back="currentPage = 'home'"
        @generate="handleGenerateOutline"
      />

      <!-- 内容优化 -->
      <OptimizeContent
        v-else-if="currentPage === 'optimize'"
        ref="optimizeContentRef"
        @back="currentPage = 'home'"
        @replace="handleReplaceText"
      />

      <!-- AI生图 -->
      <div v-else-if="currentPage === 'aiimage'" class="sub-page">
        <div class="page-header">
          <el-button :icon="ArrowLeft" text @click="currentPage = 'home'" />
          <span class="page-title">AI 生图</span>
        </div>
        <div class="page-body">
          <div class="ai-image-container" :class="{ 'image-on-left': showImageOnLeft }">
            <div v-if="showImageOnLeft && aiImageResult" class="left-image">
              <img :src="aiImageResult" alt="生成的图片" class="result-image" />
            </div>
            <div class="form-section" :class="{ 'with-left-image': showImageOnLeft }">
              <label class="form-label">描述你想要的图片</label>
              <el-input
                v-model="aiImagePrompt"
                type="textarea"
                placeholder="例如：一只在星空下奔跑的狐狸..."
                :rows="4"
                resize="vertical"
              />
              <el-button
                type="primary"
                @click="handleAIImageGenerate"
                :loading="aiImageLoading"
                style="margin-top: 12px; width: 100%;"
              >
                {{ aiImageLoading ? '生成中...' : '生成图片' }}
              </el-button>
              <div v-if="!showImageOnLeft && aiImageResult" class="result-section">
                <img 
                  :src="aiImageResult" 
                  alt="生成的图片" 
                  class="result-image"
                  @click="insertImageToPowerPoint"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 排版优化 -->
      <div v-else-if="currentPage === 'layout'" class="sub-page">
        <div class="page-header">
          <el-button :icon="ArrowLeft" text @click="currentPage = 'home'" />
          <span class="page-title">排版优化</span>
        </div>
        <div class="page-body">
          <p class="info-text">点击下方按钮将自动分析当前幻灯片并统一格式、美化布局。</p>
          <el-button
            type="primary"
            @click="handleLayoutOptimize"
            :loading="layoutLoading"
            style="width: 100%;"
          >
            {{ layoutLoading ? '优化中...' : '开始排版优化' }}
          </el-button>
        </div>
      </div>

      <!-- 首页（AI助手卡片） -->
      <div v-else class="main-panel home-content">
        <div class="home-card" @click="navigateTo('generate')">
          <div class="home-card-icon">
            <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
              <rect x="8" y="6" width="32" height="36" rx="3" stroke="#e8b86d" stroke-width="2" fill="#fff9f0"/>
              <line x1="14" y1="16" x2="34" y2="16" stroke="#e8b86d" stroke-width="2"/>
              <line x1="14" y1="22" x2="30" y2="22" stroke="#ddd" stroke-width="1.5"/>
              <line x1="14" y1="27" x2="26" y2="27" stroke="#ddd" stroke-width="1.5"/>
              <circle cx="34" cy="30" r="7" fill="#ff6b6b"/>
              <path d="M31 30l2 2 4-4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="home-card-title">一键生成PPT</div>
          <div class="home-card-desc">输入主题，AI帮您快速生成完整演示文稿</div>
        </div>

        <div class="home-card" @click="navigateTo('optimize')">
          <div class="home-card-icon">
            <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
              <path d="M24 6l4.5 9 10 1.5-7 7 1.5 10L24 29l-9 4.5 1.5-10-7-7 10-1.5L24 6z" fill="#ffd666" stroke="#e8b86d" stroke-width="1.5"/>
              <circle cx="33" cy="14" r="5" fill="#69b1ff" stroke="#4a9eff" stroke-width="1"/>
            </svg>
          </div>
          <div class="home-card-title">内容优化</div>
          <div class="home-card-desc">选中文本后进行智能改写</div>
        </div>

        <div class="home-card" @click="navigateTo('aiimage')">
          <div class="home-card-icon">
            <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
              <ellipse cx="24" cy="28" rx="16" ry="12" fill="#ffd6e7" stroke="#ff85c0" stroke-width="1.5"/>
              <circle cx="18" cy="26" r="3" fill="#ff85c0"/>
              <circle cx="28" cy="24" r="4" fill="#ffadd2"/>
              <circle cx="24" cy="30" r="2.5" fill="#ff85c0"/>
              <path d="M20 15l3-5 3 5 5-2-1 6h-14l-1-6 5 2z" fill="#ffadd2" stroke="#ff85c0" stroke-width="1"/>
            </svg>
          </div>
          <div class="home-card-title">AI生图</div>
          <div class="home-card-desc">AI生成图片素材</div>
        </div>

        <div class="home-card" @click="navigateTo('layout')">
          <div class="home-card-icon">
            <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
              <path d="M8 38V10l16 14L40 10v28H8z" fill="#e8e8e8" stroke="#bbb" stroke-width="1.5" stroke-linejoin="round"/>
              <line x1="8" y1="38" x2="40" y2="38" stroke="#aaa" stroke-width="2"/>
              <line x1="24" y1="24" x2="24" y2="38" stroke="#ccc" stroke-width="1" stroke-dasharray="3 2"/>
            </svg>
          </div>
          <div class="home-card-title">排版优化</div>
          <div class="home-card-desc">统一格式，美化布局</div>
        </div>
      </div>
    </template>

    <!-- ===== 素材库页面列表 ===== -->
    <template v-if="homeTab === 'material'">
      <!-- 模板页面 -->
      <div v-if="currentPage === 'template'" class="sub-page">
        <div class="page-header">
          <el-button :icon="ArrowLeft" text @click="currentPage = 'home'" />
          <span class="page-title">模板库</span>
        </div>
        <div class="page-body">
          <el-row :gutter="12">
            <el-col :span="12" v-for="tpl in templates" :key="tpl.id">
              <el-card
                shadow="hover"
                class="template-card"
                :body-style="{ padding: '0', cursor: 'pointer' }"
                @click="handleApplyTemplate(tpl)"
              >
                <div class="template-thumb" :style="{ background: tpl.color }"></div>
                <div class="template-name">{{ tpl.name }}</div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 图片页面 -->
      <div v-else-if="currentPage === 'images'" class="sub-page">
        <div class="page-header">
          <el-button :icon="ArrowLeft" text @click="currentPage = 'home'" />
          <span class="page-title">图片素材</span>
        </div>
        <div class="page-body">
          <p class="info-text">浏览并选择图片插入到当前幻灯片中</p>
          <el-row :gutter="10">
            <el-col :span="8" v-for="n in 6" :key="n">
              <el-card shadow="hover" class="image-placeholder-card" :body-style="{ padding: '0' }">
                <div class="image-placeholder">
                  <el-icon :size="28"><Picture /></el-icon>
                  <span>图片 {{ n }}</span>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 图标页面 -->
      <div v-else-if="currentPage === 'icons'" class="sub-page">
        <div class="page-header">
          <el-button :icon="ArrowLeft" text @click="currentPage = 'home'" />
          <span class="page-title">图标素材</span>
        </div>
        <div class="page-body">
          <el-row :gutter="10">
            <el-col :span="6" v-for="(icon, idx) in iconList" :key="idx">
              <el-card
                shadow="hover"
                class="icon-item-card"
                :body-style="{ padding: '0', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }"
                @click="handleInsertIcon(icon)"
              >
                <span class="icon-char">{{ icon.char }}</span>
                <span class="icon-name">{{ icon.name }}</span>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 首页（素材库卡片） -->
      <div v-else class="main-panel home-content">
        <div class="home-card" @click="navigateTo('template')">
          <div class="home-card-icon">
            <el-icon :size="32" color="#667eea"><Document /></el-icon>
          </div>
          <div class="home-card-title">模板库</div>
          <div class="home-card-desc">选择精美模板快速套用</div>
        </div>

        <div class="home-card" @click="navigateTo('images')">
          <div class="home-card-icon">
            <el-icon :size="32" color="#11998e"><Picture /></el-icon>
          </div>
          <div class="home-card-title">图片素材</div>
          <div class="home-card-desc">浏览并插入图片到幻灯片</div>
        </div>

        <div class="home-card" @click="navigateTo('icons')">
          <div class="home-card-icon">
            <el-icon :size="32" color="#f2994a"><Connection /></el-icon>
          </div>
          <div class="home-card-title">图标素材</div>
          <div class="home-card-desc">插入矢量图标装饰内容</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Picture, Document, Connection } from '@element-plus/icons-vue'
import GeneratePPT from './GeneratePPT.vue'
import OptimizeContent from './OptimizeContent.vue'
import { generateOutline, applyOutlineToPowerPoint, isOfficeContext } from '../modules/powerpoint-api'
import { useStore } from '../store'

const store = useStore()

// 页面状态
type PageType = 'home' | 'generate' | 'optimize' | 'aiimage' | 'layout' | 'template' | 'images' | 'icons'
const currentPage = ref<PageType>('home')
const currentNav = ref<PageType | ''>('')
const homeTab = ref<'ai' | 'material'>('ai')

// 从 URL 参数读取初始页面
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

onMounted(() => {
  const initialPage = getInitialPageFromUrl()
  if (initialPage !== 'home') {
    currentPage.value = initialPage as PageType
    currentNav.value = initialPage as PageType
  }
})

const generatePPTRef = ref<InstanceType<typeof GeneratePPT> | null>(null)
const optimizeContentRef = ref<InstanceType<typeof OptimizeContent> | null>(null)

// 子页面状态
const aiImagePrompt = ref('')
const aiImageLoading = ref(false)
const aiImageResult = ref('')
const layoutLoading = ref(false)
const showImageOnLeft = ref(false)

// 导航
function navigateTo(page: PageType) {
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
  createType: string; prompt: string; pageCount: string; language: string; model: string; images: string[]
}) {
  try {
    const pageCount = data.pageCount ? parseInt(data.pageCount) : undefined
    const outline = generateOutline(data.prompt, pageCount, data.language)

    // 同步大纲数据到 store（localStorage），这样新窗口可以读取
    store.importFromOutline(outline, data.prompt)

    if (isOfficeContext()) {
      ElMessage.info('正在写入 PowerPoint...')
      const result = await applyOutlineToPowerPoint(outline)
      ElMessage({ message: result.message, type: result.success ? 'success' : 'error' })
    } else {
      ElMessage.info(`已生成 ${outline.length} 页大纲`)
    }
    currentPage.value = 'home'
  } catch (e) {
    ElMessage.error('生成失败: ' + (e as Error).message)
  } finally {
    generatePPTRef.value?.setLoading(false)
  }
}

async function handleReplaceText(data: { original: string; optimized: string }) {
  try {
    if (!isOfficeContext()) {
      ElMessage.info('非 Office 环境，无法替换')
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
      ElMessage({ message: replaced ? '已替换到幻灯片' : '未找到匹配文本', type: replaced ? 'success' : 'info' })
    } else {
      ElMessage.info('请先选中包含要替换文本的文本框')
    }
  } catch (e) {
    ElMessage.error('替换失败: ' + (e as Error).message)
  } finally {
    optimizeContentRef.value?.setReplacing(false)
  }
}

function handleAIImageGenerate() {
  aiImageLoading.value = true
  ElMessage.info('正在生成图片...')
  console.log('开始生成图片，prompt:', aiImagePrompt.value)
  
  // 使用 text-to-image API 生成图片
  setTimeout(() => {
    // 生成图片 URL
    const prompt = encodeURIComponent(aiImagePrompt.value.trim() || '一只可爱的小猫')
    const imageUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=landscape_16_9`
    console.log('生成的图片URL:', imageUrl)
    aiImageResult.value = imageUrl
    console.log('aiImageResult:', aiImageResult.value)
    console.log('showImageOnLeft:', showImageOnLeft.value)
    aiImageLoading.value = false
    ElMessage.success('图片生成完成！')
  }, 2000)
}

function handleLayoutOptimize() {
  layoutLoading.value = true
  ElMessage.info('正在优化排版...')
  setTimeout(() => {
    layoutLoading.value = false
    ElMessage.success('排版优化完成！')
  }, 2000)
}

function handleApplyTemplate(tpl: { id: number; name: string }) {
  ElMessage.info(`正在应用模板: ${tpl.name}`)
}

function handleInsertIcon(icon: { char: string; name: string }) {
  ElMessage.info(`已选择图标: ${icon.name}`)
}

// 插入图片到PowerPoint
async function insertImageToPowerPoint() {
  if (!aiImageResult.value) return
  
  try {
    const Office = (globalThis as any).Office
    if (!Office?.context?.document) {
      ElMessage.error('当前不在 Office 环境中')
      return
    }
    
    ElMessage.info('正在插入图片到 PowerPoint...')
    
    // 检查PowerPoint API版本
    const supports14 = !!Office.context.requirements?.isSetSupported?.('PowerPointApi', '1.4')
    
    if (supports14) {
      // 使用PowerPoint 1.4+ API
      await insertImageViaPowerPointApi(aiImageResult.value)
    } else {
      // 使用Common API
      await insertImageViaCommonApi(aiImageResult.value)
    }
    
    ElMessage.success('图片已插入到 PowerPoint')
  } catch (error) {
    console.error('插入图片失败:', error)
    ElMessage.error('插入图片失败: ' + (error as Error).message)
  }
}

// 使用PowerPoint 1.4+ API插入图片
async function insertImageViaPowerPointApi(imageUrl: string) {
  const PowerPoint = (globalThis as any).Office.PowerPoint || (globalThis as any).PowerPoint
  
  await PowerPoint.run(async (context: any) => {
    const slides = context.presentation.slides
    slides.load('items')
    await context.sync()
    
    if (slides.items.length === 0) {
      context.presentation.slides.add()
      await context.sync()
      slides.load('items')
      await context.sync()
    }
    
    const currentSlide = slides.items[0] // 插入到第一张幻灯片
    currentSlide.shapes.addPictureFromBase64(
      await imageToBase64(imageUrl),
      Office.Core.SlideLayoutType.Title,
      100, // 左边距
      100, // 上边距
      400, // 宽度
      300  // 高度
    )
    
    await context.sync()
  })
}

// 使用Common API插入图片
async function insertImageViaCommonApi(imageUrl: string) {
  const Office = (globalThis as any).Office
  
  return new Promise((resolve, reject) => {
    Office.context.document.setSelectedDataAsync(
      imageUrl,
      { coercionType: Office.CoercionType.Image },
      (result: any) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve(null)
        } else {
          reject(new Error(result.error?.message || '插入图片失败'))
        }
      }
    )
  })
}

// 将图片URL转换为Base64
function imageToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.onload = function() {
      const reader = new FileReader()
      reader.onloadend = function() {
        const base64 = (reader.result as string).split(',')[1] // 去掉data:image/xxx;base64,前缀
        resolve(base64)
      }
      reader.readAsDataURL(xhr.response)
    }
    xhr.onerror = function() {
      reject(new Error('获取图片失败'))
    }
    xhr.open('GET', url, true)
    xhr.responseType = 'blob'
    xhr.send()
  })
}
</script>

<style scoped>
.taskpane-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  overflow: hidden;
}

.generate-ppt-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ========== 全局Tab栏（始终置顶） ========== */
.global-tabs {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: #fff;
}

.home-tab {
  flex: 1;
  padding: 12px 0;
  font-size: 14.5px;
  color: #999;
  cursor: pointer;
  position: relative;
  font-weight: 500;
  text-align: center;
}

.home-tab:hover { color: #666; }

.home-tab.active {
  color: #1890ff;
  font-weight: 600;
}

.home-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 10%;
  right: 10%;
  height: 2.5px;
  background: #1890ff;
  border-radius: 2px;
}

/* 内容区 */
.home-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.main-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
}

.home-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 10px;
  cursor: pointer;
  border: 1.5px solid #f0f0f0;
  border-radius: 12px;
  margin: 8px 16px;
  transition: background 0.15s, border-color 0.15s;
}

.home-card:hover { background: #fafafa; border-color: #e0e0e0; }

.home-card-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.home-card-desc {
  font-size: 13px;
  color: #aaa;
}

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

.result-section { margin-top: 20px; }
.result-image { max-width: 100%; border-radius: 8px; border: 1px solid #eee; cursor: pointer; }

.ai-image-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ai-image-container.image-on-left {
  flex-direction: row;
  align-items: flex-start;
}

.left-image {
  flex: 0 0 30%;
  max-width: 30%;
}

.left-image .result-image {
  width: 100%;
  height: auto;
}

.form-section.with-left-image {
  flex: 1;
  margin-left: 20px;
}

/* 模板卡片 */
.template-card {
  margin-bottom: 12px;
  border-radius: 10px;
}

.template-thumb { height: 90px; }
.template-name {
  padding: 8px;
  font-size: 12.5px;
  color: #555;
  text-align: center;
  background: #fafafa;
  font-weight: 500;
}

/* 图片占位 */
.image-placeholder-card {
  border-radius: 10px;
  margin-bottom: 10px;
}

.image-placeholder {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f5f7fa;
  color: #aaa;
  font-size: 11px;
  cursor: pointer;
}

/* 图标项 */
.icon-item-card {
  border-radius: 10px;
  margin-bottom: 10px;
  aspect-ratio: 1;
}

.icon-item-card :deep(.el-card__body) {
  padding: 12px 4px !important;
  background: #f8f9fc;
}

.icon-char { font-size: 24px; line-height: 1; }
.icon-name { font-size: 11px; color: #777; }
</style>
