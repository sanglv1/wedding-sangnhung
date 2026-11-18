'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { GalleryImage } from '@/lib/gallery'
import { isOptimizableImage } from '@/lib/media-src'
import { GalleryLightbox } from './gallery-lightbox'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'
import styles from './gallery-section.module.css'

const HEARTS = [
  { top: '8%', left: '36%', size: 13, delay: '0s' },
  { top: '4%', left: '78%', size: 11, delay: '1.1s' },
  { top: '31%', left: '62%', size: 16, delay: '0.4s' },
  { top: '46%', left: '18%', size: 12, delay: '1.6s' },
  { top: '63%', left: '91%', size: 14, delay: '0.8s' },
  { top: '78%', left: '42%', size: 18, delay: '1.3s' },
  { top: '90%', left: '72%', size: 11, delay: '0.2s' },
]

function FloatHeart({ top, left, size, delay }: (typeof HEARTS)[number]) {
  return (
    <svg
      className={styles.heart}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ top, left, width: size, height: size, animationDelay: delay }}
    >
      <path
        fill="currentColor"
        d="M12 20.2s-6.6-4.1-6.6-8.5a3.7 3.7 0 0 1 6.6-1.9 3.7 3.7 0 0 1 6.6 1.9c0 4.4-6.6 8.5-6.6 8.5z"
      />
    </svg>
  )
}

function Shot({
  image,
  priority,
  sizes,
  className,
  onOpen,
}: {
  image: GalleryImage
  priority?: boolean
  sizes: string
  className?: string
  onOpen: () => void
}) {
  return (
    <button type="button" className={`${styles.shot} ${className ?? ''}`} onClick={onOpen} aria-label={`Xem lớn ${image.alt}`}>
      <Image
        src={image.src}
        alt=""
        fill
        priority={priority}
        className="object-cover"
        style={image.focus ? { objectPosition: image.focus } : undefined}
        sizes={sizes}
        unoptimized={!isOptimizableImage(image.src)}
      />
    </button>
  )
}

export function GallerySection({
  images,
}: {
  images: GalleryImage[]
  brand?: { groom: string; bride: string; date: string }
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  if (images.length === 0) return null

  const leadCount = images.length >= 3 ? 2 : images.length
  const lead = images.slice(0, leadCount)
  const side = images.slice(leadCount)

  return (
    <>
      <section id="khoanh-khac" className="scroll-mt-16 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="section-frame">
            <SectionHeading description="Những khoảnh khắc của chúng mình">Khoảnh khắc</SectionHeading>
            <Reveal>
              <div className={`${styles.board} ${side.length === 0 ? styles.boardSolo : ''}`}>
                {side.length > 0 && (
                  <div className={styles.side}>
                    {side.map((image, i) => (
                      <Shot
                        key={image.src + i}
                        image={image}
                        sizes="(max-width: 768px) 30vw, 200px"
                        onOpen={() => setLightboxIndex(leadCount + i)}
                      />
                    ))}
                  </div>
                )}
                <div className={styles.feature}>
                  {lead.map((image, i) => (
                    <Shot
                      key={image.src + i}
                      image={image}
                      priority={i === 0}
                      sizes="(max-width: 768px) 68vw, 640px"
                      className={i === 0 && lead.length > 1 ? styles.featureTop : styles.featureTall}
                      onOpen={() => setLightboxIndex(i)}
                    />
                  ))}
                </div>
                <div className={styles.hearts} aria-hidden>
                  {HEARTS.map((heart) => (
                    <FloatHeart key={`${heart.top}-${heart.left}`} {...heart} />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <GalleryLightbox images={images} index={lightboxIndex} onIndexChange={setLightboxIndex} onClose={() => setLightboxIndex(null)} />
    </>
  )
}
