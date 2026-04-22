<template>
  <div class="sub-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="router.push('/ai')" />
      <span class="page-title">AI 生图</span>
    </div>
    <div class="page-body">
      <div class="ai-image-container" :class="{ 'image-on-left': showImageOnLeft }">
        <div v-if="showImageOnLeft && aiImageResult" class="left-image">
          <img :src="aiImageResult" alt="生成的图片" class="result-image" />
        </div>
        <div class="form-section" :class="{ 'with-left-image': showImageOnLeft }">
          <label class="form-label">描述你想要的图片</label>
          <el-input
            v-model="aiImagePrompt"
            type="textarea"
            placeholder="例如：一只在星空下奔跑的狐狸..."
            :rows="4"
            resize="vertical"
          />
          <el-button
            type="primary"
            @click="handleAIImageGenerate"
            :loading="aiImageLoading"
            style="margin-top: 12px; width: 100%;"
          >
            {{ aiImageLoading ? '生成中...' : '生成图片' }}
          </el-button>
          <div v-if="!showImageOnLeft && aiImageResult" class="result-section">
            <img 
              :src="aiImageResult" 
              alt="生成的图片" 
              class="result-image"
              @click="insertImageToPowerPoint"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const aiImagePrompt = ref('')
const aiImageLoading = ref(false)
const aiImageResult = ref('')
const showImageOnLeft = ref(false)

function handleAIImageGenerate() {
  aiImageLoading.value = true
  ElMessage.info('正在生成图片...')
  
  // 使用 text-to-image API 生成图片
  setTimeout(() => {
    // 生成图片 URL
    const prompt = encodeURIComponent(aiImagePrompt.value.trim() || '一只可爱的小猫')
    const imageUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=landscape_16_9`
    aiImageResult.value = imageUrl
    aiImageLoading.value = false
    ElMessage.success('图片生成完成！')
  }, 2000)
}

// 插入图片到PowerPoint
async function insertImageToPowerPoint() {
  if (!aiImageResult.value) return
  
  try {
    const Office = (globalThis as any).Office
    if (!Office?.context?.document) {
      ElMessage.error('当前不在 Office 环境中')
      return
    }
    
    ElMessage.info('正在插入图片到 PowerPoint...')
    
    // 检查PowerPoint API版本
    const supports14 = !!Office.context.requirements?.isSetSupported?.('PowerPointApi', '1.4')
    
    if (supports14) {
      // 使用PowerPoint 1.4+ API
      await insertImageViaPowerPointApi(aiImageResult.value)
    } else {
      // 使用Common API
      await insertImageViaCommonApi(aiImageResult.value)
    }
    
    ElMessage.success('图片已插入到 PowerPoint')
  } catch (error) {
    console.error('插入图片失败:', error)
    ElMessage.error('插入图片失败: ' + (error as Error).message)
  }
}

// 使用PowerPoint 1.4+ API插入图片
async function insertImageViaPowerPointApi(imageUrl: string) {
  const PowerPoint = (globalThis as any).Office.PowerPoint || (globalThis as any).PowerPoint
  
  await PowerPoint.run(async (context: any) => {
    const slides = context.presentation.slides
    slides.load('items')
    await context.sync()
    
    if (slides.items.length === 0) {
      context.presentation.slides.add()
      await context.sync()
      slides.load('items')
      await context.sync()
    }
    
    const currentSlide = slides.items[0] // 插入到第一张幻灯片
    currentSlide.shapes.addPictureFromBase64(
      await imageToBase64(imageUrl),
      (globalThis as any).Office.Core?.SlideLayoutType?.Title || 'Title',
      100, // 左边距
      100, // 上边距
      400, // 宽度
      300  // 高度
    )
    
    await context.sync()
  })
}

// 使用Common API插入图片
async function insertImageViaCommonApi(imageUrl: string) {
  const Office = (globalThis as any).Office
  
  return new Promise((resolve, reject) => {
    Office.context.document.setSelectedDataAsync(
      imageUrl,
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

// 将图片URL转换为Base64
function imageToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.onload = function() {
      const reader = new FileReader()
      reader.onloadend = function() {
        const base64 = (reader.result as string).split(',')[1] // 去掉data:image/xxx;base64,前缀
        resolve(base64)
      }
      reader.readAsDataURL(xhr.response)
    }
    xhr.onerror = function() {
      reject(new Error('获取图片失败'))
    }
    xhr.open('GET', url, true)
    xhr.responseType = 'blob'
    xhr.send()
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
  overflow-y: auto;
  padding: 20px 16px;
}

.form-section { margin-top: 8px; }

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #444;
  margin-bottom: 8px;
}

.result-section { margin-top: 20px; }
.result-image { max-width: 100%; border-radius: 8px; border: 1px solid #eee; cursor: pointer; }

.ai-image-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ai-image-container.image-on-left {
  flex-direction: row;
  align-items: flex-start;
}

.left-image {
  flex: 0 0 30%;
  max-width: 30%;
}

.left-image .result-image {
  width: 100%;
  height: auto;
}

.form-section.with-left-image {
  flex: 1;
  margin-left: 20px;
}
</style>
