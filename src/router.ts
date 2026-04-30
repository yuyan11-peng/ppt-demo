import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

const materialAiImageRoute: RouteRecordRaw = {
  path: '/material/ai-image',
  component: () => import('./pages/material/ai-image.vue'),
}

const appRoutes: RouteRecordRaw[] = routes.some(route => route.path === materialAiImageRoute.path)
  ? routes
  : [...routes, materialAiImageRoute]

const router = createRouter({
  // 使用 MemoryHistory 避免在 Office Add-in 中出现 history 相关的报错
  // 因为有些 Office 环境或者嵌入式环境不支持操作真实的浏览器 history API
  history: createMemoryHistory(),
  routes: appRoutes,
})

export default router

