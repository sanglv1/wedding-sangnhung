'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { GalleryImage } from '@/lib/gallery'
import { isOptimizableImage } from '@/lib/media-src'
import { GalleryLightbox } from './gallery-lightbox'
import { Reveal } from './reveal'
import { SectionFrame } from './section-frame'
import { SectionHeading } from './section-heading'
import styles from './gallery-section.module.css'

const SWIPE_RATIO = 0.18

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduced
}

function AlbumStage({
  images,
  onOpen,
}: {
  images: GalleryImage[]
  onOpen: (index: number) => void
}) {
  const n = images.length
  const reduced = useReducedMotion()
  const frame = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number; pointer: number } | null>(null)
  const locked = useRef(false)
  const moved = useRef(false)
  const pending = useRef<-1 | 0 | 1>(0)
  const token = useRef(0)
  const timer = useRef(0)
  const settled = useRef(true)
  const dragging = useRef(false)
  const [index, setIndex] = useState(0)
  const [shift, setShift] = useState(0)
  const [motion, setMotion] = useState(false)
  const [hint, setHint] = useState(true)

  const at = (i: number) => images[(i + n) % n]
  const order = n === 0 ? [] : [at(index - 1), at(index), at(index + 1)]
  const gliding = motion && shift !== 0

  const settle = (dir: -1 | 0 | 1) => {
    if (settled.current) return
    settled.current = true
    token.current += 1
    window.clearTimeout(timer.current)
    pending.current = 0
    if (dir !== 0) setIndex((i) => (i + dir + n) % n)
    setMotion(false)
    setShift(0)
  }

  const glideTo = (dir: -1 | 1) => {
    if (n < 2 || !settled.current) return
    setHint(false)
    if (reduced) {
      setIndex((i) => (i + dir + n) % n)
      setShift(0)
      setMotion(false)
      return
    }
    const width = frame.current?.clientWidth || 1
    const my = ++token.current
    settled.current = false
    pending.current = dir
    setMotion(true)
    requestAnimationFrame(() => {
      if (token.current !== my) return
      setShift(dir === 1 ? -width : width)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => settle(dir), 850)
    })
  }

  const jumpTo = (next: number) => {
    if (next === index || !settled.current) return
    setHint(false)
    pending.current = 0
    setMotion(false)
    setShift(0)
    setIndex(next)
  }

  const onTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform' || settled.current) return
    const width = frame.current?.clientWidth || 1
    const dir: -1 | 0 | 1 = shift <= -width * 0.5 ? 1 : shift >= width * 0.5 ? -1 : 0
    settle(dir)
  }

  useLayoutEffect(() => {
    if (dragging.current || !settled.current || shift === 0) return
    setMotion(false)
    setShift(0)
  }, [shift])

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || n < 2 || gliding) return
    start.current = { x: event.clientX, y: event.clientY, pointer: event.pointerId }
    locked.current = false
    moved.current = false
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const origin = start.current
    if (!origin || origin.pointer !== event.pointerId) return
    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y
    if (!locked.current) {
      if (Math.abs(dx) < 8) return
      if (Math.abs(dy) > Math.abs(dx)) {
        start.current = null
        return
      }
      locked.current = true
      dragging.current = true
      moved.current = true
      setMotion(false)
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    setShift(dx)
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const origin = start.current
    start.current = null
    if (!origin || origin.pointer !== event.pointerId) return
    const dx = event.clientX - origin.x
    const width = frame.current?.clientWidth ?? 1
    const wasLocked = locked.current
    dragging.current = false
    locked.current = false
    if (wasLocked && Math.abs(dx) > Math.min(72, width * SWIPE_RATIO)) {
      glideTo(dx < 0 ? 1 : -1)
    } else if (wasLocked) {
      const my = ++token.current
      pending.current = 0
      setMotion(true)
      requestAnimationFrame(() => {
        if (token.current !== my) return
        setShift(0)
      })
    }
  }

  if (n === 0) return null
  const current = at(index)

  return (
    <div className={styles.album}>
      <div
        ref={frame}
        className={styles.stage}
        tabIndex={0}
        role="group"
        aria-roledescription="trình chiếu ảnh"
        aria-label={current.alt}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => {
          if (moved.current) {
            moved.current = false
            return
          }
          onOpen(index)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') glideTo(1)
          if (event.key === 'ArrowLeft') glideTo(-1)
          if (event.key === 'Enter') onOpen(index)
        }}
      >
        <div
          className={`${styles.reel} ${motion ? styles.isAnimated : ''}`}
          style={{ transform: `translate3d(calc(-100% + ${(motion || dragging.current) ? shift : 0}px), 0, 0)` }}
          onTransitionEnd={onTransitionEnd}
        >
          {order.map((image, position) => (
            <div key={position} className={styles.slide} aria-hidden={position !== 1}>
              <Image
                src={image.src}
                alt=""
                fill
                priority={position === 1}
                quality={90}
                draggable={false}
                className="object-cover"
                style={image.focus ? { objectPosition: image.focus } : undefined}
                sizes="(max-width: 639px) 68vw, 440px"
                unoptimized={!isOptimizableImage(image.src)}
              />
            </div>
          ))}
        </div>
        {n > 1 && (
          <>
            <button
              type="button"
              className="gallery-nav left-2 sm:left-3"
              aria-label="Ảnh trước"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                glideTo(-1)
              }}
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
            <button
              type="button"
              className="gallery-nav right-2 sm:right-3"
              aria-label="Ảnh sau"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                glideTo(1)
              }}
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className={styles.controls}>
          <div className="gallery-ring-panel">
            <span className="gallery-progress-track block w-full" aria-hidden>
              <span className="gallery-progress-done" />
            </span>
          </div>
          <div className={styles.pager}>
            <p className={styles.count} aria-live="polite">
              {String(index + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
            </p>
            <div className={styles.dots}>
              {images.map((image, i) => (
                <button
                  key={image.src + i}
                  type="button"
                  className={styles.dot}
                  aria-label={`Ảnh ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => jumpTo(i)}
                />
              ))}
            </div>
          </div>
          {hint && <p className={styles.hint}>Vuốt ngang để xem tiếp</p>}
        </div>
      )}
    </div>
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

  return (
    <>
      <section id="khoanh-khac" className="scroll-mt-16 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionFrame>
            <SectionHeading description="Những khoảnh khắc của chúng mình">Khoảnh khắc</SectionHeading>
            <Reveal>
              <AlbumStage images={images} onOpen={setLightboxIndex} />
            </Reveal>
          </SectionFrame>
        </div>
      </section>

      <GalleryLightbox images={images} index={lightboxIndex} onIndexChange={setLightboxIndex} onClose={() => setLightboxIndex(null)} />
    </>
  )
}
