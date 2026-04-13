import { marked } from 'marked'
import hljs from 'highlight.js'

// Configure marked with code highlighting
const renderer = new marked.Renderer()

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  // Handle mermaid blocks separately
  if (lang === 'mermaid') {
    return `<div class="mermaid-container"><pre class="mermaid">${text}</pre></div>`
  }

  // Highlight code
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  try {
    const highlighted = hljs.highlight(text, { language }).value
    return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
  } catch {
    return `<pre><code class="hljs">${text}</code></pre>`
  }
}

marked.setOptions({
  renderer,
  gfm: true,
  breaks: true
})

/**
 * Parse markdown to HTML
 */
export function parseMarkdown(markdown: string): string {
  try {
    return marked.parse(markdown) as string
  } catch {
    return `<p>${markdown}</p>`
  }
}

/**
 * Extract mermaid code blocks from markdown
 */
export function extractMermaidBlocks(markdown: string): string[] {
  const blocks: string[] = []
  const regex = /```mermaid\n([\s\S]*?)```/g
  let match

  while ((match = regex.exec(markdown)) !== null) {
    blocks.push(match[1].trim())
  }

  return blocks
}

/**
 * Extract code blocks from markdown
 */
export function extractCodeBlocks(markdown: string): { code: string; language: string }[] {
  const blocks: { code: string; language: string }[] = []
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  let match

  while ((match = regex.exec(markdown)) !== null) {
    const lang = match[1] || 'plaintext'
    if (lang !== 'mermaid') {
      blocks.push({ code: match[2].trim(), language: lang })
    }
  }

  return blocks
}

/**
 * Highlight code string
 */
export function highlightCode(code: string, language: string): string {
  try {
    if (hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value
    }
    return hljs.highlightAuto(code).value
  } catch {
    return code
  }
}
