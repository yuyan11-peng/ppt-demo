<template>
  <div class="sub-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="router.push('/material')" />
      <span class="page-title">图标素材</span>
    </div>
    <div class="page-body">
      <el-row :gutter="10">
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
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

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

.icon-item-card {
  border-radius: 10px;
  margin-bottom: 10px;
  aspect-ratio: 1;
}

.icon-item-card :deep(.el-card__body) {
  padding: 12px 4px !important;
  background: #f8f9fc;
}

.icon-char { font-size: 24px; line-height: 1; }
.icon-name { font-size: 11px; color: #777; }
</style>
