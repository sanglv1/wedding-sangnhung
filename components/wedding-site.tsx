import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CardSpotlight } from '@/components/card-spotlight'
import { FloatingActions } from '@/components/floating-actions'
import { GallerySection } from '@/components/gallery-section'
import { GiftSection } from '@/components/gift-section'
import { GuestOpenTracker } from '@/components/guest-open-tracker'
import { GuestbookSection } from '@/components/guestbook-section'
import { HeroSection } from '@/components/hero-section'
import { InvitationCover } from '@/components/invitation-cover'
import { PetalLayer } from '@/components/petal-layer'
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

function withRatios(images: GalleryImage[]) {
  return images.flatMap((image) => {
    if (!isOptimizableImage(image.src)) return [image]
    if (!existsSync(join(process.cwd(), 'public', image.src))) return []
    const size = getPublicImageSize(image.src)
    return [{ ...image, ratio: size ? size.width / size.height : undefined }]
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
  const gallery = withRatios(model.gallery)
  const names = model.wedding

  return (
    <>
      {content.opening !== 'trang' && <InvitationCover model={model} />}
      {trackOpens && <GuestOpenTracker />}
      <div className="paper-grain" aria-hidden />
      <PetalLayer />
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
        <HeroSection model={model} />
        <ScheduleSection model={model} />
        {gallery.length > 0 && (
          <GallerySection images={gallery} brand={{ groom: names.groomBrand, bride: names.brideBrand, date: names.dateShort }} />
        )}
        {archived ? (
          <section className="mx-auto max-w-xl px-4 py-16 text-center">
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
