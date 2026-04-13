/**
 * PPT Kit MCP Server - 类型定义
 * 定义服务端与客户端之间的通信接口
 */

/** 幻灯片内容项 */
export interface SlideContent {
  type: 'text' | 'code' | 'image' | 'mermaid'
  value: string
  language?: string
}

/** 幻灯片数据 */
export interface SlideData {
  id: string
  title: string
  markdown: string
  contents: SlideContent[]
  layout: 'title' | 'content' | 'two-column' | 'code' | 'blank'
  createdAt: number
}

/** 演示文稿信息 */
export interface PresentationData {
  name: string
  author: string
  slideCount: number
  slides: SlideData[]
}

/** WebSocket 消息类型 */
export type WSMessageType =
  | 'ppt_create_slide'
  | 'ppt_delete_slide'
  | 'ppt_list_slides'
  | 'ppt_get_info'
  | 'ppt_add_content'
  | 'ppt_add_code_block'
  | 'ppt_add_mermaid'
  | 'ppt_from_markdown'
  | 'ppt_update_slide'
  | 'ppt_export_pptx'

/** WebSocket 请求消息 */
export interface WSRequest {
  id: string
  type: WSMessageType
  params: Record<string, any>
}

/** WebSocket 响应消息 */
export interface WSResponse {
  id: string
  success: boolean
  data?: any
  error?: string
}

/** PPT 操作接口 - 由前端或 Mock 实现 */
export interface PPTOperations {
  getPresentationInfo(): Promise<PresentationData>
  createSlide(title: string, layout: string): Promise<SlideData>
  deleteSlide(slideId: string): Promise<{ deleted: boolean }>
  listSlides(limit: number, offset: number): Promise<{ slides: SlideData[]; total: number }>
  addContent(slideId: string, content: string, contentType: string, language?: string): Promise<SlideData>
  addCodeBlock(slideId: string, code: string, language: string): Promise<SlideData>
  addMermaid(slideId: string, mermaidCode: string): Promise<SlideData>
  generateFromMarkdown(markdown: string): Promise<{ slides: SlideData[]; count: number }>
  updateSlide(slideId: string, markdown: string): Promise<SlideData>
  exportPptx(filename?: string): Promise<{ filename: string; status: string }>
}
