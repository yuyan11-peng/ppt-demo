<template>
  <div class="sub-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="router.push('/material')" />
      <span class="page-title">模板库</span>
    </div>
    <div class="page-body">
      <el-row :gutter="12">
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
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

const templates = [
  { id: 1, name: '商务蓝', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 2, name: '简约白', color: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)' },
  { id: 3, name: '科技感', color: 'linear-gradient(135deg, #0c0c1d, #1a1a3e)' },
  { id: 4, name: '活力橙', color: 'linear-gradient(135deg, #f093fb, #f5576c)' },
]

function handleApplyTemplate(tpl: { id: number; name: string }) {
  ElMessage.info(`正在应用模板: ${tpl.name}`)
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

.template-card {
  margin-bottom: 12px;
  border-radius: 10px;
}

.template-thumb { height: 90px; }
.template-name {
  padding: 8px;
  font-size: 12.5px;
  color: #555;
  text-align: center;
  background: #fafafa;
  font-weight: 500;
}
</style>
