import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
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
  app.use(ElementPlus)
  // 注册所有 Element Plus 图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
  app.mount('#app')
}

// 检测 URL 参数：如果明确指定了 mode=editor，直接以 Web 模式启动
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.get('mode') === 'editor') {
  console.log('[PPT Kit] URL 指定编辑器模式，跳过 Office 初始化')
  startApp()
} else {
  // 检测是否在 Office 环境中
  const office = (globalThis as any).Office
  if (office && office.onReady) {
    // 给 Office.onReady 设置 5 秒超时，防止在新窗口中永远等待
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 5000))
    const ready = office.onReady()

    Promise.race([ready, timeout]).then(() => {
      if (office.context) {
        console.log('[PPT Kit] Office 环境已就绪')
      } else {
        console.warn('[PPT Kit] Office.onReady 超时或无 context，以 Web 模式启动')
      }
      startApp()
    }).catch(() => {
      console.warn('[PPT Kit] Office 初始化失败，以 Web 模式启动')
      startApp()
    })
  } else {
    // 非 Office 环境，直接启动
    startApp()
  }
}
