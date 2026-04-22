<template>
  <OptimizeContent
    ref="optimizeContentRef"
    @back="router.push('/ai')"
    @replace="handleReplaceText"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import OptimizeContent from '@/components/OptimizeContent.vue'
import { isOfficeContext } from '@/modules/powerpoint-api'

const router = useRouter()
const optimizeContentRef = ref<InstanceType<typeof OptimizeContent> | null>(null)

async function handleReplaceText(data: { original: string; optimized: string }) {
  try {
    if (!isOfficeContext()) {
      ElMessage.info('非 Office 环境，无法替换')
      return
    }

    const Office = (globalThis as any).Office
    const PowerPoint = Office.PowerPoint || (globalThis as any).PowerPoint
    const supports14 = !!Office.context.requirements?.isSetSupported?.('PowerPointApi', '1.4')

    if (supports14) {
      let replaced = false
      await PowerPoint.run(async (context: any) => {
        const slides = context.presentation.slides
        slides.load('items')
        await context.sync()
        for (let si = 0; si < slides.items.length; si++) {
          const slide = slides.items[si]
          const shapes = slide.shapes
          shapes.load('items/textFrame/textRange/text')
          await context.sync()
          for (let shi = 0; shi < shapes.items.length; shi++) {
            const shape = shapes.items[shi]
            try {
              const currentText = shape.textFrame?.textRange?.text
              if (currentText && currentText.includes(data.original)) {
                shape.textFrame.textRange.text = currentText.replace(data.original, data.optimized)
                await context.sync()
                replaced = true
              }
            } catch { /* skip */ }
          }
        }
      })
      ElMessage({ message: replaced ? '已替换到幻灯片' : '未找到匹配文本', type: replaced ? 'success' : 'info' })
    } else {
      ElMessage.info('请先选中包含要替换文本的文本框')
    }
  } catch (e) {
    ElMessage.error('替换失败: ' + (e as Error).message)
  } finally {
    optimizeContentRef.value?.setReplacing(false)
  }
}
</script>
