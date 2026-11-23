/* Ảnh khách tải lên đi qua /api/media, không cố định một domain để next/image tối ưu */
/* eslint-disable @next/next/no-img-element */
import Image from 'next/image'
import { HERO_IMAGE, WEDDING } from '@/lib/constants'
import { isOptimizableImage } from '@/lib/media-src'

const SIZES = '(min-width: 1024px) 520px, (min-width: 768px) 50vw, 96vw'

export function HeroPhoto({
  className = '',
  hero = HERO_IMAGE,
  groomShort = WEDDING.groomShort,
  brideShort = WEDDING.brideShort,
  fit = 'auto',
  sizes = SIZES,
  framed = true,
  position,
}: {
  className?: string
  hero?: { src: string; focus: string }
  groomShort?: string
  brideShort?: string
  /** auto: hiện trọn ảnh trong khung. cover: ảnh luôn đầy khung, neo theo focus. */
  fit?: 'auto' | 'cover'
  sizes?: string
  /** false khi ảnh là nền của tên, không cần khung vàng bên trong. */
  framed?: boolean
  /** Ghi đè điểm neo khi chữ cần nhiều khoảng trống phía trên mặt. */
  position?: string
}) {
  const alt = `Ảnh cưới ${groomShort} và ${brideShort}`
  const frame = framed ? '' : 'hero-photo-plain'
  const contained = fit !== 'cover'
  const objectPosition = position ?? (contained ? '50% 50%' : hero.focus)
  if (!hero.src) return <div className={`invite-photo-window bg-w-tint ${frame} ${className}`} aria-hidden />

  const fitClass = contained ? 'object-contain' : 'object-cover'

  if (!isOptimizableImage(hero.src)) {
    return (
      <div className={`invite-photo-window ${frame} ${className}`}>
        <img src={hero.src} alt={alt} className={`h-full w-full ${fitClass}`} style={{ objectPosition }} />
      </div>
    )
  }

  return (
    <div className={`invite-photo-window ${frame} ${className}`}>
      <Image
        src={hero.src}
        alt={alt}
        fill
        priority
        quality={90}
        sizes={sizes}
        className={fitClass}
        style={{ objectPosition }}
      />
    </div>
  )
}
