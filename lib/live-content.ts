import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cache } from 'react'
import { CONTENT, validateContent, type WeddingContent } from '@/lib/content'
import { isRedisConfigured, pipeline } from '@/lib/redis'

/** Bản nội dung khách đang xem trên Vercel. Không có khóa này thì dùng file đóng gói lúc deploy. */
const CONTENT_KEY = 'wedding:content'
const CONTENT_FILE = join(process.cwd(), 'content', 'wedding.json')

function parseStored(raw: unknown): WeddingContent | null {
  if (typeof raw !== 'string' || !raw) return null
  try {
    const data = JSON.parse(raw) as unknown
    if (validateContent(data)) return null
    return data as WeddingContent
  } catch {
    return null
  }
}

/**
 * Máy local luôn đọc file (lưu từ /admin sẽ làm Next nạp lại).
 * Bản deploy đọc Redis trước, không có hoặc lỗi thì dùng content/wedding.json đã đóng gói.
 */
export const getLiveContent = cache(async (): Promise<WeddingContent> => {
  if (process.env.NODE_ENV !== 'production' || !isRedisConfigured) return CONTENT
  try {
    const [raw] = await pipeline([['GET', CONTENT_KEY]])
    return parseStored(raw) ?? CONTENT
  } catch {
    return CONTENT
  }
})

/** Local ghi file. Bản deploy ghi Redis vì đĩa Vercel chỉ đọc. */
export async function saveLiveContent(data: WeddingContent) {
  const text = `${JSON.stringify(data, null, 2)}\n`
  if (process.env.NODE_ENV !== 'production') {
    await writeFile(CONTENT_FILE, text, 'utf8')
    return
  }
  if (!isRedisConfigured) {
    throw new Error('Chưa kết nối Upstash Redis, chưa lưu được nội dung trên Vercel')
  }
  await pipeline([['SET', CONTENT_KEY, text]])
}
