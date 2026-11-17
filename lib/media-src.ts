export function isOptimizableImage(src: string) {
  return src.startsWith('/') && !src.startsWith('/api/') && !src.startsWith('//')
}

export function safeHttp(src: string) {
  const value = src.trim()
  if (!value) return ''
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href
  } catch {
    return ''
  }
  return ''
}

/** Ảnh: link http(s) hoặc đường dẫn nội bộ bắt đầu bằng / */
export function safeMediaUrl(src: string) {
  const value = src.trim()
  if (!value) return ''
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !value.includes('..')) return value
  return safeHttp(value)
}
