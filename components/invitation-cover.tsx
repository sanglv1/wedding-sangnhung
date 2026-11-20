'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Palette } from 'lucide-react'
import { useGuestName, useIsClient } from '@/hooks/use-guest-name'
import { useWeddingTheme } from '@/hooks/use-wedding-theme'
import { WEDDING_OPEN_EVENT } from '@/hooks/use-background-music'

/** closed → opening (nắp trên trượt lên, nắp dưới trượt xuống, dấu sáp đi cùng mũi nắp) → hidden */
type Stage = 'closed' | 'opening' | 'hidden'

const OPEN_MS = 1550

function blobPath(cx: number, cy: number, r: number, bumps: number, amp: number) {
  const steps = bumps * 2
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const rad = r + (i % 2 === 0 ? amp : -amp * 0.28)
    const x = cx + Math.cos(t) * rad
    const y = cy + Math.sin(t) * rad
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return `${d}Z`
}

function WaxSeal({ gradientId }: { gradientId: string }) {
  const petals = [0, 72, 144, 216, 288]
  return (
    <svg className="wax-seal-svg" viewBox="0 0 200 200" aria-hidden>
      <defs>
        <radialGradient id={gradientId} cx="36%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="26%" stopColor="#f0d392" />
          <stop offset="58%" stopColor="#d7a44c" />
          <stop offset="100%" stopColor="#8a5820" />
        </radialGradient>
        <radialGradient id={`${gradientId}-well`} cx="40%" cy="34%" r="68%">
          <stop offset="0%" stopColor="#f8e7bf" />
          <stop offset="100%" stopColor="#c8923c" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="118" rx="58" ry="16" fill="rgb(40 8 10 / 0.35)" />
      <path d={blobPath(100, 100, 76, 16, 6.5)} fill="#6a4014" />
      <path d={blobPath(100, 98, 72, 16, 5.5)} fill={`url(#${gradientId})`} />
      <circle cx="100" cy="98" r="52" fill={`url(#${gradientId}-well)`} />
      <circle cx="100" cy="98" r="52" fill="none" stroke="#fff6df" strokeOpacity="0.55" strokeWidth="1.4" />
      <circle cx="100" cy="98" r="46" fill="none" stroke="#7a5018" strokeOpacity="0.35" strokeWidth="1" />
      <ellipse cx="78" cy="74" rx="26" ry="14" fill="#fff" opacity="0.28" />
      <g transform="translate(100 100) scale(1.32)">
        {petals.map((turn) => (
          <ellipse
            key={turn}
            cx="0"
            cy="-14"
            rx="8"
            ry="12.5"
            transform={`rotate(${turn})`}
            fill="#f7e6c0"
            stroke="#6d4814"
            strokeWidth="1.15"
          />
        ))}
        <circle r="6.2" fill="#fbf1d6" stroke="#6d4814" strokeWidth="1" />
        <circle r="2.3" fill="#c48932" stroke="none" />
        <path d="M0 6 C 1 16 2 24 1 34" fill="none" stroke="#6d4814" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M1 20 C 12 14 22 16 21 24 C 13 22 6 24 1 27" fill="#e8cb90" stroke="#6d4814" strokeWidth="1" />
        <path d="M0 26 C -12 22 -20 26 -17 33 C -10 30 -3 30 0 33" fill="#e8cb90" stroke="#6d4814" strokeWidth="1" />
      </g>
    </svg>
  )
}

function FlapEdge() {
  return (
    <svg className="wax-seam" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <path d="M0 42 L50 52 L100 42" />
    </svg>
  )
}

export function InvitationCover({
  allowThemeCycle = true,
}: {
  allowThemeCycle?: boolean
}) {
  const [stage, setStage] = useState<Stage>('closed')
  const mounted = useIsClient()
  const guestName = useGuestName()
  const { themeName, cycleTheme } = useWeddingTheme()
  const sealId = useId().replace(/:/g, '')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (stage === 'hidden') return
    const htmlOverflow = document.documentElement.style.overflow
    const bodyOverflow = document.body.style.overflow
    // iOS bỏ qua overflow trên body, nên khóa cả html để nền không trượt dưới phong bì
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = htmlOverflow
      document.body.style.overflow = bodyOverflow
    }
  }, [stage])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const handleOpen = () => {
    if (stage !== 'closed') return
    document.documentElement.dataset.opened = 'true'
    window.dispatchEvent(new Event(WEDDING_OPEN_EVENT))

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setStage('hidden')
      window.scrollTo({ top: 0 })
      return
    }

    setStage('opening')
    timerRef.current = window.setTimeout(() => {
      setStage('hidden')
      window.scrollTo({ top: 0 })
    }, OPEN_MS)
  }

  if (stage === 'hidden') return null

  const guestLine = guestName || (mounted ? 'Quý khách' : '\u00a0')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thiệp mời"
      data-stage={stage}
      className="wax-root fixed inset-0 z-[100]"
    >
      <div className="wax-backdrop" aria-hidden />

      {allowThemeCycle && (
        <button
          type="button"
          onClick={cycleTheme}
          className="wax-palette absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/90 text-stone-600 shadow-lg transition-all hover:bg-white hover:text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:top-[max(1.5rem,env(safe-area-inset-top))] sm:right-[max(1.5rem,env(safe-area-inset-right))] sm:h-12 sm:w-12"
          aria-label={`Đổi màu nền (hiện: ${themeName})`}
          title={`Đổi màu (${themeName})`}
        >
          <Palette className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      <div className="wax-stage">
        <div className="wax-shell">
          <div className="wax-paper" aria-hidden />
          <button
            type="button"
            onClick={handleOpen}
            autoFocus
            className="wax-envelope"
            aria-label={guestName ? `Mở thiệp cưới. Trân trọng kính mời ${guestName}` : 'Mở thiệp cưới'}
          >
            <span className="wax-flap wax-flap-bottom">
              <span className="wax-invite-block">
                <span className="wax-invite">Trân trọng kính mời</span>
                <span className="wax-guest">{guestLine}</span>
                <span className="wax-hint">
                  <span className="wax-hint-touch">Chạm để mở</span>
                  <span className="wax-hint-click">Nhấn để mở</span>
                </span>
              </span>
            </span>

            <span className="wax-flap wax-flap-top">
              <FlapEdge />
              <span className="wax-welcome">
                <span className="wax-kicker">Welcome</span>
                <span className="wax-to">to</span>
                <span className="wax-word">Wedding</span>
              </span>
              <span className="wax-seal">
                <WaxSeal gradientId={sealId} />
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
