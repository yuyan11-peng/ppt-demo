<template>
  <div class="sub-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="goBack" />
      <span class="page-title">AI 图片生成</span>
    </div>

    <div class="page-body">
      <div class="chat-container">
        <div class="chat-messages" ref="chatMessagesRef">
          <div v-if="chatMessages.length === 0 && !aiImageLoading" class="empty-state">
            <el-icon :size="36" color="#b8c4d6"><Picture /></el-icon>
            <div class="empty-title">描述图片内容，生成素材图片</div>
            <div class="empty-desc">每次从素材库进入都会清空输入和生成结果</div>
          </div>

          <template v-for="(msg, index) in chatMessages" :key="index">
            <div v-if="msg.type === 'text'" class="chat-message" :class="msg.role">
              <div class="message-content">
                <div class="text-content">{{ msg.content }}</div>
              </div>
            </div>

            <div v-else-if="msg.type === 'image-group'" class="chat-message ai">
              <div class="message-content image-group-content">
                <div class="image-grid">
                  <div v-for="img in msg.images" :key="img.imgKey" class="image-grid-item">
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
            placeholder="描述你想要的图片，例如：商务办公背景、科技感主视觉..."
            :rows="2"
            resize="none"
            @keydown.enter.ctrl="handleAIImageGenerate"
            @keydown.enter.meta="handleAIImageGenerate"
          />
          <div class="chat-input-toolbar">
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
import { ref, nextTick, onActivated, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Loading, Picture, Promotion } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const aiImagePrompt = ref('')
const aiImageLoading = ref(false)
const chatMessagesRef = ref<HTMLElement>()
const selectedModel = ref('nano-banana-pro')

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

onMounted(resetPage)
onActivated(resetPage)

function resetPage() {
  aiImagePrompt.value = ''
  aiImageLoading.value = false
  chatMessages.value = []
}

function goBack() {
  const rawReturnTo = route.query.returnTo
  const returnTo = Array.isArray(rawReturnTo) ? rawReturnTo[0] : rawReturnTo
  router.push(returnTo?.startsWith('/material') ? returnTo : '/material')
}

async function handleAIImageGenerate() {
  const prompt = aiImagePrompt.value.trim()
  if (!prompt) {
    ElMessage.warning('请输入图片描述')
    return
  }

  chatMessages.value.push({ role: 'user', type: 'text', content: prompt })
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
      prompt,
      loaded: false,
      error: false,
      imgKey: Date.now() + i,
    })
  }

  chatMessages.value.push({
    role: 'ai',
    type: 'image-group',
    content: '',
    prompt,
    images,
  })

  aiImageLoading.value = false
  await scrollToBottom()
}

function onImageLoaded(msg: ChatMessage) {
  msg.loaded = true
  imageUrlToBase64(msg.content)
    .then(base64 => { msg.base64 = base64 })
    .catch(() => {})
}

function onImageError(msg: ChatMessage) {
  msg.error = true
  ElMessage.error('图片加载失败，请重试')
}

async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
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
    imgKey: Date.now() + i,
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
      base64 = await imageUrlToBase64(message.content)
      message.base64 = base64
    }

    ElMessage.info('正在插入图片到 PowerPoint...')
    await insertImageViaCommonApi(base64)
    ElMessage.success('图片已插入到 PowerPoint')
  } catch (error) {
    console.error('插入图片失败:', error)
    ElMessage.error('插入图片失败: ' + (error as Error).message)
  }
}

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
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.page-title {
  font-size: 14px;
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
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #9aa8ba;
  text-align: center;
  padding: 24px 8px;
}

.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b7788;
}

.empty-desc {
  font-size: 12px;
  color: #a8b3c2;
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
  max-width: 80%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-message.user .message-content {
  align-items: flex-end;
}

.text-content {
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
  word-break: break-word;
}

.chat-message.user .text-content {
  background: #409eff;
  color: #fff;
}

.image-group-content {
  max-width: 100% !important;
  width: 100%;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.image-grid-item {
  position: relative;
  aspect-ratio: 1;
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

.image-loading-overlay,
.image-error-tip,
.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f5f7fa;
  color: #666;
  font-size: 13px;
}

.image-loading-overlay,
.image-error-tip {
  position: absolute;
  inset: 0;
  flex-direction: column;
  border-radius: 8px;
}

.image-error-tip {
  background: #fef0f0;
  color: #f56c6c;
}

.loading-content {
  padding: 10px 12px;
  border-radius: 10px;
}

.image-actions {
  display: flex;
  gap: 10px;
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

.chat-input {
  padding: 12px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fff;
}

.chat-input-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-model {
  width: 150px;
}

.toolbar-spacer {
  flex: 1;
}

.send-button {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
