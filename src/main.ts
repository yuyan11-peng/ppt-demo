import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'

/**
 * PPT Kit 入口
 *
 * 支持两种运行环境：
 * 1. Office Add-in 环境（PowerPoint 插件） - 等待 Office.onReady 后启动
 * 2. 普通 Web 环境（浏览器直接访问） - 直接启动
 */
function startApp() {
  const app = createApp(App)
  app.mount('#app')
}

// 检测是否在 Office 环境中
const office = (globalThis as any).Office
if (office && office.onReady) {
  office.onReady().then(() => {
    console.log('[PPT Kit] Office 环境已就绪')
    startApp()
  }).catch(() => {
    // Office 初始化失败，降级为普通 Web 模式
    console.warn('[PPT Kit] Office 初始化失败，以 Web 模式启动')
    startApp()
  })
} else {
  // 非 Office 环境，直接启动
  startApp()
}
