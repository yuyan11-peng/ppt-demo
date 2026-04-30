import { defineConfig } from 'vite'
import VueRouter from 'unplugin-vue-router/vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { mcpBridgePlugin } from './src/vite-plugin-mcp'
import fs from 'fs'
import { homedir } from 'os'

const DEV_PORT = 8989

// HTTPS 证书配置（Office Add-in 要求 HTTPS）
// 优先使用微软官方 office-addin-dev-certs 工具安装的受信任证书
function getHttpsOptions() {
  const officeCert = resolve(homedir(), '.office-addin-dev-certs/localhost.crt')
  const officeKey = resolve(homedir(), '.office-addin-dev-certs/localhost.key')
  if (fs.existsSync(officeCert) && fs.existsSync(officeKey)) {
    console.log('Using Office Add-in dev certs (trusted)')
    return { cert: fs.readFileSync(officeCert), key: fs.readFileSync(officeKey) }
  }
  // 回退到项目本地证书
  const certPath = resolve(__dirname, 'certs/localhost.crt')
  const keyPath = resolve(__dirname, 'certs/localhost.key')
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('Using local certs (may not be trusted by Office)')
    return { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
  }
  return undefined
}

export default defineConfig(({ command }) => ({
  plugins: [
    VueRouter({
      /* options */
      routesFolder: 'src/pages',
      dts: 'src/typed-router.d.ts',
    }),
    vue(),
    mcpBridgePlugin()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: DEV_PORT,
    strictPort: true,
    open: false,
    // Office Add-in 要求 HTTPS，使用受信任的开发证书
    // 证书来源：office-addin-dev-certs 工具或项目本地 certs/ 目录
    https: getHttpsOptions(),
    proxy: {
      '/api/ide': {
        target: 'https://trae-api-cn.mchost.guru',
        changeOrigin: true
      }
    }
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Office Add-in 不支持 ES Module 动态导入，内联所有 chunk
        manualChunks: undefined
      }
    }
  }
}))
