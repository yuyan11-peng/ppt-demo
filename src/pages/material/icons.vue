<template>
  <div class="material-page">
    <!-- 子Tab栏 -->
    <div class="sub-tabs">
      <div class="sub-tab-item" @click="router.push('/material')">
        <el-icon><Document /></el-icon>
        <span>模板</span>
      </div>
      <div class="sub-tab-item active">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, Grid, Picture, List } from '@element-plus/icons-vue'

const router = useRouter()

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
</style>
