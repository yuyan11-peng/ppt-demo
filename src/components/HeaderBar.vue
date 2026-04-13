<template>
  <header class="header-bar">
    <div class="header-left">
      <div class="logo">
        <span class="logo-icon">◈</span>
        <span class="logo-text">PPT Kit</span>
      </div>
      <div class="divider"></div>
      <span class="presentation-name">{{ presentationName }}</span>
      <span class="slide-badge">{{ slideCount }} 张幻灯片</span>
    </div>
    <div class="header-right">
      <!-- MCP Bridge 连接状态 -->
      <div class="bridge-status" @click="$emit('toggle-bridge')" :title="bridgeTooltip">
        <span class="status-dot" :class="connectionState"></span>
        <span class="status-text">{{ bridgeLabel }}</span>
        <span v-if="connectionState === 'connected' && requestCount > 0" class="request-badge">
          {{ requestCount }}
        </span>
      </div>
      <div class="divider"></div>
      <!-- 同步到 PowerPoint（仅在 Office 环境中显示） -->
      <button v-if="inOffice" class="btn btn-primary" @click="$emit('sync-ppt')" title="同步到当前 PowerPoint 演示文稿">
        <span class="btn-icon">⊕</span>
        同步到 PPT
      </button>
      <button class="btn btn-ghost" @click="$emit('export-pptx')" title="导出 PPTX">
        <span class="btn-icon">⬇</span>
        导出 PPTX
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

.logo-icon {
  font-size: 22px;
  color: var(--color-primary);
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.3px;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
}

.presentation-name {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.slide-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(108, 122, 224, 0.12);
  color: var(--color-primary);
  font-weight: 500;
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
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: var(--transition);
  user-select: none;
}

.bridge-status:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.3s ease;
}

.status-dot.connected {
  background: var(--color-success);
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.5);
}

.status-dot.connecting {
  background: var(--color-warning);
  animation: pulse 1.5s ease-in-out infinite;
}

.status-dot.error {
  background: var(--color-danger);
  box-shadow: 0 0 6px rgba(224, 92, 108, 0.4);
}

.status-dot.disconnected {
  background: var(--color-text-dim);
}

.status-text {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

.request-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(76, 175, 80, 0.15);
  color: var(--color-success);
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: var(--transition);
  font-family: inherit;
}

.btn-ghost {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-ghost:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border: 1px solid var(--color-primary);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn-icon {
  font-size: 14px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
