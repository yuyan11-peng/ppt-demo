/**
 * PPT Kit MCP Server - Zod 输入验证模式
 */
import { z } from 'zod'

const ResponseFormatSchema = z.enum(['json', 'markdown']).optional().describe('响应格式')

export const GetInfoInputSchema = z.object({
  response_format: ResponseFormatSchema
})

export const CreateSlideInputSchema = z.object({
  title: z.string().describe('幻灯片标题'),
  layout: z.enum(['title', 'content', 'two-column', 'code', 'blank']).optional().describe('布局类型，默认 content'),
  response_format: ResponseFormatSchema
})

export const DeleteSlideInputSchema = z.object({
  slide_id: z.string().describe('要删除的幻灯片 ID'),
  response_format: ResponseFormatSchema
})

export const ListSlidesInputSchema = z.object({
  limit: z.number().optional().describe('返回最大数量，默认 20'),
  offset: z.number().optional().describe('跳过数量，用于分页，默认 0'),
  response_format: ResponseFormatSchema
})

export const AddContentInputSchema = z.object({
  slide_id: z.string().describe('目标幻灯片 ID'),
  content: z.string().describe('内容文本'),
  content_type: z.enum(['text', 'code', 'image', 'mermaid']).describe('内容类型'),
  language: z.string().optional().describe('编程语言（当 content_type 为 code 时使用）'),
  response_format: ResponseFormatSchema
})

export const AddCodeBlockInputSchema = z.object({
  slide_id: z.string().describe('目标幻灯片 ID'),
  code: z.string().max(50000).describe('源代码内容，最大 50000 字符'),
  language: z.string().describe('编程语言，如: javascript, python, typescript'),
  response_format: ResponseFormatSchema
})

export const AddMermaidInputSchema = z.object({
  slide_id: z.string().describe('目标幻灯片 ID'),
  mermaid_code: z.string().describe('Mermaid 语法代码'),
  response_format: ResponseFormatSchema
})

export const MarkdownToSlidesInputSchema = z.object({
  markdown: z.string().max(100000).describe('Markdown 内容，最大 100000 字符'),
  response_format: ResponseFormatSchema
})

export const UpdateSlideInputSchema = z.object({
  slide_id: z.string().describe('目标幻灯片 ID'),
  markdown: z.string().describe('新的 Markdown 内容'),
  response_format: ResponseFormatSchema
})

export const ExportPptxInputSchema = z.object({
  filename: z.string().optional().describe('文件名（不含扩展名）'),
  response_format: ResponseFormatSchema
})
