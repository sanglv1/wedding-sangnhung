import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { AutoTour } from '@/components/auto-tour'
import { CardSpotlight } from '@/components/card-spotlight'
import { FloatingActions } from '@/components/floating-actions'
import { GallerySection } from '@/components/gallery-section'
import { GiftSection } from '@/components/gift-section'
import { GuestOpenTracker } from '@/components/guest-open-tracker'
import { GuestbookSection } from '@/components/guestbook-section'
import { HeroSection } from '@/components/hero-section'
import { InvitationCover } from '@/components/invitation-cover'
import { RSVPForm } from '@/components/rsvp-form'
import { ScheduleSection } from '@/components/schedule-section'
import { Toaster } from '@/components/ui/toast'
import { WeddingFooter } from '@/components/wedding-footer'
import { WeddingHeader } from '@/components/wedding-header'
import type { WeddingContent } from '@/lib/content'
import type { GalleryImage } from '@/lib/gallery'
import { getPublicImageSize } from '@/lib/image-size'
import { isOptimizableImage } from '@/lib/media-src'
import { KEEP_DAYS } from '@/lib/archive'
import { deriveWedding } from '@/lib/wedding-model'

/** Bộ tối ưu ảnh chỉ nhớ theo đường dẫn. Gắn thời điểm sửa file để chép đè cùng tên vẫn ra ảnh mới. */
function freshSrc(src: string) {
  const file = src.split('?')[0]
  if (!file.startsWith('/') || file.includes('..')) return src
  try {
    const mtime = Math.round(statSync(join(process.cwd(), 'public', file)).mtimeMs)
    return `${file}?v=${mtime}`
  } catch {
    return file
  }
}

function withRatios(images: GalleryImage[]) {
  return images.flatMap((image) => {
    const file = image.src.split('?')[0]
    if (!isOptimizableImage(file)) return [image]
    if (!existsSync(join(process.cwd(), 'public', file))) return []
    const size = getPublicImageSize(file)
    return [{ ...image, src: freshSrc(file), ratio: size ? size.width / size.height : undefined }]
  })
}

export function WeddingSite({
  content,
  guestbook,
  trackOpens,
  archived = false,
}: {
  content: WeddingContent
  guestbook: boolean
  trackOpens: boolean
  archived?: boolean
}) {
  const model = deriveWedding(content)
  const hero = { ...model.hero, src: model.hero.src ? freshSrc(model.hero.src) : model.hero.src }
  const gallery = withRatios(model.gallery)
  const names = model.wedding

  return (
    <>
      {content.opening !== 'trang' && <InvitationCover />}
      <AutoTour />
      {trackOpens && <GuestOpenTracker />}
      <div className="paper-grain" aria-hidden />
      <CardSpotlight />
      <WeddingHeader
        showGuestbook={guestbook}
        sections={{
          story: false,
          family: false,
          schedule: Boolean(
            names.date || names.ceremony.time || names.ceremony.venue || names.intimateMeal.time || names.intimateMeal.venue
            || model.familyAddresses.groomFamily.address || model.familyAddresses.brideFamily.address,
          ),
          gallery: gallery.length > 0,
          rsvp: !archived,
          guestbook,
          gift: model.hasGift,
        }}
        groomBrand={names.groomBrand}
        brideBrand={names.brideBrand}
        groomShort={names.groomShort}
        brideShort={names.brideShort}
      />
      <main className="relative z-[1] min-h-screen overflow-x-hidden">
        <HeroSection model={{ ...model, hero }} />
        <ScheduleSection model={model} />
        {gallery.length > 0 && (
          <GallerySection images={gallery} brand={{ groom: names.groomBrand, bride: names.brideBrand, date: names.dateShort }} />
        )}
        {archived ? (
          <section className="mx-auto max-w-xl px-4 py-8 text-center sm:py-[calc(4rem*2/3)] md:py-[calc(5rem*2/3)]">
            <h2 className="font-sans text-3xl font-medium tracking-wide text-w-strong">Thiệp đã khép</h2>
            <p className="mt-3 text-sm leading-7 text-w-soft">
              Đã qua {KEEP_DAYS} ngày sau lễ. Khách vẫn đọc được thiệp, và không gửi thêm xác nhận hay lời chúc.
            </p>
          </section>
        ) : (
          <>
            <RSVPForm />
            <GuestbookSection enabled={guestbook} />
          </>
        )}
        <GiftSection model={model} />
      </main>
      <WeddingFooter />
      <FloatingActions music={model.music} />
      <Toaster />
    </>
  )
}
