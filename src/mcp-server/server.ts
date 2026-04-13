/**
 * PPT Kit MCP Server - 核心服务器
 * 创建 MCP Server 并注册所有 PPT 操作工具
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  CreateSlideInputSchema,
  AddContentInputSchema,
  AddCodeBlockInputSchema,
  AddMermaidInputSchema,
  MarkdownToSlidesInputSchema,
  ListSlidesInputSchema,
  DeleteSlideInputSchema,
  GetInfoInputSchema,
  UpdateSlideInputSchema,
  ExportPptxInputSchema
} from './schemas.js'
import type { PPTOperations } from './types.js'

const CHARACTER_LIMIT = 25000

/** 格式化响应 */
function formatResponse(data: any, format: string) {
  if (format === 'markdown') {
    return {
      content: [{ type: 'text' as const, text: '```json\n' + JSON.stringify(data, null, 2) + '\n```' }]
    }
  }
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }]
  }
}

/** 创建 PPT Kit MCP Server */
export function createPPTKitMCPServer(operations: PPTOperations) {
  const server = new McpServer({
    name: 'ppt-kit',
    version: '1.0.0'
  })

  // ==================== 工具注册 ====================

  // 1. 获取演示文稿信息
  server.tool(
    'ppt_get_info',
    `获取当前演示文稿的信息，包括幻灯片数量、标题、作者等。
    
返回:
- name: 演示文稿名称
- author: 作者
- slideCount: 幻灯片总数`,
    GetInfoInputSchema.shape,
    async (params) => {
      try {
        const info = await operations.getPresentationInfo()
        return formatResponse({ success: true, ...info }, params.response_format ?? 'json')
      } catch (e: any) {
        return formatResponse({ success: false, error: e.message }, params.response_format ?? 'json')
      }
    }
  )

  // 2. 创建幻灯片
  server.tool(
    'ppt_create_slide',
    `创建一张新的幻灯片。
    
参数:
- title: 幻灯片标题 (必填)
- layout: 布局类型 (可选，默认 content)
  可选值: title | content | two-column | code | blank

返回新建幻灯片的 ID 和详细信息。`,
    CreateSlideInputSchema.shape,
    async (params) => {
      try {
        const slide = await operations.createSlide(params.title, params.layout ?? 'content')
        return formatResponse({ success: true, slide }, params.response_format ?? 'json')
      } catch (e: any) {
        return formatResponse({ success: false, error: e.message }, params.response_format ?? 'json')
      }
    }
  )

  // 3. 删除幻灯片
  server.tool(
    'ppt_delete_slide',
    `删除指定的幻灯片。

参数:
- slide_id: 要删除的幻灯片 ID (必填)

注意: 至少需要保留一张幻灯片。`,
    DeleteSlideInputSchema.shape,
    async (params) => {
      try {
        const result = await operations.deleteSlide(params.slide_id)
        return formatResponse({ success: true, ...result }, params.response_format ?? 'json')
      } catch (e: any) {
        return formatResponse({ success: false, error: e.message }, params.response_format ?? 'json')
      }
    }
  )

  // 4. 列出幻灯片
  server.tool(
    'ppt_list_slides',
    `列出当前演示文稿中的所有幻灯片。

参数:
- limit: 返回最大数量 (可选，默认 20)
- offset: 跳过数量，用于分页 (可选，默认 0)

返回幻灯片列表，包含每张幻灯片的 ID、标题和布局。`,
    ListSlidesInputSchema.shape,
    async (params) => {
      try {
        const result = await operations.listSlides(params.limit ?? 20, params.offset ?? 0)
        return formatResponse({ success: true, ...result }, params.response_format ?? 'json')
      } catch (e: any) {
        return formatResponse({ success: false, error: e.message }, params.response_format ?? 'json')
      }
    }
  )

  // 5. 添加内容
  server.tool(
    'ppt_add_content',
    `向指定幻灯片添加内容。

参数:
- slide_id: 目标幻灯片 ID (必填)
- content: 内容文本 (必填)
- content_type: 内容类型 (必填) - text | code | image | mermaid
- language: 编程语言 (当 content_type 为 code 时使用)`,
    AddContentInputSchema.shape,
    async (params) => {
      try {
        const slide = await operations.addContent(
          params.slide_id,
          params.content,
          params.content_type,
          params.language
        )
        return formatResponse({ success: true, slide }, params.response_format ?? 'json')
      } catch (e: any) {
        return formatResponse({ success: false, error: e.message }, params.response_format ?? 'json')
      }
    }
  )

  // 6. 添加代码块
  server.tool(
    'ppt_add_code_block',
    `向幻灯片添加带语法高亮的代码块。

参数:
- slide_id: 目标幻灯片 ID (必填)
- code: 源代码内容 (必填, 最大 50000 字符)
- language: 编程语言 (必填, 如: javascript, python, typescript)`,
    AddCodeBlockInputSchema.shape,
    async (params) => {
      try {
        const slide = await operations.addCodeBlock(params.slide_id, params.code, params.language)
        return formatResponse({ success: true, slide }, params.response_format ?? 'json')
      } catch (e: any) {
        return formatResponse({ success: false, error: e.message }, params.response_format ?? 'json')
      }
    }
  )

  // 7. 添加 Mermaid 图表
  server.tool(
    'ppt_add_mermaid',
    `向幻灯片添加 Mermaid 图表。

参数:
- slide_id: 目标幻灯片 ID (必填)
- mermaid_code: Mermaid 语法代码 (必填)

支持: flowchart, sequenceDiagram, classDiagram, gantt 等。`,
    AddMermaidInputSchema.shape,
    async (params) => {
      try {
        const slide = await operations.addMermaid(params.slide_id, params.mermaid_code)
        return formatResponse({ success: true, slide }, params.response_format ?? 'json')
      } catch (e: any) {
        return formatResponse({ success: false, error: e.message }, params.response_format ?? 'json')
      }
    }
  )

  // 8. 从 Markdown 生成幻灯片
  server.tool(
    'ppt_from_markdown',
    `从 Markdown 内容批量生成幻灯片。

参数:
- markdown: Markdown 内容 (必填, 最大 100000 字符)

规则:
- 每个 # 或 ## 标题会创建一张新幻灯片
- 支持代码块 (\`\`\`language)
- 支持 Mermaid 图表 (\`\`\`mermaid)
- 支持列表、表格、引用等标准 Markdown 语法`,
    MarkdownToSlidesInputSchema.shape,
    async (params) => {
      try {
        const result = await operations.generateFromMarkdown(params.markdown)
        const response = JSON.stringify({ success: true, ...result }, null, 2)
        const truncated = response.length > CHARACTER_LIMIT
          ? response.substring(0, CHARACTER_LIMIT) + '\n... (truncated)'
          : response
        return {
          content: [{ type: 'text' as const, text: truncated }]
        }
      } catch (e: any) {
        return formatResponse({ success: false, error: e.message }, params.response_format ?? 'json')
      }
    }
  )

  // 9. 更新幻灯片内容
  server.tool(
    'ppt_update_slide',
    `更新指定幻灯片的 Markdown 内容。

参数:
- slide_id: 目标幻灯片 ID (必填)
- markdown: 新的 Markdown 内容 (必填)`,
    UpdateSlideInputSchema.shape,
    async (params) => {
      try {
        const slide = await operations.updateSlide(params.slide_id, params.markdown)
        return formatResponse({ success: true, slide }, params.response_format ?? 'json')
      } catch (e: any) {
        return formatResponse({ success: false, error: e.message }, params.response_format ?? 'json')
      }
    }
  )

  // 10. 导出 PPTX
  server.tool(
    'ppt_export_pptx',
    `导出当前演示文稿为 PPTX 文件。

参数:
- filename: 文件名 (可选, 不含扩展名)

注意: 导出操作将触发前端下载。`,
    ExportPptxInputSchema.shape,
    async (params) => {
      try {
        const result = await operations.exportPptx(params.filename)
        return formatResponse({ success: true, ...result }, params.response_format ?? 'json')
      } catch (e: any) {
        return formatResponse({ success: false, error: e.message }, params.response_format ?? 'json')
      }
    }
  )

  return server
}
