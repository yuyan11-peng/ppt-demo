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

/** 不再提供默认 demo 数据，初始状态为空 */

// ==================== 初始化状态 ====================

// 优先从 localStorage 恢复，否则为空
const stored = loadFromStorage()
const initialSlides = stored ? stored.slides : []
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

/** 从大纲数据导入幻灯片（供 TaskPane 生成PPT后调用） */
function importFromOutline(outline: Array<{ title: string; bullets: string[] }>, topic?: string) {
  // 清空现有幻灯片
  slides.splice(0, slides.length)

  for (let i = 0; i < outline.length; i++) {
    const item = outline[i]
    const bulletsText = item.bullets.map(b => `- ${b}`).join('\n')
    const markdown = `# ${item.title}\n\n${bulletsText}`
    const layout: Slide['layout'] = i === 0 ? 'title' : 'content'

    slides.push({
      id: genId(),
      title: item.title,
      markdown,
      contents: [],
      layout,
      createdAt: Date.now()
    })
  }

  presentationInfo.name = topic || (outline[0]?.title || 'PPT Kit')
  presentationInfo.slideCount = slides.length
  currentSlideIndex.value = 0

  // 立即持久化
  saveToStorage([...slides], currentSlideIndex.value)
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
    duplicateSlide,
    importFromOutline
  }
}
