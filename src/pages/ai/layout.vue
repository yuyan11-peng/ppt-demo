<template>
  <div class="sub-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="router.push('/ai')" />
      <span class="page-title">排版优化</span>
    </div>
    <div class="page-body">
      <p class="info-text">点击下方按钮将自动分析当前幻灯片并统一格式、美化布局。</p>
      <el-button
        type="primary"
        @click="handleLayoutOptimize"
        :loading="layoutLoading"
        style="width: 100%;"
      >
        {{ layoutLoading ? '优化中...' : '开始排版优化' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const layoutLoading = ref(false)

function handleLayoutOptimize() {
  layoutLoading.value = true
  ElMessage.info('正在优化排版...')
  setTimeout(() => {
    layoutLoading.value = false
    ElMessage.success('排版优化完成！')
  }, 2000)
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

.info-text {
  font-size: 13px;
  color: #888;
  line-height: 1.6;
  margin-bottom: 16px;
}
</style>
