<template>
  <div class="material-page">
    <!-- 子Tab栏 -->
    <div class="sub-tabs">
      <div class="sub-tab-item active">
        <el-icon><Document /></el-icon>
        <span>模板</span>
      </div>
      <div class="sub-tab-item" @click="router.push('/material')">
        <el-icon><Grid /></el-icon>
        <span>图标</span>
      </div>
      <div class="sub-tab-item" @click="router.push('/material')">
        <el-icon><Picture /></el-icon>
        <span>图片</span>
      </div>
    </div>

    <div class="material-content">
      <div class="tab-panel">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, Grid, Picture, List } from '@element-plus/icons-vue'

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
.material-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

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
.view-toggles .el-icon { cursor: pointer; font-size: 14px !important; }

.panel-body { flex: 1; }

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
</style>
