/**
 * PPT Kit Vue3 - WebSocket Bridge Client
 * 
 * 前端通过 WebSocket 与集成在 Vite 中的 MCP Bridge Server 通信。
 * 一切运行在同一个端口 (5173) 上。
 * 
 * 架构 (集成模式):
 *   AI Client (CodeBuddy) <--MCP SSE (/mcp/sse)--> Vite Server (5173) <--WebSocket (/ws)--> 本客户端
 * 
 * 工作流:
 * 1. 前端连接到 ws://localhost:5173/ws (同端口)
 * 2. 接收来自 MCP 工具的操作请求 (创建幻灯片、添加内容等)
 * 3. 在前端 Store 中执行操作
 * 4. 将结果发回
 */
import { ref, readonly } from 'vue'
import type { Slide, SlideContent } from './store'

// ==================== 类型定义 ====================

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

interface WSRequest {
  id: string
  type: string
  params: Record<string, any>
}

interface WSResponse {
  id: string
  success: boolean
  data?: any
  error?: string
}

export interface BridgeClientOptions {
  url?: string
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  reconnectDelay?: number
}

// ==================== 响应式状态 ====================

const connectionState = ref<ConnectionState>('disconnected')
const lastError = ref<string | null>(null)
const requestCount = ref(0)

// ==================== 内部状态 ====================

let ws: WebSocket | null = null
let reconnectAttempts = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let storeRef: ReturnType<typeof import('./store').useStore> | null = null

const DEFAULT_OPTIONS: Required<BridgeClientOptions> = {
  url: `ws://${window.location.host}/ws`,
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 2000
}

let currentOptions = { ...DEFAULT_OPTIONS }

// ==================== 核心连接逻辑 ====================

/**
 * 初始化 Bridge Client，注入 Store 引用
 */
export function initBridgeClient(store: ReturnType<typeof import('./store').useStore>) {
  storeRef = store
}

/**
 * 连接到 MCP Bridge Server
 */
export function connect(options?: BridgeClientOptions) {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    console.log('[Bridge Client] 已连接或正在连接中')
    return
  }

  currentOptions = { ...DEFAULT_OPTIONS, ...options }
  connectionState.value = 'connecting'
  lastError.value = null

  console.log(`[Bridge Client] 正在连接 ${currentOptions.url}...`)

  try {
    ws = new WebSocket(currentOptions.url)
  } catch (e) {
    connectionState.value = 'error'
    lastError.value = (e as Error).message
    scheduleReconnect()
    return
  }

  ws.onopen = () => {
    console.log('[Bridge Client] ✅ 已连接到 MCP Bridge Server')
    connectionState.value = 'connected'
    lastError.value = null
    reconnectAttempts = 0
  }

  ws.onmessage = (event) => {
    try {
      const request: WSRequest = JSON.parse(event.data)
      console.log(`[Bridge Client] 📥 收到请求: ${request.type} (${request.id})`)
      handleRequest(request)
    } catch (e) {
      console.error('[Bridge Client] 解析消息失败:', e)
    }
  }

  ws.onclose = (event) => {
    console.log(`[Bridge Client] 连接断开 (code: ${event.code})`)
    connectionState.value = 'disconnected'
    ws = null
    scheduleReconnect()
  }

  ws.onerror = (event) => {
    console.error('[Bridge Client] WebSocket 错误:', event)
    connectionState.value = 'error'
    lastError.value = 'WebSocket 连接错误'
  }
}

/**
 * 断开连接
 */
export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  reconnectAttempts = currentOptions.maxReconnectAttempts // 防止自动重连

  if (ws) {
    ws.close(1000, '用户主动断开')
    ws = null
  }
  connectionState.value = 'disconnected'
}

/**
 * 自动重连
 */
function scheduleReconnect() {
  if (!currentOptions.autoReconnect) return
  if (reconnectAttempts >= currentOptions.maxReconnectAttempts) {
    console.log('[Bridge Client] 已达到最大重连次数，停止重连')
    lastError.value = `重连失败 (已尝试 ${reconnectAttempts} 次)`
    return
  }

  const delay = currentOptions.reconnectDelay * Math.pow(1.5, reconnectAttempts)
  reconnectAttempts++
  console.log(`[Bridge Client] ${delay / 1000}s 后重连 (第 ${reconnectAttempts} 次)...`)

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, delay)
}

// ==================== 请求处理 ====================

/**
 * 发送响应给 Bridge Server
 */
function sendResponse(id: string, data: any) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return

  const response: WSResponse = { id, success: true, data }
  ws.send(JSON.stringify(response))
  requestCount.value++
  console.log(`[Bridge Client] 📤 响应: ✓ (${id})`)
}

/**
 * 发送错误响应
 */
function sendError(id: string, error: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return

  const response: WSResponse = { id, success: false, error }
  ws.send(JSON.stringify(response))
  console.log(`[Bridge Client] 📤 响应: ✗ (${id}) - ${error}`)
}

/**
 * 处理从 Bridge Server 收到的请求
 * 这里是核心逻辑：将 MCP 工具调用翻译为 Store 操作
 */
async function handleRequest(request: WSRequest) {
  if (!storeRef) {
    sendError(request.id, '前端 Store 未初始化')
    return
  }

  const store = storeRef

  try {
    switch (request.type) {
      case 'ppt_get_info': {
        const data = {
          name: store.presentationInfo.name,
          author: store.presentationInfo.author,
          slideCount: store.slides.length,
          slides: store.slides.map(s => ({
            id: s.id,
            title: s.title,
            layout: s.layout
          }))
        }
        sendResponse(request.id, data)
        break
      }

      case 'ppt_create_slide': {
        const { title = '新幻灯片', layout = 'content' } = request.params
        const slide = store.createSlide(title, layout)
        sendResponse(request.id, slide)
        break
      }

      case 'ppt_delete_slide': {
        const { slide_id } = request.params
        const index = store.slides.findIndex(s => s.id === slide_id)
        if (index === -1) {
          sendError(request.id, `幻灯片未找到: ${slide_id}`)
          return
        }
        if (store.slides.length <= 1) {
          sendError(request.id, '至少需要保留一张幻灯片')
          return
        }
        store.deleteSlide(index)
        sendResponse(request.id, { deleted: true })
        break
      }

      case 'ppt_list_slides': {
        const { limit = 20, offset = 0 } = request.params
        const sliced = store.slides.slice(offset, offset + limit)
        sendResponse(request.id, {
          slides: sliced,
          total: store.slides.length
        })
        break
      }

      case 'ppt_add_content': {
        const { slide_id, content, content_type, language } = request.params
        const slide = store.slides.find(s => s.id === slide_id)
        if (!slide) {
          sendError(request.id, `幻灯片未找到: ${slide_id}`)
          return
        }

        // 追加内容到 slide.contents
        const newContent: SlideContent = { type: content_type, value: content, language }
        slide.contents.push(newContent)

        // 同步更新 markdown
        if (content_type === 'code' && language) {
          slide.markdown += `\n\n\`\`\`${language}\n${content}\n\`\`\``
        } else if (content_type === 'mermaid') {
          slide.markdown += `\n\n\`\`\`mermaid\n${content}\n\`\`\``
        } else {
          slide.markdown += `\n\n${content}`
        }

        sendResponse(request.id, slide)
        break
      }

      case 'ppt_add_code_block': {
        const { slide_id, code, language } = request.params
        const slide = store.slides.find(s => s.id === slide_id)
        if (!slide) {
          sendError(request.id, `幻灯片未找到: ${slide_id}`)
          return
        }
        slide.contents.push({ type: 'code', value: code, language })
        slide.markdown += `\n\n\`\`\`${language}\n${code}\n\`\`\``
        sendResponse(request.id, slide)
        break
      }

      case 'ppt_add_mermaid': {
        const { slide_id, mermaid_code } = request.params
        const slide = store.slides.find(s => s.id === slide_id)
        if (!slide) {
          sendError(request.id, `幻灯片未找到: ${slide_id}`)
          return
        }
        slide.contents.push({ type: 'mermaid', value: mermaid_code })
        slide.markdown += `\n\n\`\`\`mermaid\n${mermaid_code}\n\`\`\``
        sendResponse(request.id, slide)
        break
      }

      case 'ppt_from_markdown': {
        const { markdown } = request.params
        const sections = markdown.split(/^(?=# )/gm).filter((s: string) => s.trim())
        const newSlides: Slide[] = []

        for (const section of sections) {
          const titleMatch = section.match(/^#\s+(.+)$/m)
          const title = titleMatch ? titleMatch[1].replace(/[*_~`]/g, '').trim() : '无标题'
          const hasCode = /```\w+/.test(section)
          const slide = store.createSlide(
            title,
            hasCode ? 'code' : (sections.indexOf(section) === 0 ? 'title' : 'content')
          )
          // 覆盖 markdown (createSlide 会生成默认内容)
          const idx = store.slides.findIndex(s => s.id === slide.id)
          if (idx >= 0) {
            store.updateSlideMarkdown(idx, section.trim())
          }
          newSlides.push(store.slides.find(s => s.id === slide.id) || slide)
        }

        sendResponse(request.id, {
          slides: newSlides,
          count: newSlides.length
        })
        break
      }

      case 'ppt_update_slide': {
        const { slide_id, markdown } = request.params
        const index = store.slides.findIndex(s => s.id === slide_id)
        if (index === -1) {
          sendError(request.id, `幻灯片未找到: ${slide_id}`)
          return
        }
        store.updateSlideMarkdown(index, markdown)
        sendResponse(request.id, store.slides[index])
        break
      }

      case 'ppt_export_pptx': {
        const { filename } = request.params
        // 前端导出需要动态 import，但这里返回状态即可
        // 实际导出由前端触发
        sendResponse(request.id, {
          filename: (filename || 'ppt-kit-export') + '.pptx',
          status: 'export_triggered'
        })
        // 在下一个 tick 触发实际导出
        setTimeout(async () => {
          try {
            const { exportToPptx } = await import('./modules/export')
            await exportToPptx([...store.slides], {
              title: store.presentationInfo.name,
              author: store.presentationInfo.author
            })
          } catch (e) {
            console.error('[Bridge Client] 导出失败:', e)
          }
        }, 100)
        break
      }

      default:
        sendError(request.id, `未知操作类型: ${request.type}`)
    }
  } catch (e) {
    sendError(request.id, (e as Error).message)
  }
}

// ==================== 导出响应式状态 ====================

export function useBridgeClient() {
  return {
    /** 连接状态 */
    connectionState: readonly(connectionState),
    /** 最近错误 */
    lastError: readonly(lastError),
    /** 已处理请求数 */
    requestCount: readonly(requestCount),
    /** 是否已连接 */
    isConnected: () => connectionState.value === 'connected',
    /** 连接到 Bridge Server */
    connect,
    /** 断开连接 */
    disconnect,
    /** 初始化（注入 Store） */
    initBridgeClient
  }
}
