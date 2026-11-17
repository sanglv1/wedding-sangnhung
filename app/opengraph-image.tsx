import { CONTENT } from '@/lib/content'
import { renderShareCard, SHARE_SIZE } from '@/lib/share-card'
import { deriveWedding } from '@/lib/wedding-model'

export const runtime = 'nodejs'
export const alt = 'Thiệp cưới Lương Sáng & Trần Nhung'
export const size = SHARE_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderShareCard(deriveWedding(CONTENT))
}
