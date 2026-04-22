<template>
  <div class="generate-ppt">
    <!-- 顶部导航 -->
    <div class="nav-header">
      <el-button text @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <span class="nav-title">一键生成PPT</span>
    </div>

    <!-- ========== 第一步：输入主题 ========== -->
    <template v-if="step === 1">
      <div class="step-header">
        <el-tag round type="primary" effect="dark" size="small" class="step-badge">1</el-tag>
        <span class="step-title">输入主题</span>
      </div>

      <div class="form-content">
        <!-- 创作类型 -->
        <div class="form-group">
          <label class="form-label">创作类型</label>
          <el-row :gutter="10">
            <el-col :span="12">
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
                  <el-radio :model-value="createType" value="scratch" @change="createType = 'scratch'" />
                </div>
              </div>
            </el-col>
            <el-col :span="12">
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
                  <el-radio :model-value="createType" value="continue" @change="createType = 'continue'" />
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 主题/提示词 -->
        <div class="form-group">
          <label class="form-label">
            主题/提示词
            <span v-if="createType === 'scratch'" class="required-mark">*</span>
          </label>
          <el-input
            v-model="prompt"
            type="textarea"
            :rows="4"
            placeholder="请输入您想要制作的PPT主题，例如：产品发布会、季度总结报告等"
            maxlength="500"
            show-word-limit
            resize="none"
          />
          <div v-if="uploadedImages.length > 0" class="uploaded-images">
            <div v-for="(img, index) in uploadedImages" :key="index" class="uploaded-image-item">
              <img :src="img" alt="uploaded" />
              <el-button class="remove-image-btn" circle size="small" @click="removeImage(index)">
                <el-icon :size="10"><Close /></el-icon>
              </el-button>
            </div>
          </div>
          <el-button class="upload-btn" text @click="handleUploadImage">
            <el-icon><Plus /></el-icon>
            上传图片
          </el-button>
        </div>

        <!-- 页数 -->
        <div class="form-group">
          <label class="form-label">页数（可选）</label>
          <el-input v-model="pageCount" placeholder="不填写将自动生成合适的页数" @input="handlePageCountInput" />
        </div>

        <!-- 语言 -->
        <div class="form-group">
          <label class="form-label">语言</label>
          <el-select v-model="language" style="width: 100%">
            <el-option label="中文" value="zh" />
            <el-option label="English" value="en" />
            <el-option label="日本語" value="ja" />
            <el-option label="한국어" value="ko" />
          </el-select>
        </div>

        <!-- 模型选择 -->
        <div class="form-group">
          <label class="form-label">模型选择</label>
          <el-select v-model="model" style="width: 100%">
            <el-option label="GPT-4" value="gpt-4" />
            <el-option label="GPT-3.5" value="gpt-3.5" />
            <el-option label="Claude" value="claude" />
            <el-option label="DeepSeek" value="deepseek" />
          </el-select>
        </div>
      </div>

      <!-- 生成大纲按钮 -->
      <div class="action-bar">
        <el-button
          type="primary"
          size="large"
          class="generate-btn"
          :loading="loading"
          :disabled="createType === 'scratch' && !prompt.trim()"
          @click="handleGenerate"
        >
          生成大纲
        </el-button>
      </div>
    </template>

    <!-- ========== 第二步：编辑大纲 ========== -->
    <template v-if="step === 2">
      <div class="step-header">
        <el-tag round type="primary" effect="dark" size="small" class="step-badge">2</el-tag>
        <span class="step-title">编辑大纲</span>
      </div>

      <div class="step2-container">
        <!-- Tab 栏 -->
        <el-tabs v-model="subTab" class="outline-tabs">
          <el-tab-pane label="大纲结构" name="outline" />
          <el-tab-pane label="页面内容" name="content" />
        </el-tabs>

        <!-- Tab 内容：大纲结构 -->
        <div v-if="subTab === 'outline'" class="tab-panel outline-panel">
          <!-- 大纲卡片列表 - 灰色背景 -->
          <div class="outline-list">
            <!-- 大纲标题 + 添加页面按钮 -->
            <div class="outline-header">
              <span class="outline-header-title">PPT大纲</span>
              <el-button size="small" class="add-page-btn" @click="handleAddPage">
                + 添加页面
              </el-button>
            </div>

            <div
              v-for="(item, index) in outlineList"
              :key="index"
              class="outline-card"
              :class="{ selected: selectedPage === index }"
              @click="handleOutlineClick(index)"
            >
              <!-- 卡片头部 -->
              <div class="outline-card-head">
                <!-- 标题 - 可编辑 -->
                <el-input
                  v-if="editingIndex === index && editingField === 'title'"
                  v-model="item.title"
                  size="small"
                  class="outline-title-input"
                  @blur="finishEdit"
                  @keydown.enter="finishEdit"
                  @click.stop
                />
                <span v-else class="outline-card-title" @dblclick.stop="startEditTitle(index)">
                  {{ item.title || '未命名' }}
                </span>
                <!-- 操作按钮组：仅删除 -->
                <div class="outline-actions" @click.stop>
                  <el-tooltip content="删除此页" placement="top" :show-after="500">
                    <el-button text size="small" class="action-icon-btn delete-action" @click="handleDeletePageAt(index)">
                      <el-icon color="#f56c6c"><Close /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>

              <!-- 子内容列表 -->
              <div class="outline-card-body">
                <div class="child-list">
                  <div v-for="(child, cIdx) in item.children" :key="cIdx" class="child-item">
                    <span class="child-dot"></span>
                    <!-- 子项可编辑 -->
                    <el-input
                      v-if="editingIndex === index && editingChildIdx === cIdx"
                      v-model="item.children[cIdx]"
                      size="small"
                      class="child-input"
                      @blur="finishEdit"
                      @keydown.enter="finishEdit"
                      @click.stop
                    />
                    <span v-else class="child-text" @dblclick.stop="startEditChild(index, cIdx)">{{ child }}</span>
                    <el-button
                      v-if="item.children.length > 1"
                      text
                      size="small"
                      class="child-remove-btn"
                      @click.stop="removeChildItem(index, cIdx)"
                    >
                      <el-icon :size="10"><Close /></el-icon>
                    </el-button>
                  </div>

                </div>
              </div>

              <!-- 右下角斜线拖拽手柄 -->
              <div class="drag-handle" title="拖拽排序">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <line x1="10" y1="3" x2="5" y2="8" stroke="#999" stroke-width="2" stroke-linecap="round"/>
                  <line x1="13" y1="6" x2="8" y2="11" stroke="#999" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 内容：页面内容 -->
        <div v-if="subTab === 'content'" class="tab-panel content-panel">
          <div class="form-group">
            <label class="form-label">选择页面</label>
            <el-select v-model="selectedPage" style="width: 100%">
              <el-option
                v-for="(item, idx) in outlineList"
                :key="idx"
                :label="`第 ${idx + 1} 页 - ${item.title || '未命名'}`"
                :value="idx"
              />
            </el-select>
          </div>

          <div class="content-editor-card">
            <div class="form-group">
              <label class="form-label">页面标题</label>
              <el-input v-model="currentPageTitle" placeholder="请输入页面标题" @input="syncContentToOutline" />
            </div>

            <div class="form-group">
              <label class="form-label">页面布局</label>
              <el-radio-group v-model="currentLayout" class="layout-radio-group">
                <el-radio-button v-for="(layout, lIdx) in layoutOptions" :key="lIdx" :value="lIdx" class="layout-radio-btn">
                  <div class="layout-option-inner">
                    <div class="layout-icon" v-html="layout.icon"></div>
                    <span>{{ layout.label }}</span>
                  </div>
                </el-radio-button>
              </el-radio-group>
            </div>

            <div class="form-group">
              <div class="content-label-row">
                <label class="form-label">页面内容</label>
                <el-button size="small" type="info" @click="handleAiGenerate">AI生成内容</el-button>
              </div>
              <el-input
                v-model="currentPageContent"
                type="textarea"
                :rows="8"
                placeholder="请输入或通过AI生成页面内容...&#10;每行一个子项，将自动同步到大纲结构"
                resize="vertical"
                @input="syncContentToOutline"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="action-bar-step2">
        <el-button size="large" class="gray-btn" @click="step = 1">上一步</el-button>
        <el-button size="large" class="gray-btn" @click="handleRegenerate" :loading="loading">重新生成</el-button>
        <el-button type="primary" size="large" @click="handleSelectTemplate">选择模板</el-button>
      </div>
    </template>

    <!-- ========== 第三步：选择模板 ========== -->
    <template v-if="step === 3">
      <div class="step-header">
        <el-tag round type="primary" effect="dark" size="small" class="step-badge">3</el-tag>
        <span class="step-title">选择模板</span>
      </div>

      <div class="step3-container">
        <!-- 标题 + 换一批 -->
        <div class="template-header">
          <span class="template-header-title">选择模板</span>
          <el-button text size="small" class="refresh-btn" @click="handleRefreshTemplates">
            <el-icon><Refresh /></el-icon>
            换一批
          </el-button>
        </div>

        <!-- 模板列表 -->
        <div class="template-list">
          <div
            v-for="(tpl, idx) in templateList"
            :key="tpl.id"
            class="template-row"
            @click="handleSelectTemplateItem(tpl.id)"
          >
            <!-- 模板卡片 -->
            <div class="template-card" :class="{ selected: selectedTemplate === tpl.id }">
              <!-- 模板预览 -->
              <div class="template-preview" :style="{ background: tpl.color }">
                <div class="preview-sidebar" :style="{ background: tpl.color, filter: 'brightness(0.8)' }">
                  <div class="preview-line long"></div>
                  <div class="preview-line medium"></div>
                  <div class="preview-line short"></div>
                </div>
                <div class="preview-main">
                  <div class="preview-line long" style="opacity:0.3"></div>
                  <div class="preview-line medium" style="opacity:0.2"></div>
                  <div class="preview-line short" style="opacity:0.15"></div>
                </div>
                <!-- 翻页控制 -->
                <div class="template-page-control">
                  <button class="page-arrow" @click.stop="prevTemplatePage(idx)">
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M7 1L3 5L7 9" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                  </button>
                  <span class="page-indicator">{{ tpl.currentPage }} / {{ tpl.pageCount }}</span>
                  <button class="page-arrow" @click.stop="nextTemplatePage(idx)">
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 1L7 5L3 9" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                  </button>
                </div>
              </div>
              <!-- 模板名称 -->
              <div class="template-name">{{ tpl.name }}</div>
            </div>
            <!-- 右侧圆圈 -->
            <span class="template-check" :class="{ checked: selectedTemplate === tpl.id }">
              <svg v-if="selectedTemplate === tpl.id" width="12" height="12" viewBox="0 0 12 12"><path d="M3 6L5.5 8.5L9 3.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
          </div>
        </div>

        <!-- 随机选择按钮（属于内容区域） -->
        <div
          class="random-select-row"
          :class="{ selected: selectedTemplate === 'random' }"
          @click="selectedTemplate = 'random'"
        >
          <span class="random-text">你帮我选！（随机生成）</span>
          <span class="template-check" :class="{ checked: selectedTemplate === 'random' }">
            <svg v-if="selectedTemplate === 'random'" width="12" height="12" viewBox="0 0 12 12"><path d="M3 6L5.5 8.5L9 3.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="action-bar-step3">
        <el-button size="large" class="gray-btn" @click="step = 2">上一步</el-button>
        <el-button type="primary" size="large" @click="handleGeneratePPT">生成PPT</el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ArrowLeft, Plus, Close, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { applyOutlineToPowerPoint, isOfficeContext } from '../modules/powerpoint-api'

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
const step = ref(1)
const subTab = ref<'outline' | 'content'>('outline')

const createType = ref<'scratch' | 'continue'>('scratch')
const prompt = ref('')
const pageCount = ref('')
const language = ref('zh')
const model = ref('gpt-4')
const uploadedImages = ref<string[]>([])

// 监听鼠标选中文本事件
function handleTextSelection() {
  try {
    const Office = (globalThis as any).Office
    if (!Office?.context?.document) return
    Office.context.document.getSelectedDataAsync(
      Office.CoercionType.Text,
      (asyncResult: any) => {
        if (asyncResult.status === Office.AsyncResultStatus.Succeeded && asyncResult.value) {
          const selectedText = asyncResult.value.trim()
          if (selectedText) prompt.value = selectedText
        }
      }
    )
  } catch (error) {
    console.error('获取选中文本失败:', error)
  }
}

onMounted(() => { document.addEventListener('mouseup', handleTextSelection) })
onUnmounted(() => { document.removeEventListener('mouseup', handleTextSelection) })

// 大纲数据
interface OutlineItem {
  title: string
  children: string[]
  expanded: boolean
}

// 初始为空列表，生成时根据页数填充
const outlineList = ref<OutlineItem[]>([])
const selectedPage = ref(0)

// 编辑状态
const editingIndex = ref(-1)
const editingChildIdx = ref(-1)
const editingField = ref<'title' | 'child'>('title')

// 当前页面编辑数据
const currentPageTitle = ref('')
const currentPageContent = ref('')
const currentLayout = ref(0)

/** 根据页数生成大纲 */
function generateOutline(count: number): OutlineItem[] {
  const defaultTitles = ['封面页', '目录', '背景介绍', '核心内容', '解决方案', '总结展望',
    '数据分析', '实施计划', '风险应对', '成果展示', '团队介绍', '未来规划',
    '技术架构', '产品演示', '竞品对比', '用户反馈', '市场策略', '运营方案',
    '成本预算', '问答环节']
  const defaultChildren: string[][] = [
    ['标题：' + (prompt.value || '演示文稿'), '副标题：专业演示'],
    ['背景介绍', '核心内容', '解决方案', '总结展望'],
    ['项目背景', '市场现状', '面临挑战'],
    ['主要特点', '技术优势', '应用场景'],
    ['实施方案', '预期效果', '风险控制'],
    ['项目总结', '未来规划', '谢谢观看'],
    ['核心数据', '趋势分析', '对比图表'],
    ['阶段划分', '关键节点', '资源分配'],
    ['风险识别', '应对策略', '预案准备'],
    ['里程碑', '核心成果', '关键指标'],
    ['组织架构', '核心成员', '职责分工'],
    ['短期目标', '中期规划', '长期愿景'],
  ]
  const list: OutlineItem[] = []
  for (let i = 0; i < count; i++) {
    list.push({
      title: defaultTitles[i] || `第 ${i + 1} 页`,
      children: defaultChildren[i] || ['内容项1', '内容项2'],
      expanded: true,
    })
  }
  return list
}

// 切换页面时同步数据
watch(selectedPage, (newIdx, oldIdx) => {
  if (outlineList.value[oldIdx]) {
    outlineList.value[oldIdx].title = currentPageTitle.value
    outlineList.value[oldIdx].children = currentPageContent.value.split('\n').filter(s => s.trim())
  }
  if (outlineList.value[newIdx]) {
    currentPageTitle.value = outlineList.value[newIdx].title || ''
    currentPageContent.value = outlineList.value[newIdx].children.join('\n')
  }
})

/** 页面内容实时同步到大纲结构 */
function syncContentToOutline() {
  const idx = selectedPage.value
  if (outlineList.value[idx]) {
    outlineList.value[idx].title = currentPageTitle.value
    outlineList.value[idx].children = currentPageContent.value.split('\n').filter(s => s.trim())
  }
}

// 布局选项
const layoutOptions = [
  { label: '纯文字', icon: '<div style="width:36px;height:26px;border:1.5px solid #d9d9d9;border-radius:4px;display:flex;align-items:center;justify-content:center;padding:3px;"><div style="width:100%;height:4px;background:#d9d9d9;border-radius:2px;margin-bottom:3px;"></div><div style="width:80%;height:4px;background:#d9d9d9;border-radius:2px;margin-bottom:3px;"></div><div style="width:60%;height:4px;background:#d9d9d9;border-radius:2px;"></div></div>' },
  { label: '图文混排', icon: '<div style="width:36px;height:26px;border:1.5px solid #d9d9d9;border-radius:4px;display:flex;padding:3px;gap:3px;"><div style="flex:0 0 13px;background:#e8e8e8;border-radius:3px;"></div><div style="flex:1;display:flex;flex-direction:column;gap:2px;"><div style="width:100%;height:3px;background:#d9d9d9;border-radius:1px;"></div><div style="width:70%;height:3px;background:#d9d9d9;border-radius:1px;"></div></div></div>' },
  { label: '左右分栏', icon: '<div style="width:36px;height:26px;border:1.5px solid #d9d9d9;border-radius:4px;display:flex;padding:3px;gap:3px;"><div style="flex:1;border-right:1.5px solid #eee;padding-right:3px;display:flex;flex-direction:column;gap:2px;"><div style="width:100%;height:3px;background:#d9d9d9;border-radius:1px;"></div><div style="width:60%;height:3px;background:#d9d9d9;border-radius:1px;"></div></div><div style="flex:1;display:flex;flex-direction:column;gap:2px;"><div style="width:100%;height:3px;background:#d9d9d9;border-radius:1px;"></div><div style="width:60%;height:3px;background:#d9d9d9;border-radius:1px;"></div></div></div>' },
]

function handleBack() {
  if (step.value === 2) { step.value = 1 } else { emit('back') }
}

function handleOutlineClick(index: number) {
  selectedPage.value = index
}

function startEditTitle(index: number) {
  editingIndex.value = index
  editingChildIdx.value = -1
  editingField.value = 'title'
}

function startEditChild(index: number, cIdx: number) {
  editingIndex.value = index
  editingChildIdx.value = cIdx
  editingField.value = 'child'
}

function finishEdit() {
  setTimeout(() => { editingIndex.value = -1; editingChildIdx.value = -1 }, 80)
}

function handleAddPage() {
  const newItem: OutlineItem = { title: `新页面 ${outlineList.value.length + 1}`, children: [], expanded: true }
  outlineList.value.push(newItem)
  selectedPage.value = outlineList.value.length - 1
  startEditTitle(outlineList.value.length - 1)
}

function handleDeletePageAt(index: number) {
  if (outlineList.value.length <= 1) return
  outlineList.value.splice(index, 1)
  if (selectedPage.value >= outlineList.value.length) selectedPage.value = outlineList.value.length - 1
}

function movePageUp(index: number) {
  if (index <= 0) return
  const item = outlineList.value.splice(index, 1)[0]!
  outlineList.value.splice(index - 1, 0, item)
  if (selectedPage.value === index) selectedPage.value--
  else if (selectedPage.value === index - 1) selectedPage.value++
}

function movePageDown(index: number) {
  if (index >= outlineList.value.length - 1) return
  const item = outlineList.value.splice(index, 1)[0]!
  outlineList.value.splice(index + 1, 0, item)
  if (selectedPage.value === index) selectedPage.value++
  else if (selectedPage.value === index + 1) selectedPage.value--
}

function addChildItem(index: number) {
  outlineList.value[index].children.push('新内容项')
  startEditChild(index, outlineList.value[index].children.length - 1)
}

function removeChildItem(index: number, cIdx: number) {
  if (outlineList.value[index].children.length <= 1) return
  outlineList.value[index].children.splice(cIdx, 1)
}

function handlePageCountInput(val: string) {
  pageCount.value = val.replace(/[^0-9]/g, '')
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
        if (ev.target?.result) uploadedImages.value.push(ev.target.result as string)
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
    // 根据用户填写的页数生成，未填写则自动生成 6 页
    const count = pageCount.value ? parseInt(pageCount.value, 10) : 6
    const clampedCount = Math.max(1, Math.min(20, count))
    outlineList.value = generateOutline(clampedCount)
    selectedPage.value = 0
    currentPageTitle.value = outlineList.value[0].title || ''
    currentPageContent.value = outlineList.value[0].children.join('\n')
  }, 800)
}

function handleAiGenerate() {
  ElMessage.info('AI 生成功能开发中')
}

function handleRegenerate() {
  if (loading.value) return
  loading.value = true
  setTimeout(() => {
    loading.value = false
    const count = pageCount.value ? parseInt(pageCount.value, 10) : 6
    const clampedCount = Math.max(1, Math.min(20, count))
    outlineList.value = generateOutline(clampedCount)
    selectedPage.value = 0
    currentPageTitle.value = outlineList.value[0].title
    currentPageContent.value = outlineList.value[0].children.join('\n')
  }, 1000)
}

function handleSelectTemplate() { step.value = 3 }

// ======== 第三步：选择模板 ========
interface TemplateItem {
  id: number
  name: string
  color: string
  pageCount: number
  currentPage: number
}

const templateColors = [
  ['#409EFF', '#66b1ff', '#3a8ee6'],
  ['#67C23A', '#85ce61', '#5daf34'],
  ['#E6A23C', '#ebb563', '#cf9236'],
  ['#F56C6C', '#f78989', '#dd6161'],
  ['#909399', '#a6a9ad', '#82848a'],
  ['#1DAA8E', '#3cc0a5', '#17937a'],
  ['#9B59B6', '#b07cc6', '#844fa0'],
  ['#E74C3C', '#ed7669', '#d4392c'],
  ['#2C3E50', '#4a6274', '#1a2a38'],
  ['#F39C12', '#f5b041', '#d4860b'],
  ['#1ABC9C', '#48c9b0', '#16a085'],
  ['#3498DB', '#5dade2', '#2e86c1'],
]

function generateTemplates(): TemplateItem[] {
  const shuffled = [...templateColors].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 4).map((colors, i) => ({
    id: Date.now() + i,
    name: `模板${i + 1}`,
    color: colors[0],
    pageCount: Math.floor(Math.random() * 4) + 4,
    currentPage: 1,
  }))
}

const templateList = ref<TemplateItem[]>(generateTemplates())
const selectedTemplate = ref<number | 'random' | null>(null)

function handleRefreshTemplates() {
  templateList.value = generateTemplates()
  selectedTemplate.value = null
}

function prevTemplatePage(idx: number) {
  const t = templateList.value[idx]
  if (t.currentPage > 1) t.currentPage--
}

function nextTemplatePage(idx: number) {
  const t = templateList.value[idx]
  if (t.currentPage < t.pageCount) t.currentPage++
}

function handleSelectTemplateItem(id: number) {
  selectedTemplate.value = id
}

async function handleGeneratePPT() {
  if (!selectedTemplate.value) {
    ElMessage.warning('请先选择一个模板')
    return
  }
  if (selectedTemplate.value === 'random') {
    const idx = Math.floor(Math.random() * templateList.value.length)
    selectedTemplate.value = templateList.value[idx].id
  }

  loading.value = true
  try {
    const outline = outlineList.value.map(item => ({
      title: item.title,
      bullets: item.children,
    }))

    if (isOfficeContext()) {
      const result = await applyOutlineToPowerPoint(outline)
      if (result.success) {
        ElMessage.success(result.message)
      } else {
        ElMessage.error(result.message)
      }
    } else {
      ElMessage.warning('当前不在 Office 环境中，无法写入 PPT')
    }
  } catch (e) {
    ElMessage.error('生成PPT失败: ' + (e as Error).message)
  } finally {
    loading.value = false
  }
}

defineExpose({
  setLoading(val: boolean) { loading.value = val },
  setOutline(list: OutlineItem[]) { outlineList.value = list; selectedPage.value = 0 },
  getStep() { return step.value }
})
</script>

<style scoped>
.generate-ppt {
  display: flex;
  flex-direction: column;
  height: 100%;
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-title {
  font-size: 17px;
  font-weight: 600;
  color: #222;
}

/* ======== 第一步：表单 ======== */
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
.type-card {
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  padding: 14px 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}
.type-card:hover { border-color: #b3d8ff; }
.type-card.active { border-color: #409eff; background: #ecf5ff; }

.type-card-inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.type-card-text { flex: 1; }
.type-card-title { font-size: 14px; font-weight: 600; color: #222; margin-bottom: 4px; }
.type-card-desc { font-size: 12px; color: #999; }

/* 上传图片 */
.uploaded-images { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.uploaded-image-item {
  position: relative; width: 60px; height: 60px;
  border-radius: 8px; overflow: hidden; border: 1px solid #e8e8e8;
}
.uploaded-image-item img { width: 100%; height: 100%; object-fit: cover; }
.remove-image-btn {
  position: absolute; top: 2px; right: 2px;
  width: 18px; height: 18px; background: rgba(0,0,0,0.5); border: none;
}
.upload-btn { margin-top: 8px; }

/* 底部按钮 */
.action-bar { padding: 12px 16px 20px; flex-shrink: 0; }
.generate-btn { width: 100%; }

/* ======== 第二步 ======== */
.step2-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 16px;
}

/* Tab 样式 */
.outline-tabs {
  flex-shrink: 0;
}
.outline-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}
.outline-tabs :deep(.el-tabs__content) {
  display: none;
}

.tab-panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* 大纲面板 */
.outline-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 4px 10px;
  margin-bottom: 6px;
  flex-shrink: 0;
  background: #ddd;
}

.outline-header-title {
  font-size: 17px;
  font-weight: 600;
  color: #222;
  
}

/* 添加页面按钮 - 黑色 */
.add-page-btn {
  background: #333 !important;
  border-color: #333 !important;
  color: #fff !important;
  font-size: 12px;
  padding: 6px 14px;
}
.add-page-btn:hover {
  background: #555 !important;
  border-color: #555 !important;
}

.outline-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e8e8e8;
  margin-top: 24px;
}

/* ======== 大纲卡片 ======== */
.outline-card {
  background: #ebebeb;
  border: none;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
  max-height: 200px;
  overflow-y: auto;
  margin: 8px;
}
.outline-card:last-child {
  margin-bottom: 0;
}
/* 细灰色滚动条 */
.outline-card::-webkit-scrollbar { width: 4px; }
.outline-card::-webkit-scrollbar-track { background: transparent; }
.outline-card::-webkit-scrollbar-thumb { background: #d0d0d0; border-radius: 2px; }
.outline-card::-webkit-scrollbar-thumb:hover { background: #bbb; }
.outline-card:hover { background: #e0e0e0; }
.outline-card.selected { background: #ddd; }

/* 卡片头部 */
.outline-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  min-height: 44px;
}

.outline-card-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.outline-title-input {
  flex: 1;
}

/* 操作按钮组 */
.outline-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.action-icon-btn {
  padding: 4px !important;
}
.delete-action:hover {
  background: rgba(245,108,108,0.08) !important;
}

/* 子内容区域 */
.outline-card-body {
  padding: 2px 12px 10px 16px;
}

.child-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.child-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.child-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c0c4cc;
  flex-shrink: 0;
}

.child-text {
  flex: 1;
  word-break: break-word;
  cursor: text;
}

.child-input {
  flex: 1;
}

.child-remove-btn {
  opacity: 0;
  transition: opacity 0.15s;
  padding: 2px !important;
}
.child-item:hover .child-remove-btn { opacity: 1; }

/* 拖拽手柄 */
.drag-handle {
  position: sticky;
  float: right;
  bottom: 3px;
  right: 3px;
  cursor: grab;
  opacity: 0.3;
  transition: opacity 0.15s;
  padding: 1px;
  margin-top: -16px;
  margin-right: 3px;
}
.outline-card:hover .drag-handle { opacity: 0.6; }
.drag-handle:hover { opacity: 1 !important; }
.drag-handle:active { cursor: grabbing; }

/* ======== 页面内容面板 ======== */
.content-editor-card {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 16px;
}

.layout-radio-group {
  width: 100%;
  display: flex;
}

.layout-radio-btn {
  flex: 1;
}

.layout-option-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.content-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.content-label-row .form-label { margin-bottom: 0; }

/* 底部操作栏 */
.action-bar-step2 {
  padding: 12px 16px 20px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.action-bar-step2 .el-button {
  width: 100%;
  margin-left: 0;
}
.gray-btn {
  background: #f5f5f5 !important;
  border-color: #e0e0e0 !important;
  color: #666 !important;
}
.gray-btn:hover {
  background: #ebebeb !important;
  border-color: #d0d0d0 !important;
  color: #333 !important;
}

/* 细灰色滚动条 - 全局 */
.outline-list::-webkit-scrollbar,
.tab-panel::-webkit-scrollbar {
  width: 4px;
}
.outline-list::-webkit-scrollbar-track,
.tab-panel::-webkit-scrollbar-track {
  background: transparent;
}
.outline-list::-webkit-scrollbar-thumb,
.tab-panel::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 2px;
}
.outline-list::-webkit-scrollbar-thumb:hover,
.tab-panel::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}

/* ======== 第三步：选择模板 ======== */
.step3-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  overflow-y: auto;
}

.template-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 12px;
  flex-shrink: 0;
}

.template-header-title {
  font-size: 17px;
  font-weight: 600;
  color: #222;
}

.refresh-btn {
  color: #666 !important;
  font-size: 13px;
}
.refresh-btn:hover {
  color: #409eff !important;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 12px;
}

.template-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.template-card {
  flex: 1;
  border-radius: 8px;
  border: 2px solid transparent;
  overflow: hidden;
  transition: all 0.15s;
  background: #fff;
  min-width: 0;
}
.template-card:hover {
  border-color: #c0c4cc;
}
.template-card.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64,158,255,0.12);
}

.template-preview {
  position: relative;
  aspect-ratio: 16 / 9;
  display: flex;
  overflow: hidden;
}

.preview-sidebar {
  width: 35%;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-main {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  padding-top: 20px;
}

.preview-line {
  height: 4px;
  background: rgba(255,255,255,0.5);
  border-radius: 2px;
}
.preview-line.long { width: 80%; }
.preview-line.medium { width: 60%; }
.preview-line.short { width: 40%; }

.template-page-control {
  position: absolute;
  bottom: 6px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.page-arrow {
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(0,0,0,0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  padding: 0;
}
.page-arrow:hover {
  background: rgba(0,0,0,0.5);
}

.page-indicator {
  font-size: 10px;
  color: #fff;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
  padding: 1px 6px;
  line-height: 16px;
}

.template-name {
  text-align: center;
  font-size: 13px;
  color: #333;
  font-weight: 500;
  padding: 6px 0;
}

.template-check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #d0d0d0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
  background: #fff;
}
.template-check.checked {
  background: #409eff;
  border-color: #409eff;
}

/* 随机选择行 */
.random-select-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 4px;
  margin-bottom: 8px;
  border: 2px solid transparent;
  transition: all 0.15s;
}
.random-select-row:hover {
  background: #eee;
}
.random-select-row.selected {
  border-color: #409eff;
  background: #f0f7ff;
}

.random-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}
.random-select-row.selected .random-text {
  color: #409eff;
}

/* 底部操作栏 step3 */
.action-bar-step3 {
  padding: 12px 16px 20px;
  flex-shrink: 0;
  display: flex;
  gap: 10px;
}
.action-bar-step3 .el-button {
  flex: 1;
  margin-left: 0;
}
</style>
