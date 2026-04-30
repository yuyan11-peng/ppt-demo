<template>
  <div class="sub-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="router.push('/ai')" />
      <span class="page-title">AI 图标生成</span>
    </div>
    <div class="page-body">
      <div class="chat-container">
        <div class="chat-messages" ref="chatMessagesRef">
          <template v-for="(msg, index) in chatMessages" :key="index">
            <div 
              v-if="msg.type === 'text'"
              class="chat-message"
              :class="msg.role"
            >
              <div class="message-content">
                <div class="text-content">{{ msg.content }}</div>
              </div>
            </div>
            <div 
              v-else-if="msg.type === 'icon-group'"
              class="chat-message ai"
            >
              <div class="message-content icon-group-content">
                <div class="icon-grid">
                  <div 
                    v-for="(icon, iconIndex) in msg.icons" 
                    :key="icon.iconKey"
                    class="icon-grid-item"
                  >
                    <div 
                      class="result-icon"
                      :class="{ 'icon-loading': !icon.loaded }"
                      :style="{ backgroundColor: icon.bgColor }"
                      @click="insertIconToPowerPoint(icon)"
                    >
                      <svg 
                        v-if="icon.path"
                        :width="selectedSize"
                        :height="selectedSize"
                        viewBox="0 0 24 24"
                        fill="none"
                        :style="{ color: icon.color }"
                      >
                        <path :d="icon.path" fill="currentColor" />
                      </svg>
                    </div>
                    <div v-if="!icon.loaded && !icon.error" class="icon-loading-overlay">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      <span>图标生成中...</span>
                    </div>
                    <div v-if="icon.error" class="icon-error-tip">图标生成失败</div>
                  </div>
                </div>
                <div class="icon-actions">
                  <button class="icon-action-btn" @click="regenerateIconGroup(msg)">重新生成</button>
                  <button class="icon-action-btn" @click="reEditPrompt(msg)">重新编辑</button>
                </div>
              </div>
            </div>
          </template>
          <div v-if="aiIconLoading" class="chat-message ai">
            <div class="message-content">
              <div class="loading-content">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>正在生成图标...</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chat-input">
          <!-- 图标设置 -->
          <div class="settings-panel">
            <!-- 尺寸选择 -->
            <div class="setting-row">
              <span class="setting-label">尺寸:</span>
              <div class="size-options">
                <span 
                  v-for="size in iconSizes" 
                  :key="size"
                  class="size-option"
                  :class="{ active: selectedSize === size }"
                  @click="selectedSize = size"
                >{{ size }}x{{ size }}</span>
              </div>
            </div>

            <!-- 颜色选择 -->
            <div class="setting-row">
              <span class="setting-label">颜色:</span>
              <div class="color-options">
                <div 
                  v-for="color in presetColors" 
                  :key="color.value"
                  class="color-option"
                  :style="{ background: color.value }"
                  :class="{ active: selectedColor === color.value }"
                  @click="selectedColor = color.value"
                ></div>
                <div class="color-custom">
                  <input 
                    type="color" 
                    :value="selectedColor" 
                    @input="handleCustomColorChange"
                    class="color-picker"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 输入框 -->
          <el-input
            v-model="iconPrompt"
            type="textarea"
            placeholder="描述你想要的图标，例如：购物车、用户头像、设置..."
            :rows="2"
            resize="none"
            @keydown.enter.ctrl="handleAIIconGenerate"
            @keydown.enter.meta="handleAIIconGenerate"
          />
          
          <div class="chat-input-toolbar">
            <div class="toolbar-spacer"></div>
            <el-button
              type="primary"
              @click="handleAIIconGenerate"
              :loading="aiIconLoading"
              class="send-button"
            >
              <el-icon><Promotion /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Loading, Promotion } from '@element-plus/icons-vue'

const router = useRouter()
const iconPrompt = ref('')
const aiIconLoading = ref(false)
const chatMessagesRef = ref<HTMLElement>()
const isListeningSelection = ref(true)
const selectedSize = ref(24)
const selectedColor = ref('#333333')

// 图标尺寸选项
const iconSizes = [16, 24, 32, 48, 64]

// 预设颜色
const presetColors = [
  { value: '#333333' },
  { value: '#409eff' },
  { value: '#67c23a' },
  { value: '#f56c6c' },
  { value: '#f5a623' },
  { value: '#909399' },
]

onMounted(() => {
  const Office = (globalThis as any).Office
  if (!Office?.context?.document) return

  Office.context.document.addHandlerAsync(
    Office.EventType.DocumentSelectionChanged,
    onSelectionChanged
  )
})

onUnmounted(() => {
  const Office = (globalThis as any).Office
  if (!Office?.context?.document) return

  Office.context.document.removeHandlerAsync(
    Office.EventType.DocumentSelectionChanged,
    { handler: onSelectionChanged }
  )
})

function onSelectionChanged() {
  if (!isListeningSelection.value) return

  const Office = (globalThis as any).Office
  Office.context.document.getSelectedDataAsync(
    Office.CoercionType.Text,
    (result: any) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        const text = (result.value as string || '').trim()
        if (text) {
          iconPrompt.value = text
          ElMessage.success('已将选中文本复制到输入框')
        }
      }
    }
  )
}

interface ChatMessage {
  role: 'user' | 'ai'
  type: 'text' | 'icon-group'
  content: string
  prompt?: string
  icons?: GeneratedIcon[]
}

interface GeneratedIcon {
  path: string
  color: string
  bgColor: string
  svgContent: string
  loaded: boolean
  error: boolean
  iconKey: number
}

const chatMessages = ref<ChatMessage[]>([])

// 模拟图标路径
const mockIconPaths = [
  'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
]

function getRandomBgColor(index: number): string {
  const colors = [
    '#f0f5ff',
    '#f6ffed',
    '#fff7e6',
    '#fff1f0',
  ]
  return colors[index % colors.length]
}

function handleCustomColorChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedColor.value = target.value
}

async function handleAIIconGenerate() {
  const prompt = iconPrompt.value.trim()
  if (!prompt) {
    ElMessage.warning('请输入图标描述')
    return
  }

  chatMessages.value.push({
    role: 'user',
    type: 'text',
    content: prompt
  })

  iconPrompt.value = ''
  aiIconLoading.value = true

  await scrollToBottom()

  // 生成4个图标
  const icons: GeneratedIcon[] = []
  for (let i = 0; i < 4; i++) {
    icons.push({
      path: mockIconPaths[i],
      color: selectedColor.value,
      bgColor: getRandomBgColor(i),
      svgContent: `<svg viewBox="0 0 24 24" fill="none"><path d="${mockIconPaths[i]}" fill="${selectedColor.value}"/></svg>`,
      loaded: false,
      error: false,
      iconKey: Date.now() + i
    })
  }

  chatMessages.value.push({
    role: 'ai',
    type: 'icon-group',
    content: '',
    prompt: prompt,
    icons: icons
  })

  aiIconLoading.value = false
  await scrollToBottom()

  // 模拟加载
  setTimeout(() => {
    chatMessages.value.forEach(msg => {
      if (msg.type === 'icon-group' && msg.icons) {
        msg.icons.forEach(icon => {
          icon.loaded = true
        })
      }
    })
  }, 500)
}

function regenerateIconGroup(msg: ChatMessage) {
  if (!msg.prompt) return
  
  // 重新生成图标
  const newIcons: GeneratedIcon[] = []
  for (let i = 0; i < 4; i++) {
    newIcons.push({
      path: mockIconPaths[i],
      color: selectedColor.value,
      bgColor: getRandomBgColor(i),
      svgContent: `<svg viewBox="0 0 24 24" fill="none"><path d="${mockIconPaths[i]}" fill="${selectedColor.value}"/></svg>`,
      loaded: false,
      error: false,
      iconKey: Date.now() + i
    })
  }
  
  msg.icons = newIcons
  
  // 模拟加载
  setTimeout(() => {
    msg.icons?.forEach(icon => {
      icon.loaded = true
    })
  }, 500)
}

function reEditPrompt(msg: ChatMessage) {
  if (!msg.prompt) return
  iconPrompt.value = msg.prompt
  nextTick(() => {
    const textarea = document.querySelector('.chat-input .el-textarea__inner') as HTMLTextAreaElement
    textarea?.focus()
  })
}

async function scrollToBottom() {
  await nextTick()
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  }
}

// 插入图标到PowerPoint
async function insertIconToPowerPoint(icon: GeneratedIcon) {
  try {
    const Office = (globalThis as any).Office
    if (!Office?.context?.document) {
      ElMessage.error('当前不在 Office 环境中')
      return
    }

    // 生成SVG字符串
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${selectedSize.value}" height="${selectedSize.value}" viewBox="0 0 24 24" fill="none">
      <path d="${icon.path}" fill="${icon.color}"/>
    </svg>`

    // 转换为base64
    const base64 = btoa(svgContent)

    ElMessage.info('正在插入图标到 PowerPoint...')
    
    await insertSvgViaCommonApi(base64)
    ElMessage.success('图标已插入到 PowerPoint')
  } catch (error) {
    console.error('插入图标失败:', error)
    ElMessage.error('插入图标失败: ' + (error as Error).message)
  }
}

// 使用Common API插入SVG
async function insertSvgViaCommonApi(base64Data: string) {
  const Office = (globalThis as any).Office
  
  return new Promise((resolve, reject) => {
    Office.context.document.setSelectedDataAsync(
      base64Data,
      { coercionType: Office.CoercionType.Image },
      (result: any) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve(null)
        } else {
          reject(new Error(result.error?.message || '插入图标失败'))
        }
      }
    )
  })
}
</script>

<style scoped>
.sub-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.page-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.page-body {
  flex: 1;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.icon-group-content {
  max-width: 320px !important;
  width: 320px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(2, 140px);
  gap: 8px;
}

.icon-grid-item {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 12px;
  overflow: hidden;
}

.icon-grid-item .result-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid #eee;
  cursor: pointer;
  transition: opacity 0.3s;
}

.icon-grid-item .result-icon.icon-loading {
  opacity: 0;
  position: absolute;
}

.icon-grid-item .icon-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f5f7fa;
  border-radius: 12px;
  font-size: 14px;
  color: #666;
}

.icon-grid-item .icon-error-tip {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef0f0;
  border-radius: 12px;
  font-size: 13px;
  color: #f56c6c;
}

.chat-message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.chat-message.ai {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-message.user .message-content {
  align-items: flex-end;
}

.text-content {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  word-break: break-word;
}

.chat-message.user .text-content {
  background: #409eff;
  color: #fff;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 12px;
  font-size: 14px;
  color: #666;
}

.icon-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.icon-action-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 0;
  transition: color 0.2s;
}

.icon-action-btn:hover {
  color: #666;
}

.chat-input {
  padding: 16px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 10px;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-label {
  font-size: 13px;
  color: #666;
  min-width: 40px;
}

.size-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.size-option {
  padding: 4px 10px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.size-option:hover {
  border-color: #d0d0d0;
}

.size-option.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.color-options {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-option {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #409eff;
  transform: scale(1.15);
}

.color-custom {
  margin-left: 4px;
}

.color-picker {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border-radius: 50%;
  border: 2px solid #e8e8e8;
}

.chat-input .el-textarea__inner {
  border-radius: 10px;
  padding: 12px 16px;
  border-color: #dcdfe6;
}

.chat-input-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-spacer {
  flex: 1;
}

.send-button {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
