import { getLiveContent } from '@/lib/live-content'
import { renderShareCard, SHARE_SIZE } from '@/lib/share-card'
import { deriveWedding } from '@/lib/wedding-model'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const alt = 'Thiệp cưới Lương Sáng & Trần Nhung'
export const size = SHARE_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return renderShareCard(deriveWedding(await getLiveContent()))
}
