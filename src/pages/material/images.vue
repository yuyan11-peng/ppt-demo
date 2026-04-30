<template>
  <div class="material-page">
    <!-- 子Tab栏（当前页高亮图片） -->
    <div class="sub-tabs">
      <div class="sub-tab-item" @click="router.push('/material')">
        <el-icon><Document /></el-icon>
        <span>模板</span>
      </div>
      <div class="sub-tab-item" @click="router.push('/material')">
        <el-icon><Grid /></el-icon>
        <span>图标</span>
      </div>
      <div class="sub-tab-item active">
        <el-icon><Picture /></el-icon>
        <span>图片</span>
      </div>
    </div>

    <div class="material-content">
      <div class="tab-panel">
        <!-- 标题栏 -->
        <div class="panel-header">
          <span class="panel-title">图片素材</span>
          <div class="view-toggles">
            <el-icon :color="'#1890ff'"><Grid /></el-icon>
            <el-icon color="#999"><List /></el-icon>
          </div>
        </div>

        <div class="panel-body">
          <!-- 分类标签 -->
          <div class="category-tags">
            <span
              v-for="cat in categories"
              :key="cat.key"
              class="category-tag"
              :class="{ active: selectedCategory === cat.key }"
              @click="selectedCategory = cat.key"
            >{{ cat.label }}</span>
          </div>

          <!-- 图片卡片网格 -->
          <div class="image-grid">
            <div
              v-for="img in filteredImages"
              :key="img.id"
              class="image-card"
              @click="handleSelectImage(img)"
            >
              <div class="image-card-bg" :style="{ background: img.gradient }">
                <div class="image-card-icon">
                  <el-icon :size="18" color="#fff"><component :is="img.icon" /></el-icon>
                </div>
              </div>
              <div class="image-card-name">{{ img.name }}</div>
            </div>
          </div>

          <!-- AI图片生成按钮 -->
          <div class="ai-generate-section">
            <el-button type="primary" class="ai-generate-btn" @click="goToAIImage">
              AI图片生成
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, Grid, Picture, List, OfficeBuilding, Cpu, Sunny, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()

// ===== 分类和数据 =====
interface ImageItem {
  id: number
  name: string
  category: string
  gradient: string
  icon: any
}

const categories = [
  { key: 'all', label: '全部' },
  { key: 'business', label: '商务' },
  { key: 'nature', label: '自然' },
  { key: 'tech', label: '科技' },
  { key: 'people', label: '人物' },
]
const selectedCategory = ref('all')

const imageList: ImageItem[] = [
  { id: 1, name: '商务办公', category: 'business', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', icon: OfficeBuilding },
  { id: 2, name: '科技背景', category: 'tech', gradient: 'linear-gradient(135deg, #7c5cfc, #a55eea)', icon: Cpu },
  { id: 3, name: '自然风景', category: 'nature', gradient: 'linear-gradient(135deg, #89f7b8, #62d2c0)', icon: Sunny },
  { id: 4, name: '团队合作', category: 'people', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)', icon: UserFilled },
  { id: 5, name: '商务会议', category: 'business', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', icon: OfficeBuilding },
  { id: 6, name: '科技创新', category: 'tech', gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', icon: Cpu },
  { id: 7, name: '山水风光', category: 'nature', gradient: 'linear-gradient(135deg, #84fab0, #8fd3f4)', icon: Sunny },
  { id: 8, name: '团队协作', category: 'people', gradient: 'linear-gradient(135deg, #fccb90, #d57eeb)', icon: UserFilled },
]

const filteredImages = computed(() => {
  if (selectedCategory.value === 'all') return imageList
  return imageList.filter(img => img.category === selectedCategory.value)
})

function handleSelectImage(img: ImageItem) {
  ElMessage.info(`已选择图片: ${img.name}`)
}

function goToAIImage() {
  router.push('/ai/image')
}
</script>

<style scoped>
.material-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

/* 子Tab栏 */
.sub-tabs {
  display: flex;
  gap: 6px;
  padding: 8px 12px 6px;
  flex-shrink: 0;
}

.sub-tab-item {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 12px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  border: 1.5px solid #e8e8e8;
  font-weight: 500;
}

.sub-tab-item:hover { color: #1890ff; border-color: #bae7ff; }
.sub-tab-item.active { background: #1890ff; color: #fff; border-color: #1890ff; }

/* 内容区 */
.material-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.tab-panel { display: flex; flex-direction: column; }

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px 8px;
  flex-shrink: 0;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.view-toggles {
  display: flex;
  gap: 5px;
  align-items: center;
}

.view-toggles .el-icon {
  cursor: pointer;
  font-size: 14px !important;
}

.panel-body { flex: 1; }

/* 分类标签 */
.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.category-tag {
  padding: 3px 12px;
  border-radius: 16px;
  font-size: 11.5px;
  cursor: pointer;
  color: #555;
  background: #f5f5f5;
  border: 1.5px solid transparent;
  transition: all 0.2s;
  font-weight: 500;
}

.category-tag:hover { color: #1890ff; background: #e6f7ff; }
.category-tag.active { background: #1890ff; color: #fff; border-color: #1890ff; }

/* 图片卡片 */
.image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.image-card {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.image-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-card-bg {
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.image-card-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.image-card-name {
  text-align: center;
  padding: 4px 0 2px;
  font-size: 11.5px;
  color: #444;
  font-weight: 500;
}

/* AI生成按钮 */
.ai-generate-section { padding: 4px 0 10px; }

.ai-generate-btn {
  width: 100%;
  height: 30px;
  font-size: 12.5px;
  font-weight: 600;
  border-radius: 6px;
  letter-spacing: 0.5px;
}
</style>
