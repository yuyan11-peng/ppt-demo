<template>
  <header class="header-bar">
    <div class="header-left">
      <div class="logo">
        <el-icon :size="22" color="var(--color-primary)"><Monitor /></el-icon>
        <span class="logo-text">PPT Kit</span>
      </div>
      <el-divider direction="vertical" />
      <span class="presentation-name">{{ presentationName }}</span>
      <el-tag size="small" type="primary" effect="plain">{{ slideCount }} 张幻灯片</el-tag>
    </div>

    <div class="header-right">
      <!-- MCP Bridge 连接状态 -->
      <el-tooltip :content="bridgeTooltip" placement="bottom" :disabled="false">
        <div class="bridge-status" @click="$emit('toggle-bridge')">
          <el-badge v-if="connectionState === 'connected' && requestCount > 0" :value="requestCount" :max="99">
            <el-tag
              :type="statusTagType"
              :effect="'plain'"
              size="default"
              round
              class="bridge-tag"
            >
              {{ bridgeLabel }}
            </el-tag>
          </el-badge>
          <el-tag
            v-else
            :type="statusTagType"
            :effect="'plain'"
            size="default"
            round
            class="bridge-tag"
          >
            {{ bridgeLabel }}
          </el-tag>
        </div>
      </el-tooltip>

      <el-divider direction="vertical" />

      <!-- 同步到 PowerPoint（仅在 Office 环境中显示） -->
      <el-button
        v-if="inOffice"
        type="primary"
        size="small"
        @click="$emit('sync-ppt')"
      >
        <template #icon><Connection /></template>
        同步到 PPT
      </el-button>
      <el-button size="small" @click="$emit('export-pptx')">
        <template #icon><Download /></template>
        导出 PPTX
      </el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Monitor, Connection, Download } from '@element-plus/icons-vue'

const props = defineProps<{
  presentationName: string
  slideCount: number
  connectionState: string
  requestCount: number
  inOffice: boolean
}>()

defineEmits<{
  'export-pptx': []
  'sync-ppt': []
  'toggle-bridge': []
}>()

const bridgeLabel = computed(() => {
  switch (props.connectionState) {
    case 'connected': return 'MCP 已连接'
    case 'connecting': return '连接中...'
    case 'error': return 'MCP 连接错误'
    default: return 'MCP 未连接'
  }
})

const statusTagType = computed<'success' | 'warning' | 'danger' | 'info'>(() => {
  switch (props.connectionState) {
    case 'connected': return 'success'
    case 'connecting': return 'warning'
    case 'error': return 'danger'
    default: return 'info'
  }
})

const bridgeTooltip = computed(() => {
  switch (props.connectionState) {
    case 'connected': return `MCP Bridge 已连接 (已处理 ${props.requestCount} 个请求)\n点击断开`
    case 'connecting': return '正在连接 MCP Bridge Server...'
    case 'error': return '连接出错，点击重试'
    default: return '点击连接 MCP Bridge Server (ws://localhost:3100)'
  }
})
</script>

<style scoped>
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.3px;
}

.presentation-name {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* MCP Bridge 连接状态 */
.bridge-status {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.bridge-status:hover .bridge-tag {
  opacity: 1;
  transform: scale(1.02);
}

.bridge-tag {
  cursor: pointer;
  transition: all 0.2s;
}
</style>
