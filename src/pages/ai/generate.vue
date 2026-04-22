<template>
  <GeneratePPT
    ref="generatePPTRef"
    class="generate-ppt-wrapper"
    @back="router.push('/ai')"
    @generate="handleGenerateOutline"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import GeneratePPT from '@/components/GeneratePPT.vue'
import { generateOutline, applyOutlineToPowerPoint, isOfficeContext } from '@/modules/powerpoint-api'
import { useStore } from '@/store'

const router = useRouter()
const store = useStore()
const generatePPTRef = ref<InstanceType<typeof GeneratePPT> | null>(null)

async function handleGenerateOutline(data: {
  createType: string; prompt: string; pageCount: string; language: string; model: string; images: string[]
}) {
  try {
    const pageCount = data.pageCount ? parseInt(data.pageCount) : undefined
    const outline = generateOutline(data.prompt, pageCount, data.language)

    // 同步大纲数据到 store（localStorage），这样新窗口可以读取
    store.importFromOutline(outline, data.prompt)

    if (isOfficeContext()) {
      ElMessage.info('正在写入 PowerPoint...')
      const result = await applyOutlineToPowerPoint(outline)
      ElMessage({ message: result.message, type: result.success ? 'success' : 'error' })
    } else {
      ElMessage.info(`已生成 ${outline.length} 页大纲`)
    }
    router.push('/ai')
  } catch (e) {
    ElMessage.error('生成失败: ' + (e as Error).message)
  } finally {
    generatePPTRef.value?.setLoading(false)
  }
}
</script>

<style scoped>
.generate-ppt-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
