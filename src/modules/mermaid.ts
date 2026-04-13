import mermaid from 'mermaid'

let initialized = false

/**
 * Initialize mermaid with dark theme
 */
export function initMermaid() {
  if (initialized) return
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#6c7ae0',
      primaryTextColor: '#e4e6f0',
      primaryBorderColor: '#5b6abf',
      lineColor: '#8b8fa8',
      secondaryColor: '#1e2030',
      tertiaryColor: '#252840',
      background: '#161822',
      mainBkg: '#1e2030',
      nodeBorder: '#5b6abf',
      clusterBkg: '#1e2030',
      clusterBorder: '#2a2d3e',
      titleColor: '#e4e6f0',
      edgeLabelBackground: '#161822'
    },
    flowchart: {
      htmlLabels: true,
      curve: 'basis'
    },
    sequence: {
      actorMargin: 60,
      showSequenceNumbers: false
    },
    fontFamily: '"Segoe UI", "Inter", sans-serif'
  })
  initialized = true
}

/**
 * Render all mermaid diagrams in a container
 */
export async function renderMermaid(container: HTMLElement) {
  initMermaid()
  const elements = container.querySelectorAll<HTMLElement>('.mermaid')
  
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const code = el.textContent || ''
    if (!code.trim()) continue
    
    try {
      const id = `mermaid-${Date.now()}-${i}`
      const { svg } = await mermaid.render(id, code)
      el.innerHTML = svg
    } catch (e) {
      el.innerHTML = `<div style="color: #e05c6c; padding: 12px; background: rgba(224,92,108,0.1); border-radius: 6px;">
        <strong>⚠ Mermaid 渲染错误</strong><br/>
        <code style="font-size: 12px;">${(e as Error).message || '图表语法错误'}</code>
      </div>`
    }
  }
}
