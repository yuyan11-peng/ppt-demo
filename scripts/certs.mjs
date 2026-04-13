/**
 * HTTPS 自签证书管理脚本
 * Office Add-in 要求 HTTPS，使用 office-addin-dev-certs 生成证书
 */
import { execSync } from 'child_process'
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const certsDir = resolve(__dirname, '..', 'certs')

function ensureCertsDir() {
  if (!existsSync(certsDir)) {
    mkdirSync(certsDir, { recursive: true })
  }
}

function getCertsSourceDir() {
  try {
    const result = execSync('npx office-addin-dev-certs get --output text 2>&1', {
      encoding: 'utf-8',
      shell: true
    })
    const lines = result.trim().split('\n')
    for (const line of lines) {
      if (line.includes('ca:') || line.includes('cert') || line.includes('key')) {
        const match = line.match(/(.*?):\s*(.+)/)
        if (match) {
          const value = match[2].trim()
          if (existsSync(value)) {
            return dirname(value)
          }
        }
      }
    }
  } catch {
    // fallback
  }

  // Common locations
  const home = process.env.USERPROFILE || process.env.HOME || ''
  const candidates = [
    resolve(home, '.office-addin-dev-certs'),
    resolve(home, 'AppData', 'Local', 'office-addin-dev-certs'),
    resolve(home, '.office-addin-dev-certs', 'certs')
  ]
  for (const dir of candidates) {
    if (existsSync(dir) && (existsSync(resolve(dir, 'localhost.crt')) || existsSync(resolve(dir, 'ca.crt')))) {
      return dir
    }
  }
  return ''
}

async function install() {
  console.log('🔧 正在生成 HTTPS 开发证书...\n')
  ensureCertsDir()

  try {
    execSync('npx office-addin-dev-certs install 2>&1', {
      encoding: 'utf-8',
      shell: true,
      stdio: 'inherit'
    })
  } catch (e) {
    console.error('证书生成失败，请确保已安装 office-addin-dev-certs')
    console.error('运行: npm install')
    process.exit(1)
  }

  // Copy certs to project certs/ directory
  const sourceDir = getCertsSourceDir()
  if (!sourceDir) {
    console.error('找不到证书文件，请手动运行: npx office-addin-dev-certs install')
    process.exit(1)
  }

  const certFiles = [
    { src: 'localhost.crt', dest: 'localhost.crt' },
    { src: 'localhost.key', dest: 'localhost.key' },
    { src: 'ca.crt', dest: 'ca.crt' },
  ]

  for (const f of certFiles) {
    const srcPath = resolve(sourceDir, f.src)
    const destPath = resolve(certsDir, f.dest)
    if (existsSync(srcPath)) {
      copyFileSync(srcPath, destPath)
      console.log(`  ✓ ${f.dest}`)
    }
  }

  console.log('\n✅ 证书已安装到 certs/ 目录')
  console.log('   现在可以运行 npm run dev:https 启动 HTTPS 开发服务器')
}

function uninstall() {
  console.log('🔧 正在卸载 HTTPS 开发证书...\n')
  try {
    execSync('npx office-addin-dev-certs uninstall 2>&1', {
      encoding: 'utf-8',
      shell: true,
      stdio: 'inherit'
    })
    console.log('✅ 证书已卸载')
  } catch {
    console.error('卸载失败')
    process.exit(1)
  }
}

function verify() {
  ensureCertsDir()
  const certPath = resolve(certsDir, 'localhost.crt')
  const keyPath = resolve(certsDir, 'localhost.key')

  if (existsSync(certPath) && existsSync(keyPath)) {
    console.log('✅ 证书文件存在:')
    console.log(`   证书: ${certPath}`)
    console.log(`   密钥: ${keyPath}`)
  } else {
    console.log('❌ 证书文件不存在，请运行: npm run certs:install')
    process.exit(1)
  }
}

const command = process.argv[2]

switch (command) {
  case 'install': await install(); break
  case 'uninstall': uninstall(); break
  case 'verify': verify(); break
  default:
    console.log('用法: node scripts/certs.mjs [install|uninstall|verify]')
    process.exit(1)
}
