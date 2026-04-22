<template>
  <div class="taskpane-root">
    <!-- ===== 全局Tab栏（始终显示） ===== -->
    <div class="global-tabs">
      <div class="home-tab" :class="{ active: isAITab }" @click="goToTab('/ai')">AI助手</div>
      <div class="home-tab" :class="{ active: isMaterialTab }" @click="goToTab('/material')">素材库</div>
    </div>

    <!-- ===== 页面内容 ===== -->
    <div class="page-container">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isAITab = computed(() => route.path.startsWith('/ai'))
const isMaterialTab = computed(() => route.path.startsWith('/material'))

function goToTab(path: string) {
  router.push(path)
}

onMounted(() => {
  try {
    const params = new URLSearchParams(window.location.search)
    const action = params.get('action')
    if (action) {
      const pageMap: Record<string, string> = {
        'generate': '/ai/generate',
        'aiimage': '/ai/image',
        'optimize-content': '/ai/optimize',
        'optimize': '/ai/optimize',
        'optimize-layout': '/ai/layout',
        'layout': '/ai/layout',
        'templates': '/material/template',
        'template': '/material/template',
        'images': '/material/images',
        'icons': '/material/icons',
        'sidebar': '/ai',
      }
      const targetPath = pageMap[action]
      if (targetPath) {
        router.replace(targetPath)
        return
      }
    }
  } catch { /* ignore */ }
  
  // 默认路由兜底，如果是根路径，跳转到 /ai
  if (route.path === '/') {
    router.replace('/ai')
  }
})
</script>

<style scoped>
.taskpane-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  overflow: hidden;
}

.global-tabs {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: #fff;
}

.home-tab {
  flex: 1;
  padding: 12px 0;
  font-size: 14.5px;
  color: #999;
  cursor: pointer;
  position: relative;
  font-weight: 500;
  text-align: center;
}

.home-tab:hover { color: #666; }

.home-tab.active {
  color: #1890ff;
  font-weight: 600;
}

.home-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 10%;
  right: 10%;
  height: 2.5px;
  background: #1890ff;
  border-radius: 2px;
}

.page-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>

