/**
 * Vite 插件 - 将 MCP Bridge Server 集成到 Vite 开发服务器
 *
 * 这样只需要 `npm run dev` 一条命令，前端 + MCP Server + WebSocket Bridge
 * 全部运行在同一个端口 (5173) 上：
 *
 *   - 前端页面:     http://localhost:5173/
 *   - MCP SSE:      http://localhost:5173/mcp/sse
 *   - MCP Messages: http://localhost:5173/mcp/messages
 *   - WebSocket:    ws://localhost:5173/ws
 *   - Health:       http://localhost:5173/mcp/health
 */
import type { Plugin, ViteDevServer } from 'vite'
import { WebSocketServer, WebSocket } from 'ws'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { createPPTKitMCPServer } from './mcp-server/server.js'
import type { PPTOperations, WSRequest, WSResponse, SlideData, PresentationData } from './mcp-server/types.js'

export function mcpBridgePlugin(): Plugin {
  return {
    name: 'vite-plugin-mcp-bridge',
    configureServer(server: ViteDevServer) {
      // ==================== 状态 ====================
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
      function sendToBrowser<T = any>(type: string, params: Record<string, any>): Promise<T> {
        return new Promise((resolve, reject) => {
          if (!browserConnection || browserConnection.readyState !== WebSocket.OPEN) {
            reject(new Error('前端未连接，请刷新页面'))
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

      // ==================== Mock 操作 ====================
      function createMockOperations(): PPTOperations {
        const slides: SlideData[] = [
          {
            id: 'mock_1',
            title: '欢迎使用 PPT Kit',
            markdown: '# 欢迎使用 PPT Kit\n\n这是 MCP 服务器模式。请刷新前端页面以建立连接。',
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
              id: genId(), title,
              markdown: `# ${title}\n\n在此输入内容...`,
              contents: [], layout: layout as any, createdAt: Date.now()
            }
            slides.push(slide)
            return slide
          },
          async deleteSlide(slideId: string) {
            const index = slides.findIndex(s => s.id === slideId)
            if (index === -1) throw new Error(`幻灯片未找到: ${slideId}`)
            if (slides.length <= 1) throw new Error('至少需要保留一张幻灯片')
            slides.splice(index, 1)
            return { deleted: true }
          },
          async listSlides(limit: number, offset: number) {
            return { slides: slides.slice(offset, offset + limit), total: slides.length }
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
            const sections = markdown.split(/^(?=# )/gm).filter(s => s.trim())
            const newSlides: SlideData[] = []
            for (const section of sections) {
              const titleMatch = section.match(/^#\s+(.+)$/m)
              const title = titleMatch ? titleMatch[1].replace(/[*_~`]/g, '').trim() : '无标题'
              const slide: SlideData = {
                id: genId(), title, markdown: section.trim(), contents: [],
                layout: /```\w+/.test(section) ? 'code' : 'content', createdAt: Date.now()
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
            if (titleMatch) slide.title = titleMatch[1].replace(/[*_~`]/g, '').trim()
            return slide
          },
          async exportPptx(filename?: string) {
            return { filename: (filename || 'ppt-kit-export') + '.pptx', status: 'mock_mode' }
          }
        }
      }

      // ==================== 桥接操作 ====================
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

      // ==================== 动态操作切换 ====================
      let currentOperations: PPTOperations = createMockOperations()
      const dynamicOperations: PPTOperations = new Proxy({} as PPTOperations, {
        get(_target, prop: string) {
          return (...args: any[]) => (currentOperations as any)[prop](...args)
        }
      })

      // ==================== MCP Sessions ====================
      const sessions = new Map<string, {
        transport: SSEServerTransport
        mcpServer: ReturnType<typeof createPPTKitMCPServer>
      }>()

      // ==================== 挂载到 Vite ====================
      const httpServer = server.httpServer!

      // 1. WebSocket Server - 使用 noServer 模式，手动处理 upgrade
      const wss = new WebSocketServer({ noServer: true })

      httpServer.on('upgrade', (request, socket, head) => {
        // 只处理 /ws 路径，其他路径（如 Vite HMR）不拦截
        if (request.url === '/ws') {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request)
          })
        }
      })

      wss.on('connection', (ws) => {
        console.log('🔌 前端应用已连接 (WebSocket)')
        browserConnection = ws
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

      // 2. MCP HTTP 路由 - 挂载到 Vite 的 Express 中间件
      server.middlewares.use('/mcp/sse', async (req, res) => {
        // 设置 CORS
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        console.log('🤖 AI 客户端已连接 (SSE)')
        const transport = new SSEServerTransport('/mcp/messages', res as any)
        const mcpServer = createPPTKitMCPServer(dynamicOperations)
        sessions.set(transport.sessionId, { transport, mcpServer })

        res.on('close', () => {
          const session = sessions.get(transport.sessionId)
          if (session) session.mcpServer.server.close().catch(() => {})
          sessions.delete(transport.sessionId)
          console.log('🤖 AI 客户端已断开')
        })

        await mcpServer.server.connect(transport)
      })

      server.middlewares.use('/mcp/messages', async (req, res) => {
        // 设置 CORS
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // Vite 中间件可能已经去掉前缀，req.url 可能是 "?sessionId=xxx"
        // 或 "/mcp/messages?sessionId=xxx"，取决于 Vite 的处理方式
        const rawUrl = req.originalUrl || req.url || ''
        const url = new URL(rawUrl, `http://${req.headers.host}`)
        const sessionId = url.searchParams.get('sessionId') || ''
        
        console.log(`📨 [MCP Messages] rawUrl=${rawUrl}, sessionId=${sessionId}, activeSessions=[${[...sessions.keys()].join(', ')}]`)
        
        const session = sessions.get(sessionId)
        if (!session) {
          console.log(`❌ [MCP Messages] Session 未找到: ${sessionId}`)
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Session not found', sessionId, available: [...sessions.keys()] }))
          return
        }
        await session.transport.handlePostMessage(req as any, res as any)
      })

      server.middlewares.use('/mcp/health', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          status: 'ok',
          version: '1.0.0',
          browserConnected: browserConnection?.readyState === WebSocket.OPEN,
          mode: browserConnection?.readyState === WebSocket.OPEN ? 'bridged' : 'mock',
          pendingRequests: pendingRequests.size,
          activeSessions: sessions.size
        }))
      })

      // 启动日志 - 在 server 真正 listen 之后输出
      const originalListen = httpServer.listen.bind(httpServer)
      httpServer.listen = function (...args: any[]) {
        const result = originalListen(...args)
        const addr = httpServer.address()
        const port = typeof addr === 'object' && addr ? addr.port : 5173
        setTimeout(() => {
          console.log('')
          console.log('╔══════════════════════════════════════════════════════╗')
          console.log('║      🚀 PPT Kit MCP (集成到 Vite 开发服务器)        ║')
          console.log('╠══════════════════════════════════════════════════════╣')
          console.log(`║  前端页面:    http://localhost:${port}/                 ║`)
          console.log(`║  MCP SSE:     http://localhost:${port}/mcp/sse         ║`)
          console.log(`║  WebSocket:   ws://localhost:${port}/ws                ║`)
          console.log(`║  Health:      http://localhost:${port}/mcp/health      ║`)
          console.log('╠══════════════════════════════════════════════════════╣')
          console.log('║  ✅ 一个端口，全部搞定！                            ║')
          console.log('╚══════════════════════════════════════════════════════╝')
          console.log('')
        }, 100)
        return result
      } as any
    }
  }
}
