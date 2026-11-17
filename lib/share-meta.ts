import type { Metadata } from 'next'
import type { WeddingContent } from '@/lib/content'
import { deriveWedding, type WeddingModel } from '@/lib/wedding-model'

export function shareDescription(model: WeddingModel) {
  const w = model.wedding
  const when = [
    w.ceremony.timeDisplay && `lúc ${w.ceremony.timeDisplay.toLocaleLowerCase('vi')}`,
    w.ceremony.dayOfWeek.toLocaleLowerCase('vi'),
    w.date && `ngày ${w.date}`,
  ]
    .filter(Boolean)
    .join(', ')
  const where = w.ceremony.location || w.ceremony.venue
  return `Trân trọng kính mời bạn đến dự lễ thành hôn của ${w.groomShort} & ${w.brideShort}${when ? ` ${when}` : ''}${where ? ` · ${where}` : ''}.`
}

/** Metadata của trang ghi đè cả khối openGraph/twitter ở layout, nên phải khai báo lại đủ các trường */
export function shareMetadata(content: WeddingContent): Metadata {
  const model = deriveWedding(content)
  const { groomShort, brideShort, groomBrand, brideBrand } = model.wedding
  const title = `Thiệp cưới ${groomShort} & ${brideShort}`
  const description = shareDescription(model)
  return {
    title,
    description,
    openGraph: { type: 'website', locale: 'vi_VN', siteName: `${groomBrand} & ${brideBrand}`, title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}
