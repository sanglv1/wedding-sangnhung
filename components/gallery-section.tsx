'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { GalleryImage } from '@/lib/gallery'
import { isOptimizableImage } from '@/lib/media-src'
import { GalleryLightbox } from './gallery-lightbox'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

export function GallerySection({
  images,
}: {
  images: GalleryImage[]
  brand?: { groom: string; bride: string; date: string }
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  if (images.length === 0) return null

  return (
    <>
      <section id="khoanh-khac" className="scroll-mt-16 py-16 sm:py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="section-frame">
            <SectionHeading description="Những khoảnh khắc của chúng mình">Khoảnh khắc</SectionHeading>
            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              {images.map((image, i) => (
                <Reveal key={image.src + i} delay={i * 80}>
                  <figure>
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className="block w-full overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--w-line-strong)]"
                      aria-label={`Xem lớn ${image.alt}`}
                    >
                      <span
                        className="relative block w-full bg-black/10"
                        style={{ aspectRatio: image.ratio ? String(image.ratio) : '3 / 4' }}
                      >
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          priority={i === 0}
                          className="object-cover"
                          style={image.focus ? { objectPosition: image.focus } : undefined}
                          sizes="(max-width: 768px) 100vw, 480px"
                          unoptimized={!isOptimizableImage(image.src)}
                        />
                      </span>
                    </button>
                    {image.caption ? <figcaption className="mt-3 text-center font-sans text-sm text-w-soft">{image.caption}</figcaption> : null}
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <GalleryLightbox images={images} index={lightboxIndex} onIndexChange={setLightboxIndex} onClose={() => setLightboxIndex(null)} />
    </>
  )
}
