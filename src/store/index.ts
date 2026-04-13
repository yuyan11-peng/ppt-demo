import { reactive, ref, computed, watch } from 'vue'

export interface SlideContent {
  type: 'text' | 'code' | 'image' | 'mermaid'
  value: string
  language?: string
}

export interface Slide {
  id: string
  title: string
  markdown: string
  contents: SlideContent[]
  layout: 'title' | 'content' | 'two-column' | 'code' | 'blank'
  createdAt: number
}

export interface PresentationInfo {
  name: string
  author: string
  slideCount: number
  createdAt: number
}

// ==================== 持久化 ====================
const STORAGE_KEY = 'ppt-kit-slides'
const STORAGE_INDEX_KEY = 'ppt-kit-current-index'

function saveToStorage(data: Slide[], index: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    localStorage.setItem(STORAGE_INDEX_KEY, String(index))
  } catch (e) {
    console.warn('[Store] localStorage 写入失败:', e)
  }
}

function loadFromStorage(): { slides: Slide[], index: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Slide[]
    if (!Array.isArray(data) || data.length === 0) return null
    const index = parseInt(localStorage.getItem(STORAGE_INDEX_KEY) || '0', 10)
    return { slides: data, index: Math.min(index, data.length - 1) }
  } catch (e) {
    console.warn('[Store] localStorage 读取失败:', e)
    return null
  }
}

/** 清除持久化数据（恢复默认） */
export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_INDEX_KEY)
}

// ==================== 默认数据 ====================

function genId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

function createDefaultSlides(): Slide[] {
  return [
    {
      id: 'default_slide_1',
      title: '欢迎使用 PPT Kit',
      markdown: `# 🚀 PPT Kit - Vue3 Demo

## 智能幻灯片生成工具

支持以下核心特性：

- 📝 **Markdown 实时编辑**与预览
- 🎨 **代码高亮**显示
- 📊 **Mermaid 图表**渲染
- 📤 **导出 PPTX** 文件
- 🎯 **多种布局**模板

> 基于 ppt-kit 理念，使用 Vue3 + TypeScript 构建`,
      contents: [],
      layout: 'title',
      createdAt: Date.now()
    },
    {
      id: 'default_slide_2',
      title: '技术架构',
      markdown: `# 技术架构

## 核心技术栈

| 技术 | 用途 |
|------|------|
| Vue 3 | 前端框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Marked | Markdown 解析 |
| Highlight.js | 代码高亮 |
| Mermaid | 图表渲染 |
| PptxGenJS | PPT 导出 |

## 架构图

\`\`\`mermaid
graph LR
    A[Markdown 编辑器] --> B[解析引擎]
    B --> C[实时预览]
    B --> D[PPT 导出]
    C --> E[代码高亮]
    C --> F[Mermaid 图表]
\`\`\``,
      contents: [],
      layout: 'content',
      createdAt: Date.now()
    },
    {
      id: 'default_slide_3',
      title: '代码高亮示例',
      markdown: `# 代码高亮示例

## Vue 3 组合式 API

\`\`\`typescript
import { ref, computed, onMounted } from 'vue'

interface Slide {
  id: string
  title: string
  content: string
}

export function useSlideEditor() {
  const slides = ref<Slide[]>([])
  const currentIndex = ref(0)

  const currentSlide = computed(() => 
    slides.value[currentIndex.value]
  )

  const addSlide = (title: string) => {
    slides.value.push({
      id: crypto.randomUUID(),
      title,
      content: ''
    })
  }

  return { slides, currentSlide, addSlide }
}
\`\`\`

> 完美支持 TypeScript、Python、JavaScript 等多种语言的语法高亮`,
      contents: [],
      layout: 'code',
      createdAt: Date.now()
    },
    {
      id: 'default_slide_4',
      title: 'Mermaid 图表',
      markdown: `# Mermaid 图表支持

## 流程图

\`\`\`mermaid
flowchart TD
    A[开始] --> B{选择模板}
    B -->|标题页| C[编辑标题]
    B -->|内容页| D[编写 Markdown]
    B -->|代码页| E[插入代码]
    C --> F[实时预览]
    D --> F
    E --> F
    F --> G{满意?}
    G -->|是| H[导出 PPTX]
    G -->|否| B
    H --> I[完成 🎉]
\`\`\`

## 序列图

\`\`\`mermaid
sequenceDiagram
    participant U as 用户
    participant E as 编辑器
    participant P as 解析器
    participant R as 渲染器

    U->>E: 输入 Markdown
    E->>P: 解析内容
    P->>R: 生成 HTML
    R-->>U: 实时预览
    U->>E: 导出 PPT
    E->>P: 转换格式
    P-->>U: 下载文件
\`\`\``,
      contents: [],
      layout: 'content',
      createdAt: Date.now()
    }
  ]
}

// ==================== 初始化状态 ====================

// 优先从 localStorage 恢复，否则用默认数据
const stored = loadFromStorage()
const initialSlides = stored ? stored.slides : createDefaultSlides()
const initialIndex = stored ? stored.index : 0

// State
const slides = reactive<Slide[]>(initialSlides)
const currentSlideIndex = ref(initialIndex)
const presentationInfo = reactive<PresentationInfo>({
  name: 'PPT Kit',
  author: 'PPT Kit',
  slideCount: slides.length,
  createdAt: Date.now()
})

// ==================== 自动持久化 ====================

// 监听 slides 变化，自动保存（深度监听，带防抖）
let saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveToStorage([...slides], currentSlideIndex.value)
  }, 300)
}

watch(slides, scheduleSave, { deep: true })
watch(currentSlideIndex, scheduleSave)

// Computed
const currentSlide = computed(() => slides[currentSlideIndex.value])
const slideCount = computed(() => slides.length)

// Actions
function setCurrentSlide(index: number) {
  if (index >= 0 && index < slides.length) {
    currentSlideIndex.value = index
  }
}

function createSlide(title: string = '新幻灯片', layout: Slide['layout'] = 'content'): Slide {
  const slide: Slide = {
    id: genId(),
    title,
    markdown: `# ${title}\n\n在此输入内容...`,
    contents: [],
    layout,
    createdAt: Date.now()
  }
  slides.push(slide)
  presentationInfo.slideCount = slides.length
  currentSlideIndex.value = slides.length - 1
  return slide
}

function deleteSlide(index: number) {
  if (slides.length <= 1) return
  slides.splice(index, 1)
  presentationInfo.slideCount = slides.length
  if (currentSlideIndex.value >= slides.length) {
    currentSlideIndex.value = slides.length - 1
  }
}

function updateSlideMarkdown(index: number, markdown: string) {
  if (index >= 0 && index < slides.length) {
    slides[index].markdown = markdown
    // Extract title from first heading
    const match = markdown.match(/^#\s+(.+)$/m)
    if (match) {
      slides[index].title = match[1].replace(/[*_~`]/g, '').trim()
    }
  }
}

function updateSlideLayout(index: number, layout: Slide['layout']) {
  if (index >= 0 && index < slides.length) {
    slides[index].layout = layout
  }
}

function moveSlide(fromIndex: number, toIndex: number) {
  if (fromIndex < 0 || fromIndex >= slides.length) return
  if (toIndex < 0 || toIndex >= slides.length) return
  const [removed] = slides.splice(fromIndex, 1)
  slides.splice(toIndex, 0, removed)
  currentSlideIndex.value = toIndex
}

function duplicateSlide(index: number) {
  if (index < 0 || index >= slides.length) return
  const source = slides[index]
  const newSlide: Slide = {
    ...JSON.parse(JSON.stringify(source)),
    id: genId(),
    title: source.title + ' (副本)',
    createdAt: Date.now()
  }
  slides.splice(index + 1, 0, newSlide)
  presentationInfo.slideCount = slides.length
  currentSlideIndex.value = index + 1
}

export function useStore() {
  return {
    slides,
    currentSlideIndex,
    currentSlide,
    slideCount,
    presentationInfo,
    setCurrentSlide,
    createSlide,
    deleteSlide,
    updateSlideMarkdown,
    updateSlideLayout,
    moveSlide,
    duplicateSlide
  }
}
