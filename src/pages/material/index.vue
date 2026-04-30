<template>
  <div class="material-page">
    <!-- 子Tab栏：模板 / 图标 / 图片 -->
    <div class="sub-tabs">
      <div
        class="sub-tab-item"
        :class="{ active: activeSubTab === 'template' }"
        @click="activeSubTab = 'template'"
      >
        <el-icon><Document /></el-icon>
        <span>模板</span>
      </div>
      <div
        class="sub-tab-item"
        :class="{ active: activeSubTab === 'icons' }"
        @click="activeSubTab = 'icons'"
      >
        <el-icon><Grid /></el-icon>
        <span>图标</span>
      </div>
      <div
        class="sub-tab-item"
        :class="{ active: activeSubTab === 'images' }"
        @click="activeSubTab = 'images'"
      >
        <el-icon><Picture /></el-icon>
        <span>图片</span>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="material-content">
      <!-- 模板内容 -->
      <div v-show="activeSubTab === 'template'" class="tab-panel">
        <div class="panel-header">
          <span class="panel-title">模板库</span>
          <div class="view-toggles">
            <el-icon :color="'#1890ff'"><Grid /></el-icon>
            <el-icon color="#999"><List /></el-icon>
          </div>
        </div>
        <div class="panel-body">
          <el-row :gutter="6">
            <el-col :span="12" v-for="tpl in templates" :key="tpl.id">
              <el-card
                shadow="hover"
                class="template-card"
                :body-style="{ padding: '0', cursor: 'pointer' }"
                @click="handleApplyTemplate(tpl)"
              >
                <div class="template-thumb" :style="{ background: tpl.color }"></div>
                <div class="template-name">{{ tpl.name }}</div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 图标内容 -->
      <div v-show="activeSubTab === 'icons'" class="tab-panel">
        <div class="panel-header">
          <span class="panel-title">图标素材</span>
          <div class="view-toggles">
            <el-icon :color="'#1890ff'"><Grid /></el-icon>
            <el-icon color="#999"><List /></el-icon>
          </div>
        </div>
        <div class="panel-body">
          <el-row :gutter="5">
            <el-col :span="6" v-for="(icon, idx) in iconList" :key="idx">
              <el-card
                shadow="hover"
                class="icon-item-card"
                :body-style="{ padding: '0', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }"
                @click="handleInsertIcon(icon)"
              >
                <span class="icon-char">{{ icon.char }}</span>
                <span class="icon-name">{{ icon.name }}</span>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 图片内容（核心页面） -->
      <div v-show="activeSubTab === 'images'" class="tab-panel">
        <div class="panel-header">
          <span class="panel-title">图片素材</span>
          <div class="view-toggles">
            <el-icon :color="'#1890ff'"><Grid /></el-icon>
            <el-icon color="#999"><List /></el-icon>
          </div>
        </div>

        <div class="panel-body">
          <!-- 分类标签栏 -->
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
const activeSubTab = ref('images')

// ===== 模板数据 =====
const templates = [
  { id: 1, name: '商务蓝', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 2, name: '简约白', color: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)' },
  { id: 3, name: '科技感', color: 'linear-gradient(135deg, #0c0c1d, #1a1a3e)' },
  { id: 4, name: '活力橙', color: 'linear-gradient(135deg, #f093fb, #f5576c)' },
]

function handleApplyTemplate(tpl: { id: number; name: string }) {
  ElMessage.info(`正在应用模板: ${tpl.name}`)
}

// ===== 图标数据 =====
const iconList = [
  { char: '\uD83D\uDCCA', name: '图表' }, { char: '\uD83D\uDCC8', name: '趋势' },
  { char: '\uD83D\uDCA1', name: '灵感' }, { char: '\uD83C\uDFAF', name: '目标' },
  { char: '\uD83D\uDE80', name: '启动' }, { char: '\u26A1', name: '闪电' },
  { char: '\uD83D\uDD14', name: '通知' }, { char: '\uD83D\uDCCB', name: '清单' },
  { char: '\u2705', name: '完成' }, { char: '\uD83D\uDD27', name: '工具' },
  { char: '\uD83C\uDFA8', name: '设计' }, { char: '\uD83D\uDCE6', name: '包裹' },
]

function handleInsertIcon(icon: { char: string; name: string }) {
  ElMessage.info(`已选择图标: ${icon.name}`)
}

// ===== 图片分类和数据 =====
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

/* ===== 子Tab栏 ===== */
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

.sub-tab-item:hover {
  color: #1890ff;
  border-color: #bae7ff;
}

.sub-tab-item.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.sub-tab-item .el-icon {
  font-size: 13px;
}

/* ===== 内容区域 ===== */
.material-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.tab-panel {
  display: flex;
  flex-direction: column;
}

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
  transition: color 0.2s;
  font-size: 14px !important;
}

.view-toggles .el-icon:hover {
  color: #1890ff !important;
}

.panel-body {
  flex: 1;
}

/* ===== 模板卡片 ===== */
.template-card {
  margin-bottom: 8px;
  border-radius: 8px;
}

.template-thumb { height: 50px; }
.template-name {
  padding: 5px;
  font-size: 11px;
  color: #555;
  text-align: center;
  background: #fafafa;
  font-weight: 500;
}

/* ===== 图标卡片 ===== */
.icon-item-card {
  border-radius: 8px;
  margin-bottom: 6px;
  aspect-ratio: 1;
}

.icon-item-card :deep(.el-card__body) {
  padding: 6px 2px !important;
  background: #f8f9fc;
}

.icon-char { font-size: 16px; line-height: 1; }
.icon-name { font-size: 9px; color: #777; }

/* ===== 分类标签 ===== */
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

.category-tag:hover {
  color: #1890ff;
  background: #e6f7ff;
}

.category-tag.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

/* ===== 图片卡片网格 ===== */
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

/* ===== AI图片生成按钮 ===== */
.ai-generate-section {
  padding: 4px 0 10px;
}

.ai-generate-btn {
  width: 100%;
  height: 30px;
  font-size: 12.5px;
  font-weight: 600;
  border-radius: 6px;
  letter-spacing: 0.5px;
}
</style>
