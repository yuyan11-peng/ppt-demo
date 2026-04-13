<template>
  <!-- Office 环境：显示任务窗格 -->
  <TaskPane v-if="inOffice" />

  <!-- 浏览器环境：显示完整编辑器 -->
  <div v-else class="app-container">
    <HeaderBar
      :presentation-name="store.presentationInfo.name"
      :slide-count="store.slideCount.value"
      :connection-state="bridge.connectionState.value"
      :request-count="bridge.requestCount.value"
      :in-office="inOffice"
      @export-pptx="handleExport"
      @sync-ppt="handleSyncToPowerPoint"
      @toggle-bridge="handleToggleBridge"
    />
    <div class="main-content">
      <SlidePanel
        :slides="store.slides"
        :current-index="store.currentSlideIndex.value"
        @select="store.setCurrentSlide"
        @create="handleCreateSlide"
        @delete="store.deleteSlide"
        @duplicate="store.duplicateSlide"
        @move-up="(i: number) => store.moveSlide(i, i - 1)"
        @move-down="(i: number) => store.moveSlide(i, i + 1)"
      />
      <MarkdownEditor
        v-if="store.currentSlide.value"
        :markdown="store.currentSlide.value.markdown"
        :layout="store.currentSlide.value.layout"
        @update:markdown="(val: string) => store.updateSlideMarkdown(store.currentSlideIndex.value, val)"
        @update:layout="(val: any) => store.updateSlideLayout(store.currentSlideIndex.value, val)"
      />
      <SlidePreview
        v-if="store.currentSlide.value"
        :markdown="store.currentSlide.value.markdown"
        :layout="store.currentSlide.value.layout"
      />
    </div>
    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <span class="toast-icon">{{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ' }}</span>
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import HeaderBar from './components/HeaderBar.vue'
import SlidePanel from './components/SlidePanel.vue'
import MarkdownEditor from './components/MarkdownEditor.vue'
import SlidePreview from './components/SlidePreview.vue'
import TaskPane from './components/TaskPane.vue'
import { useStore } from './store'
import { exportToPptx } from './modules/export'
import { useBridgeClient } from './bridge-client'
import { isOfficeContext, syncToPowerPoint } from './modules/powerpoint-api'

const store = useStore()
const bridge = useBridgeClient()

// 检测运行环境
const inOffice = ref(false)
const syncLoading = ref(false)

const toast = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

function handleCreateSlide() {
  store.createSlide()
  showToast('幻灯片已创建', 'success')
}

async function handleExport() {
  try {
    showToast('正在导出 PPTX...', 'info')
    await exportToPptx([...store.slides], {
      title: store.presentationInfo.name,
      author: store.presentationInfo.author
    })
    showToast('PPTX 导出成功！', 'success')
  } catch (e) {
    showToast('导出失败: ' + (e as Error).message, 'error')
  }
}

async function handleSyncToPowerPoint() {
  if (!isOfficeContext()) {
    showToast('请通过 PowerPoint 打开使用此功能', 'error')
    return
  }
  try {
    syncLoading.value = true
    showToast('正在同步到 PowerPoint...', 'info')
    const result = await syncToPowerPoint(store.slides)
    showToast(result.message, result.success ? 'success' : 'error')
  } catch (e) {
    showToast('同步失败: ' + (e as Error).message, 'error')
  } finally {
    syncLoading.value = false
  }
}

function handleToggleBridge() {
  if (bridge.isConnected()) {
    bridge.disconnect()
    showToast('已断开 MCP Bridge 连接', 'info')
  } else {
    bridge.connect()
    showToast('正在连接 MCP Bridge Server...', 'info')
  }
}

// 挂载时自动初始化
onMounted(() => {
  inOffice.value = isOfficeContext()
  bridge.initBridgeClient(store)
  bridge.connect()
})

onUnmounted(() => {
  bridge.disconnect()
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  box-shadow: var(--shadow-lg);
}

.toast.success {
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: #4caf50;
}

.toast.error {
  background: rgba(224, 92, 108, 0.15);
  border: 1px solid rgba(224, 92, 108, 0.3);
  color: #e05c6c;
}

.toast.info {
  background: rgba(108, 122, 224, 0.15);
  border: 1px solid rgba(108, 122, 224, 0.3);
  color: #6c7ae0;
}

.toast-icon {
  font-size: 16px;
  font-weight: 700;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
