/**
 * PPT Kit - PowerPoint API 桥接模块
 *
 * 当运行在 Office Add-in 环境中时，可以通过 PowerPoint.run() API
 * 直接操作当前演示文稿中的幻灯片。
 *
 * 在非 Office 环境中（普通浏览器），这些功能会静默跳过。
 */

/** 检测是否在 Office Add-in 环境中运行 */
export function isOfficeContext(): boolean {
  return !!(globalThis as any).Office?.context
}

/**
 * 获取 Office 上下文（如果可用）
 */
export function getOfficeContext() {
  if (isOfficeContext()) {
    return (globalThis as any).Office
  }
  return null
}

/** 大纲幻灯片数据 */
export interface OutlineSlide {
  title: string
  bullets: string[]
}

/**
 * 根据主题生成 PPT 大纲
 * 目前使用本地模拟逻辑，后续可接入 AI API
 */
export function generateOutline(topic: string, pageCount?: number, language?: string): OutlineSlide[] {
  const count = pageCount && pageCount > 0 ? Math.min(pageCount, 20) : 6

  // 根据主题生成大纲结构
  const outlineTemplates: Record<string, OutlineSlide[]> = {
    default: [
      { title: topic, bullets: ['项目概述与背景介绍', '核心价值与目标'] },
      { title: '背景与现状', bullets: ['行业现状分析', '面临的挑战与机遇', '市场需求洞察'] },
      { title: '核心方案', bullets: ['解决方案概述', '技术架构设计', '关键功能特性', '创新亮点'] },
      { title: '实施计划', bullets: ['阶段一：需求调研与设计', '阶段二：开发与测试', '阶段三：上线与推广', '里程碑节点'] },
      { title: '预期成果', bullets: ['量化目标与 KPI', '业务价值评估', '用户体验提升', '成本效益分析'] },
      { title: '总结与展望', bullets: ['项目总结', '下一步计划', '感谢与问答'] },
    ]
  }

  let slides = outlineTemplates.default

  // 根据页数调整
  if (count < slides.length) {
    slides = slides.slice(0, count)
  } else if (count > slides.length) {
    // 补充更多页面
    const extras = [
      { title: '团队介绍', bullets: ['核心团队成员', '专业背景与经验', '分工与协作'] },
      { title: '竞品分析', bullets: ['主要竞争对手', '差异化优势', '市场定位'] },
      { title: '技术细节', bullets: ['技术选型', '系统架构', '性能指标'] },
      { title: '风险评估', bullets: ['潜在风险识别', '应对策略', '风险监控机制'] },
      { title: '案例展示', bullets: ['成功案例一', '成功案例二', '客户反馈'] },
      { title: '数据分析', bullets: ['关键数据指标', '趋势分析', '数据驱动决策'] },
      { title: '用户反馈', bullets: ['用户调研结果', '满意度评分', '改进建议'] },
      { title: '路线图', bullets: ['短期目标 (1-3月)', '中期目标 (3-6月)', '长期目标 (6-12月)'] },
    ]
    for (let i = slides.length; i < count && i - slides.length < extras.length; i++) {
      slides.push(extras[i - slides.length])
    }
  }

  // 替换第一页标题为用户输入的主题
  if (slides.length > 0) {
    slides[0].title = topic
  }

  return slides
}

/**
 * 将大纲内容写入 PowerPoint 演示文稿
 * 自动检测 API 版本：
 *   - PowerPointApi 1.4+  → 使用 textFrame API 直接读写形状文本
 *   - PowerPointApi 1.1~1.2（Office 2021 等） → 使用 Common API setSelectedDataAsync 写入
 */
export async function applyOutlineToPowerPoint(outline: OutlineSlide[]): Promise<{ success: boolean; message: string }> {
  if (!isOfficeContext()) {
    return { success: false, message: '当前不在 Office 环境中' }
  }

  console.log('[PowerPoint API] 开始写入大纲，共', outline.length, '页')
  console.log('[PowerPoint API] 大纲内容:', outline)

  // 使用 textFrame API 方法，它能直接设置文本框内容，覆盖默认占位符
  console.log('[PowerPoint API] 使用 textFrame API 方法')
  return applyOutlineViaTextFrame(outline)
}

/**
 * 方案 A：通过 textFrame API 写入大纲（PowerPointApi 1.4+）
 * 适用于 Microsoft 365 订阅版
 */
async function applyOutlineViaTextFrame(outline: OutlineSlide[]): Promise<{ success: boolean; message: string }> {
  try {
    const PowerPoint = (globalThis as any).Office.PowerPoint || (globalThis as any).PowerPoint

    await PowerPoint.run(async (context: any) => {
      const presentation = context.presentation
      const slides = presentation.slides
      slides.load('items')
      await context.sync()

      // 删除多余的幻灯片（保留第一张）
      const existingCount = slides.items.length
      for (let i = existingCount - 1; i > 0; i--) {
        slides.items[i].delete()
      }
      await context.sync()

      // 处理所有幻灯片
      for (let i = 0; i < outline.length; i++) {
        let slide
        if (i === 0) {
          // 使用第一张幻灯片
          slide = slides.items[0]
        } else {
          // 添加新幻灯片
          presentation.slides.add()
          await context.sync()
          slides.load('items')
          await context.sync()
          slide = slides.items[slides.items.length - 1]
        }

        const shapes = slide.shapes
        shapes.load('items,items/textFrame')
        await context.sync()

        let titleSet = false
        let bodySet = false
        
        // 尝试使用现有文本框
        for (const shape of shapes.items) {
          try {
            shape.textFrame.load('textRange')
            await context.sync()

            if (!titleSet) {
              shape.textFrame.textRange.text = outline[i].title
              titleSet = true
            } else if (!bodySet) {
              shape.textFrame.textRange.text = outline[i].bullets.join('\n')
              bodySet = true
            }
          } catch {
            // 某些形状没有 textFrame，跳过
          }
        }
        
        // 如果没有找到文本框，创建新的文本框
        if (!titleSet || !bodySet) {
          try {
            // 尝试使用addShape方法创建文本框
            try {
              // 创建标题文本框
              if (!titleSet) {
                const titleShape = shapes.addShape(
                  1, // Rectangle
                  50,
                  50,
                  800,
                  100
                )
                titleShape.textFrame.textRange.text = outline[i].title
                titleSet = true
                await context.sync()
              }
              
              // 创建正文文本框
              if (!bodySet) {
                const bodyShape = shapes.addShape(
                  1, // Rectangle
                  50,
                  170,
                  800,
                  400
                )
                bodyShape.textFrame.textRange.text = outline[i].bullets.join('\n')
                bodySet = true
                await context.sync()
              }
            } catch (e) {
              console.warn('创建文本框失败:', e)
            }
          } catch (error) {
            console.error('创建文本框失败:', error)
          }
        }
      }
      
      await context.sync()
    })

    return { success: true, message: `已生成 ${outline.length} 张幻灯片` }
  } catch (e) {
    console.error('[PowerPoint API][A] 写入失败:', e)
    return { success: false, message: `操作失败: ${(e as Error).message}` }
  }
}

/**
 * 方案 B：通过 Common API 写入大纲（兼容 Office 2021 等只支持 1.1~1.2 的版本）
 *
 * 思路：
 *   1. 使用 PowerPoint.run 添加幻灯片
 *   2. 使用 Common API 的 setSelectedDataAsync 方法添加内容
 */
async function applyOutlineViaCommonApi(outline: OutlineSlide[]): Promise<{ success: boolean; message: string }> {
  const Office = (globalThis as any).Office
  const PowerPoint = Office.PowerPoint || (globalThis as any).PowerPoint

  try {
    console.log('[PowerPoint API][B] 开始处理大纲:', outline)
    
    // 第一步：用 PowerPoint.run 管理幻灯片结构
    await PowerPoint.run(async (context: any) => {
      const presentation = context.presentation
      const slides = presentation.slides
      slides.load('items')
      await context.sync()

      // 删除所有幻灯片，重新创建
      const existingCount = slides.items.length
      console.log('[PowerPoint API][B] 当前幻灯片数量:', existingCount)
      
      for (let i = existingCount - 1; i >= 0; i--) {
        slides.items[i].delete()
      }
      await context.sync()
      console.log('[PowerPoint API][B] 已删除所有幻灯片')

      // 添加需要的幻灯片数量
      for (let i = 0; i < outline.length; i++) {
        presentation.slides.add()
      }
      await context.sync()
      console.log('[PowerPoint API][B] 已添加', outline.length, '张幻灯片')
    })

    // 第二步：使用 Common API 逐页写入内容
    for (let i = 0; i < outline.length; i++) {
      console.log('[PowerPoint API][B] 处理第', i + 1, '页:', outline[i])
      
      // 跳转到当前幻灯片
      await goToSlideIndex(Office, i)
      
      // 等待幻灯片切换完成
      await sleep(300)
      
      // 准备内容
      const slideContent = outline[i].title + '\n\n' + outline[i].bullets.join('\n')
      console.log('[PowerPoint API][B] 准备写入内容:', slideContent)
      
      // 写入内容
      await setSelectedText(Office, slideContent)
      console.log('[PowerPoint API][B] 已写入第', i + 1, '页内容')
    }

    console.log('[PowerPoint API][B] 所有幻灯片处理完成')
    return { success: true, message: `已生成 ${outline.length} 张幻灯片（兼容模式）` }
  } catch (e) {
    console.error('[PowerPoint API][B] 写入失败:', e)
    return { success: false, message: `操作失败: ${(e as Error).message}` }
  }
}

/** 通过 Common API 跳转到指定索引的幻灯片 */
function goToSlideIndex(Office: any, index: number): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      Office.context.document.goToByIdAsync(
        index + 1, // Office 幻灯片从 1 开始
        Office.GoToType.Index,
        (result: any) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve()
          } else {
            console.warn(`[PowerPoint API][B] goToByIdAsync 失败:`, result.error?.message)
            resolve() // 不中断流程
          }
        }
      )
    } catch {
      resolve() // 不中断流程
    }
  })
}

/** 通过 Common API 写入文本到当前选中位置 */
function setSelectedText(Office: any, text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      Office.context.document.setSelectedDataAsync(
        text,
        { coercionType: Office.CoercionType.Text },
        (result: any) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve()
          } else {
            console.warn(`[PowerPoint API][B] setSelectedDataAsync 失败:`, result.error?.message)
            resolve() // 不中断流程
          }
        }
      )
    } catch {
      resolve()
    }
  })
}

/** 简单的延时函数 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 从当前 PowerPoint 演示文稿中读取所有幻灯片的标题和内容
 * 返回与 store Slide 结构兼容的数据
 */
export async function fetchSlidesFromPowerPoint(): Promise<Array<{
  id: string
  title: string
  markdown: string
  layout: 'title' | 'content' | 'two-column' | 'code' | 'blank'
}>> {
  if (!isOfficeContext()) {
    return []
  }

  const Office = (globalThis as any).Office
  const supports14 = !!Office.context.requirements?.isSetSupported?.('PowerPointApi', '1.4')

  if (!supports14) {
    console.warn('[PowerPoint API] fetchSlidesFromPowerPoint 需要 PowerPointApi 1.4+')
    return []
  }

  try {
    const PowerPoint = Office.PowerPoint || (globalThis as any).PowerPoint
    const result: Array<{
      id: string
      title: string
      markdown: string
      layout: 'title' | 'content' | 'two-column' | 'code' | 'blank'
    }> = []

    await PowerPoint.run(async (context: any) => {
      const presentation = context.presentation
      const slides = presentation.slides
      slides.load('items')
      await context.sync()

      for (let i = 0; i < slides.items.length; i++) {
        const slide = slides.items[i]
        const shapes = slide.shapes
        shapes.load('items')
        await context.sync()

        let slideTitle = ''
        const bodyTexts: string[] = []

        for (const shape of shapes.items) {
          try {
            shape.textFrame.load('textRange')
            await context.sync()
            const text = shape.textFrame.textRange.text || ''

            if (!slideTitle && text.trim()) {
              // 第一个有文本的形状作为标题
              slideTitle = text.trim()
            } else if (text.trim()) {
              bodyTexts.push(text.trim())
            }
          } catch {
            // 某些形状没有 textFrame，跳过
          }
        }

        const layout: 'title' | 'content' = i === 0 ? 'title' : 'content'
        const bullets = bodyTexts.map(t => `- ${t}`).join('\n')
        const markdown = bodyTexts.length > 0
          ? `# ${slideTitle}\n\n${bullets}`
          : `# ${slideTitle || '幻灯片 ' + (i + 1)}`

        result.push({
          id: `ppt_slide_${i}_${Date.now()}`,
          title: slideTitle || `幻灯片 ${i + 1}`,
          markdown,
          layout
        })
      }
    })

    return result
  } catch (e) {
    console.error('[PowerPoint API] 读取幻灯片失败:', e)
    return []
  }
}

/**
 * 将当前 PPT Kit 幻灯片内容写入 PowerPoint 演示文稿
 */
export async function syncToPowerPoint(slides: Array<{
  title: string
  markdown: string
  layout: string
}>): Promise<{ success: boolean; message: string }> {
  const outline: OutlineSlide[] = slides.map(s => ({
    title: s.title,
    bullets: extractBodyText(s.markdown).split('\n').filter(l => l.trim())
  }))
  return applyOutlineToPowerPoint(outline)
}

/**
 * 从 Markdown 中提取正文文本（去掉标题和代码块）
 */
function extractBodyText(markdown: string): string {
  return markdown
    .split('\n')
    .filter(line => {
      const trimmed = line.trim()
      return trimmed &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('```') &&
        !trimmed.startsWith('|') &&
        !trimmed.startsWith('![') &&
        !trimmed.startsWith('---')
    })
    .map(line => line.replace(/^[-*]\s+/, '- ').replace(/\*\*/g, '').replace(/`/g, ''))
    .join('\n')
    .slice(0, 2000)
}
