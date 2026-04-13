/**
 * PPT Kit MCP Server - 入口文件
 */
import { startBridgeServer } from './bridge.js'

console.log('🔧 正在启动 PPT Kit MCP Server...')
startBridgeServer().catch((err) => {
  console.error('❌ 启动失败:', err)
  process.exit(1)
})
