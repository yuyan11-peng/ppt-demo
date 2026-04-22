<template>
  <div class="main-panel home-content">
    <div class="home-card" @click="navigateTo('/material/template')">
      <div class="home-card-icon">
        <el-icon :size="32" color="#667eea"><Document /></el-icon>
      </div>
      <div class="home-card-title">模板库</div>
      <div class="home-card-desc">选择精美模板快速套用</div>
    </div>

    <div class="home-card" @click="navigateTo('/material/images')">
      <div class="home-card-icon">
        <el-icon :size="32" color="#11998e"><Picture /></el-icon>
      </div>
      <div class="home-card-title">图片素材</div>
      <div class="home-card-desc">浏览并插入图片到幻灯片</div>
    </div>

    <div class="home-card" @click="navigateTo('/material/icons')">
      <div class="home-card-icon">
        <el-icon :size="32" color="#f2994a"><Connection /></el-icon>
      </div>
      <div class="home-card-title">图标素材</div>
      <div class="home-card-desc">插入矢量图标装饰内容</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Document, Picture, Connection } from '@element-plus/icons-vue'

const router = useRouter()

function navigateTo(path: string) {
  router.push(path)
}
</script>

<style scoped>
.home-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.main-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
}

.home-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 10px;
  cursor: pointer;
  border: 1.5px solid #f0f0f0;
  border-radius: 12px;
  margin: 8px 16px;
  transition: background 0.15s, border-color 0.15s;
}

.home-card:hover { background: #fafafa; border-color: #e0e0e0; }

.home-card-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.home-card-desc {
  font-size: 13px;
  color: #aaa;
}
</style>
