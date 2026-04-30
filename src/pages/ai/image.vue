<template>
  <div class="sub-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="router.push('/ai')" />
      <span class="page-title">AI 生图</span>
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
              v-else-if="msg.type === 'image-group'"
              class="chat-message ai"
            >
              <div class="message-content image-group-content">
                <div class="image-grid">
                  <div 
                    v-for="(img, imgIndex) in msg.images" 
                    :key="img.imgKey"
                    class="image-grid-item"
                  >
                    <img
                      :src="img.content"
                      alt="生成的图片"
                      class="result-image"
                      :class="{ 'image-loading': !img.loaded }"
                      @click="insertImageToPowerPoint(img)"
                      @load="onImageLoaded(img)"
                      @error="onImageError(img)"
                    />
                    <div v-if="!img.loaded && !img.error" class="image-loading-overlay">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      <span>图片加载中...</span>
                    </div>
                    <div v-if="img.error" class="image-error-tip">图片加载失败</div>
                  </div>
                </div>
                <div class="image-actions">
                  <button class="image-action-btn" @click="regenerateImageGroup(msg)">重新生成</button>
                  <button class="image-action-btn" @click="reEditPrompt(msg)">重新编辑</button>
                </div>
              </div>
            </div>
          </template>
          <div v-if="aiImageLoading" class="chat-message ai">
            <div class="message-content">
              <div class="loading-content">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>正在生成图片...</span>
              </div>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <el-input
            v-model="aiImagePrompt"
            type="textarea"
            placeholder="描述你想要的图片，例如：一只在星空下奔跑的狐狸..."
            :rows="2"
            resize="none"
            @keydown.enter.ctrl="handleAIImageGenerate"
            @keydown.enter.meta="handleAIImageGenerate"
          />
          <div class="chat-input-toolbar">
            <el-button text class="toolbar-btn upload-btn">
              <el-icon><Plus /></el-icon>
            </el-button>
            <div class="toolbar-segment">
              <el-checkbox v-model="autoMode" label="auto" class="toolbar-checkbox" />
            </div>
            <el-select v-model="selectedModel" class="toolbar-model" popper-class="toolbar-model-popper">
              <el-option label="Nano Banana Pro" value="nano-banana-pro" />
            </el-select>
            <div class="toolbar-spacer"></div>
            <el-button
              type="primary"
              @click="handleAIImageGenerate"
              :loading="aiImageLoading"
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
import { ArrowLeft, Loading, Plus, Promotion } from '@element-plus/icons-vue'

const router = useRouter()
const aiImagePrompt = ref('')
const aiImageLoading = ref(false)
const chatMessagesRef = ref<HTMLElement>()
const isListeningSelection = ref(true)
const autoMode = ref(false)
const selectedModel = ref('nano-banana-pro')

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
          aiImagePrompt.value = text
          ElMessage.success('已将选中文本复制到输入框')
        }
      }
    }
  )
}

interface ChatMessage {
  role: 'user' | 'ai'
  type: 'text' | 'image' | 'image-group'
  content: string
  base64?: string
  prompt?: string
  loaded?: boolean
  error?: boolean
  imgKey?: number
  images?: ChatMessage[]
}

const chatMessages = ref<ChatMessage[]>([])

async function handleAIImageGenerate() {
  const prompt = aiImagePrompt.value.trim()
  if (!prompt) {
    ElMessage.warning('请输入图片描述')
    return
  }

  chatMessages.value.push({
    role: 'user',
    type: 'text',
    content: prompt
  })

  aiImagePrompt.value = ''
  aiImageLoading.value = true

  await scrollToBottom()

  const encodedPrompt = encodeURIComponent(prompt)
  const baseUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`

  const images: ChatMessage[] = []
  for (let i = 0; i < 4; i++) {
    images.push({
      role: 'ai',
      type: 'image',
      content: baseUrl,
      prompt: prompt,
      loaded: false,
      error: false,
      imgKey: Date.now() + i
    })
  }

  chatMessages.value.push({
    role: 'ai',
    type: 'image-group',
    content: '',
    prompt: prompt,
    images: images
  })

  aiImageLoading.value = false
  await scrollToBottom()
}

function onImageLoaded(msg: ChatMessage) {
  msg.loaded = true
  ElMessage.success('图片生成完成！')
  nextTick(() => {
    const idx = chatMessages.value.indexOf(msg)
    if (idx !== -1) {
      imageUrlToBase64(msg.content).then(base64 => {
        chatMessages.value[idx].base64 = base64
      }).catch(() => {})
    }
  })
}

function onImageError(msg: ChatMessage) {
  msg.error = true
  ElMessage.error('图片加载失败，请重试')
}

// 将图片 URL 转为 base64
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // 去掉 data:image/xxx;base64, 前缀
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Fetch to base64 failed:', error);
    throw error;
  }
}

function regenerateImage(msg: ChatMessage) {
  if (!msg.prompt) return
  const encodedPrompt = encodeURIComponent(msg.prompt)
  msg.content = `https://image.pollinations.ai/prompt/${encodedPrompt}`
  msg.loaded = false
  msg.error = false
  msg.base64 = undefined
  msg.imgKey = Date.now()
}

function regenerateImageGroup(msg: ChatMessage) {
  if (!msg.prompt || !msg.images) return
  const encodedPrompt = encodeURIComponent(msg.prompt)
  const baseUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`
  msg.images = msg.images.map((img, i) => ({
    ...img,
    content: baseUrl,
    loaded: false,
    error: false,
    base64: undefined,
    imgKey: Date.now() + i
  }))
}

function reEditPrompt(msg: ChatMessage) {
  if (!msg.prompt) return
  aiImagePrompt.value = msg.prompt
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

// 插入图片到PowerPoint
async function insertImageToPowerPoint(message: ChatMessage) {
  if (!message.content) return
  
  try {
    const Office = (globalThis as any).Office
    if (!Office?.context?.document) {
      ElMessage.error('当前不在 Office 环境中')
      return
    }
    
    ElMessage.info('正在获取图片数据...')
    
    let base64 = message.base64
    if (!base64) {
      try {
        base64 = await imageUrlToBase64(message.content)
        message.base64 = base64 // 缓存起来
      } catch (err) {
        throw new Error('无法下载图片数据，请重试')
      }
    }
    
    ElMessage.info('正在插入图片到 PowerPoint...')
    await insertImageViaCommonApi(base64)
    
    ElMessage.success('图片已插入到 PowerPoint')
  } catch (error) {
    console.error('插入图片失败:', error)
    ElMessage.error('插入图片失败: ' + (error as Error).message)
  }
}

// 使用Common API插入图片
async function insertImageViaCommonApi(base64Data: string) {
  const Office = (globalThis as any).Office
  
  return new Promise((resolve, reject) => {
    Office.context.document.setSelectedDataAsync(
      base64Data,
      { coercionType: Office.CoercionType.Image },
      (result: any) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve(null)
        } else {
          reject(new Error(result.error?.message || '插入图片失败'))
        }
      }
    )
  })
}
</script>

<style scoped>
.sub-page {
  height: 100vh;
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

.image-group-content {
  max-width: 320px !important;
  width: 320px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 140px);
  gap: 8px;
}

.image-grid-item {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
}

.image-grid-item .result-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eee;
  cursor: pointer;
  transition: opacity 0.3s;
}

.image-grid-item .result-image.image-loading {
  opacity: 0;
  position: absolute;
}

.image-grid-item .image-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}

.image-grid-item .image-error-tip {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef0f0;
  border-radius: 8px;
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

.image-content {
  max-width: 100%;
}

.image-content .result-image {
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid #eee;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s;
}

.image-content .result-image.image-loading {
  opacity: 0;
  position: absolute;
}

.image-content .image-loading-overlay {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px 32px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}

.image-content .image-error-tip {
  padding: 12px 16px;
  background: #fef0f0;
  border-radius: 8px;
  font-size: 13px;
  color: #f56c6c;
}

.image-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.image-action-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 0;
  transition: color 0.2s;
}

.image-action-btn:hover {
  color: #666;
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

.chat-input {
  padding: 16px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
}

.chat-input .el-textarea {
  flex: 1;
}

.chat-input .el-textarea__inner {
  border-radius: 12px;
  padding: 12px 16px;
  border-color: #dcdfe6;
}

.chat-input-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e4e7ed;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #606266;
  font-size: 18px;
}

.toolbar-btn:hover {
  background: #f5f7fa;
  color: #409eff;
}

.toolbar-segment {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #e4e7ed;
  background: #fff;
}

.toolbar-checkbox {
  margin-right: 0;
}

.toolbar-checkbox .el-checkbox__label {
  padding-left: 6px;
  font-size: 13px;
  color: #606266;
}

.toolbar-model {
  width: 150px;
}

.toolbar-model .el-input__wrapper {
  border-radius: 10px !important;
  box-shadow: 0 0 0 1px #e4e7ed inset !important;
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
