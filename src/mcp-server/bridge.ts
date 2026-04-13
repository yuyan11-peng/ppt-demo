/**
 * PPT Kit MCP Server - WebSocket 桥接服务器
 * 
 * 架构:
 *   AI Client (Claude/CodeBuddy) <--MCP (SSE)--> Bridge Server <--WebSocket--> Vue3 前端应用
 * 
 * 职责:
 * 1. 启动 Express HTTP 服务器，提供 MCP SSE 端点
 * 2. 启动 WebSocket 服务器，等待前端 Vue 应用连接
 * 3. 将 MCP 工具调用转发给前端，等待前端执行结果
 */
import express from 'express'
import cors from 'cors'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { createPPTKitMCPServer } from './server.js'
import type { PPTOperations, WSRequest, WSResponse, SlideData, PresentationData } from './types.js'

const PORT = parseInt(process.env.PORT || '3100')

// ==================== 状态管理 ====================
let browserConnection: WebSocket | null = null
const pendingRequests = new Map<string, {
  resolve: (value: any) => void
  reject: (reason: any) => void
  timeout: ReturnType<typeof setTimeout>
}>()

let requestIdCounter = 0

function genRequestId(): string {
  return `req_${++requestIdCounter}_${Date.now()}`
}

// ==================== WebSocket 通信 ====================

/** 发送请求到前端并等待响应 */
function sendToBrowser<T = any>(type: string, params: Record<string, any>): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!browserConnection || browserConnection.readyState !== WebSocket.OPEN) {
      reject(new Error('前端未连接。请先打开 PPT Kit Vue3 应用 (http://localhost:5173)'))
      return
    }

    const id = genRequestId()
    const timeout = setTimeout(() => {
      pendingRequests.delete(id)
      reject(new Error(`请求超时 (30s): ${type}`))
    }, 30000)

    pendingRequests.set(id, { resolve, reject, timeout })

    const message: WSRequest = { id, type: type as any, params }
    browserConnection.send(JSON.stringify(message))

    console.log(`📤 [MCP→Browser] ${type} (${id})`)
  })
}

// ==================== Mock 操作 (前端未连接时的后备) ====================

function createMockOperations(): PPTOperations {
  // 内存中的幻灯片存储
  const slides: SlideData[] = [
    {
      id: 'mock_1',
      title: '欢迎使用 PPT Kit',
      markdown: '# 欢迎使用 PPT Kit\n\n这是 MCP 服务器模式。请启动前端应用以获得完整功能。',
      contents: [],
      layout: 'title',
      createdAt: Date.now()
    }
  ]

  function findSlide(id: string): SlideData {
    const slide = slides.find(s => s.id === id)
    if (!slide) throw new Error(`幻灯片未找到: ${id}`)
    return slide
  }

  function genId(): string {
    return 'slide_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36)
  }

  return {
    async getPresentationInfo(): Promise<PresentationData> {
      return {
        name: 'PPT Kit Vue3 Demo (Mock)',
        author: 'PPT Kit MCP',
        slideCount: slides.length,
        slides: [...slides]
      }
    },

    async createSlide(title: string, layout: string): Promise<SlideData> {
      const slide: SlideData = {
        id: genId(),
        title,
        markdown: `# ${title}\n\n在此输入内容...`,
        contents: [],
        layout: layout as any,
        createdAt: Date.now()
      }
      slides.push(slide)
      return slide
    },

    async deleteSlide(slideId: string): Promise<{ deleted: boolean }> {
      const index = slides.findIndex(s => s.id === slideId)
      if (index === -1) throw new Error(`幻灯片未找到: ${slideId}`)
      if (slides.length <= 1) throw new Error('至少需要保留一张幻灯片')
      slides.splice(index, 1)
      return { deleted: true }
    },

    async listSlides(limit: number, offset: number) {
      return {
        slides: slides.slice(offset, offset + limit),
        total: slides.length
      }
    },

    async addContent(slideId: string, content: string, contentType: string, language?: string) {
      const slide = findSlide(slideId)
      slide.contents.push({ type: contentType as any, value: content, language })
      if (contentType === 'code' && language) {
        slide.markdown += `\n\n\`\`\`${language}\n${content}\n\`\`\``
      } else if (contentType === 'mermaid') {
        slide.markdown += `\n\n\`\`\`mermaid\n${content}\n\`\`\``
      } else {
        slide.markdown += `\n\n${content}`
      }
      return slide
    },

    async addCodeBlock(slideId: string, code: string, language: string) {
      const slide = findSlide(slideId)
      slide.contents.push({ type: 'code', value: code, language })
      slide.markdown += `\n\n\`\`\`${language}\n${code}\n\`\`\``
      return slide
    },

    async addMermaid(slideId: string, mermaidCode: string) {
      const slide = findSlide(slideId)
      slide.contents.push({ type: 'mermaid', value: mermaidCode })
      slide.markdown += `\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``
      return slide
    },

    async generateFromMarkdown(markdown: string) {
      // 按 # 标题拆分
      const sections = markdown.split(/^(?=# )/gm).filter(s => s.trim())
      const newSlides: SlideData[] = []

      for (const section of sections) {
        const titleMatch = section.match(/^#\s+(.+)$/m)
        const title = titleMatch ? titleMatch[1].replace(/[*_~`]/g, '').trim() : '无标题'
        const hasCode = /```\w+/.test(section)
        const slide: SlideData = {
          id: genId(),
          title,
          markdown: section.trim(),
          contents: [],
          layout: hasCode ? 'code' : (section.indexOf('# ') === 0 && sections.indexOf(section) === 0 ? 'title' : 'content'),
          createdAt: Date.now()
        }
        slides.push(slide)
        newSlides.push(slide)
      }

      return { slides: newSlides, count: newSlides.length }
    },

    async updateSlide(slideId: string, markdown: string) {
      const slide = findSlide(slideId)
      slide.markdown = markdown
      const titleMatch = markdown.match(/^#\s+(.+)$/m)
      if (titleMatch) {
        slide.title = titleMatch[1].replace(/[*_~`]/g, '').trim()
      }
      return slide
    },

    async exportPptx(filename?: string) {
      return {
        filename: (filename || 'ppt-kit-export') + '.pptx',
        status: 'mock_mode - 请连接前端应用以导出真实文件'
      }
    }
  }
}

// ==================== 桥接操作 (前端已连接) ====================

function createBridgedOperations(): PPTOperations {
  return {
    getPresentationInfo: () => sendToBrowser('ppt_get_info', {}),
    createSlide: (title, layout) => sendToBrowser('ppt_create_slide', { title, layout }),
    deleteSlide: (slideId) => sendToBrowser('ppt_delete_slide', { slide_id: slideId }),
    listSlides: (limit, offset) => sendToBrowser('ppt_list_slides', { limit, offset }),
    addContent: (slideId, content, contentType, language) =>
      sendToBrowser('ppt_add_content', { slide_id: slideId, content, content_type: contentType, language }),
    addCodeBlock: (slideId, code, language) =>
      sendToBrowser('ppt_add_code_block', { slide_id: slideId, code, language }),
    addMermaid: (slideId, mermaidCode) =>
      sendToBrowser('ppt_add_mermaid', { slide_id: slideId, mermaid_code: mermaidCode }),
    generateFromMarkdown: (markdown) => sendToBrowser('ppt_from_markdown', { markdown }),
    updateSlide: (slideId, markdown) =>
      sendToBrowser('ppt_update_slide', { slide_id: slideId, markdown }),
    exportPptx: (filename) => sendToBrowser('ppt_export_pptx', { filename })
  }
}

// ==================== 启动服务器 ====================

export async function startBridgeServer() {
  const app = express()
  app.use(cors())
  // 注意：不能对 /messages 路径使用 express.json()，
  // 否则会消费 request body，导致 MCP SSEServerTransport.handlePostMessage 报 "stream is not readable"
  app.use((req, res, next) => {
    if (req.path === '/messages') {
      return next()
    }
    express.json()(req, res, next)
  })

  const httpServer = createServer(app)

  // --- WebSocket Server ---
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (ws) => {
    console.log('🔌 前端应用已连接 (WebSocket)')
    browserConnection = ws

    // 更新 MCP Server 操作为桥接模式
    currentOperations = createBridgedOperations()

    ws.on('message', (data) => {
      try {
        const response: WSResponse = JSON.parse(data.toString())
        const pending = pendingRequests.get(response.id)
        if (pending) {
          clearTimeout(pending.timeout)
          pendingRequests.delete(response.id)
          if (response.success) {
            console.log(`📥 [Browser→MCP] ✓ (${response.id})`)
            pending.resolve(response.data)
          } else {
            console.log(`📥 [Browser→MCP] ✗ (${response.id}): ${response.error}`)
            pending.reject(new Error(response.error || '前端操作失败'))
          }
        }
      } catch (e) {
        console.error('❌ 解析 WebSocket 消息失败:', e)
      }
    })

    ws.on('close', () => {
      console.log('🔌 前端应用已断开')
      browserConnection = null
      currentOperations = createMockOperations()
      // Reject 所有等待中的请求
      for (const [id, pending] of pendingRequests) {
        clearTimeout(pending.timeout)
        pending.reject(new Error('前端连接已断开'))
      }
      pendingRequests.clear()
    })

    ws.on('error', (err) => {
      console.error('❌ WebSocket 错误:', err)
    })
  })

  // --- 动态操作切换 ---
  let currentOperations: PPTOperations = createMockOperations()

  // 创建动态代理，始终使用最新的 operations
  const dynamicOperations: PPTOperations = new Proxy({} as PPTOperations, {
    get(_target, prop: string) {
      return (...args: any[]) => (currentOperations as any)[prop](...args)
    }
  })

  // --- MCP Server ---
  // 每个 SSE 连接需要独立的 MCP Server 实例，避免 "Already connected to a transport" 错误
  const sessions: Map<string, { transport: SSEServerTransport; mcpServer: ReturnType<typeof createPPTKitMCPServer> }> = new Map()

  app.get('/sse', async (req, res) => {
    console.log('🤖 AI 客户端已连接 (SSE)')
    const transport = new SSEServerTransport('/messages', res)
    const mcpServer = createPPTKitMCPServer(dynamicOperations)
    sessions.set(transport.sessionId, { transport, mcpServer })
    
    res.on('close', () => {
      const session = sessions.get(transport.sessionId)
      if (session) {
        session.mcpServer.server.close().catch(() => {})
      }
      sessions.delete(transport.sessionId)
      console.log('🤖 AI 客户端已断开')
    })

    await mcpServer.server.connect(transport)
  })

  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string
    const session = sessions.get(sessionId)
    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }
    await session.transport.handlePostMessage(req, res)
  })

  // --- Health & Info Endpoints ---
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      browserConnected: browserConnection?.readyState === WebSocket.OPEN,
      mode: browserConnection?.readyState === WebSocket.OPEN ? 'bridged' : 'mock',
      pendingRequests: pendingRequests.size
    })
  })

  app.get('/tools', (_req, res) => {
    res.json({
      tools: [
        'ppt_get_info',
        'ppt_create_slide',
        'ppt_delete_slide',
        'ppt_list_slides',
        'ppt_add_content',
        'ppt_add_code_block',
        'ppt_add_mermaid',
        'ppt_from_markdown',
        'ppt_update_slide',
        'ppt_export_pptx'
      ]
    })
  })

  // --- Start ---
  httpServer.listen(PORT, () => {
    console.log('')
    console.log('╔══════════════════════════════════════════════════╗')
    console.log('║         🚀 PPT Kit MCP Bridge Server            ║')
    console.log('╠══════════════════════════════════════════════════╣')
    console.log(`║  MCP SSE:    http://localhost:${PORT}/sse            ║`)
    console.log(`║  MCP Msgs:   http://localhost:${PORT}/messages       ║`)
    console.log(`║  WebSocket:  ws://localhost:${PORT}/ws               ║`)
    console.log(`║  Health:     http://localhost:${PORT}/health          ║`)
    console.log('╠══════════════════════════════════════════════════╣')
    console.log('║  模式: 等待前端连接...                           ║')
    console.log('║  前端地址: http://localhost:5173                 ║')
    console.log('╚══════════════════════════════════════════════════╝')
    console.log('')
  })
}
