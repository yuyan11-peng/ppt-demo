<template>
  <div class="sub-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="router.push('/material')" />
      <span class="page-title">图片素材</span>
    </div>
    <div class="page-body">
      <p class="info-text">浏览并选择图片插入到当前幻灯片中</p>
      <el-row :gutter="10">
        <el-col :span="8" v-for="n in 6" :key="n">
          <el-card shadow="hover" class="image-placeholder-card" :body-style="{ padding: '0' }">
            <div class="image-placeholder">
              <el-icon :size="28"><Picture /></el-icon>
              <span>图片 {{ n }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, Picture } from '@element-plus/icons-vue'

const router = useRouter()
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

.info-text {
  font-size: 13px;
  color: #888;
  line-height: 1.6;
  margin-bottom: 16px;
}

.image-placeholder-card {
  border-radius: 10px;
  margin-bottom: 10px;
}

.image-placeholder {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f5f7fa;
  color: #aaa;
  font-size: 11px;
  cursor: pointer;
}
</style>
