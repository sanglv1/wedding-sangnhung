import type { Metadata } from 'next'
import { WeddingSite } from '@/components/wedding-site'
import { CONTENT } from '@/lib/content'
import { isGuestbookConfigured } from '@/lib/guestbook-store'
import { isArchived } from '@/lib/archive'
import { shareMetadata } from '@/lib/share-meta'

/** Nội dung là file JSON cố định; tạo lại mỗi giờ để trạng thái "thiệp đã khép" vẫn tự cập nhật sau lễ */
export const revalidate = 3600

export function generateMetadata(): Metadata {
  return shareMetadata(CONTENT)
}

export default function HomePage() {
  return (
    <WeddingSite
      content={CONTENT}
      guestbook={isGuestbookConfigured && !isArchived(CONTENT.event.end)}
      trackOpens={isGuestbookConfigured}
      archived={isArchived(CONTENT.event.end)}
    />
  )
}
