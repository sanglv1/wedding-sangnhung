import type { Metadata } from 'next'
import { WeddingSite } from '@/components/wedding-site'
import { isGuestbookConfigured } from '@/lib/guestbook-store'
import { isArchived } from '@/lib/archive'
import { getLiveContent } from '@/lib/live-content'
import { shareMetadata } from '@/lib/share-meta'

/** Đọc nội dung mỗi lần mở trang, để lần lưu trên /admin hiện ngay và thiệp vẫn tự khép sau lễ */
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return shareMetadata(await getLiveContent())
}

export default async function HomePage() {
  const content = await getLiveContent()
  return (
    <WeddingSite
      content={content}
      guestbook={isGuestbookConfigured && !isArchived(content.event.end)}
      trackOpens={isGuestbookConfigured}
      archived={isArchived(content.event.end)}
    />
  )
}
