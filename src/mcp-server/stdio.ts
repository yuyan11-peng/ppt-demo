/**
 * PPT Kit MCP Server - Stdio 传输模式入口
 * 
 * 此模式下 MCP Server 通过标准输入/输出 (stdin/stdout) 与 AI 客户端通信，
 * 适用于 CodeBuddy / Claude Desktop 等工具的 MCP 配置。
 * 
 * 架构:
 *   AI Client (CodeBuddy) <--MCP (stdio)--> 本进程 (内存中 Mock PPT 操作)
 * 
 * 如需连接前端 Vue 应用，请使用 bridge 模式 (npm run mcp:server)
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createPPTKitMCPServer } from './server.js'
import type { PPTOperations, SlideData, PresentationData } from './types.js'

// ==================== 内存 PPT 操作实现 ====================

function createMemoryOperations(): PPTOperations {
  const slides: SlideData[] = [
    {
      id: 'slide_1',
      title: '欢迎使用 PPT Kit',
      markdown: '# 欢迎使用 PPT Kit\n\n通过 MCP 协议，AI 可以帮你创建和编辑演示文稿。',
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
        name: 'PPT Kit Presentation',
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
          layout: hasCode ? 'code' : (sections.indexOf(section) === 0 ? 'title' : 'content'),
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
        status: 'stdio 模式下无法直接导出文件，请使用 bridge 模式连接前端应用'
      }
    }
  }
}

// ==================== 启动 Stdio MCP Server ====================

async function main() {
  const operations = createMemoryOperations()
  const mcpServer = createPPTKitMCPServer(operations)

  const transport = new StdioServerTransport()
  await mcpServer.server.connect(transport)

  // 注意: stdio 模式下不能用 console.log（会干扰协议通信）
  // 使用 stderr 输出日志
  process.stderr.write('PPT Kit MCP Server (stdio) 已启动\n')
}

main().catch((err) => {
  process.stderr.write(`启动失败: ${err.message}\n`)
  process.exit(1)
})
