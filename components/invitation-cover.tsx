'use client'

import { useEffect, useId, useState } from 'react'
import { Palette } from 'lucide-react'
import { CLASSIC_MODEL } from '@/lib/constants'
import type { WeddingModel } from '@/lib/wedding-model'
import { useGuestName, useIsClient } from '@/hooks/use-guest-name'
import { useWeddingTheme } from '@/hooks/use-wedding-theme'
import { WEDDING_OPEN_EVENT } from '@/hooks/use-background-music'

/** closed → opening (nắp lật, dấu sáp nhấc) → revealing (tan vào thiệp) → hidden */
type Stage = 'closed' | 'opening' | 'revealing' | 'hidden'

const OPEN_MS = 1200
const REVEAL_MS = 900

function WaxSeal({ gradientId }: { gradientId: string }) {
  const petals = [0, 60, 120, 180, 240, 300]
  return (
    <svg className="wax-seal-svg" viewBox="0 0 200 200" aria-hidden>
      <defs>
        <radialGradient id={gradientId} cx="36%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#fff1cc" />
          <stop offset="38%" stopColor="#e7c56a" />
          <stop offset="100%" stopColor="#9a6a2c" />
        </radialGradient>
        <filter id={`${gradientId}-edge`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
        </filter>
      </defs>
      <circle cx="100" cy="104" r="70" fill="rgb(0 0 0 / 0.28)" />
      <circle cx="100" cy="100" r="76" fill={`url(#${gradientId})`} filter={`url(#${gradientId}-edge)`} />
      <circle cx="100" cy="100" r="64" fill="none" stroke="#fff6df" strokeOpacity="0.45" strokeWidth="1.5" />
      <g transform="translate(100 102)" fill="#f6e2a8" stroke="#7c5418" strokeWidth="1.4">
        {petals.map((turn) => (
          <ellipse key={turn} rx="15" ry="27" transform={`rotate(${turn}) translate(0 -24)`} />
        ))}
        <ellipse rx="11" ry="20" transform="rotate(-28) translate(34 8)" fill="#e7c27a" />
        <ellipse rx="11" ry="20" transform="rotate(28) translate(-34 8)" fill="#e7c27a" />
        <circle r="13" fill="#f8e7b4" />
        <circle r="5.5" fill="#c4923a" stroke="none" />
      </g>
    </svg>
  )
}

export function InvitationCover({
  model = CLASSIC_MODEL,
  allowThemeCycle = true,
}: {
  model?: WeddingModel
  allowThemeCycle?: boolean
}) {
  void model
  const [stage, setStage] = useState<Stage>('closed')
  const mounted = useIsClient()
  const guestName = useGuestName()
  const { themeName, cycleTheme } = useWeddingTheme()
  const sealId = useId().replace(/:/g, '')

  useEffect(() => {
    if (stage === 'hidden') return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [stage])

  const handleOpen = () => {
    if (stage !== 'closed') return
    setStage('opening')
    window.dispatchEvent(new Event(WEDDING_OPEN_EVENT))

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(() => {
      setStage('revealing')
      document.documentElement.dataset.opened = 'true'
      setTimeout(() => {
        setStage('hidden')
        window.scrollTo({ top: 0 })
      }, reduceMotion ? 0 : REVEAL_MS)
    }, reduceMotion ? 0 : OPEN_MS)
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
      <div className="wax-wash" aria-hidden />

      {allowThemeCycle && (
        <button
          type="button"
          onClick={cycleTheme}
          className="wax-palette absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/90 text-stone-600 shadow-lg transition-all hover:bg-white hover:text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:top-6 sm:right-6 sm:h-12 sm:w-12"
          aria-label={`Đổi màu nền (hiện: ${themeName})`}
          title={`Đổi màu (${themeName})`}
        >
          <Palette className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      <div className="wax-stage absolute inset-0 flex items-center justify-center p-4">
        <div className="wax-float">
        <button
          type="button"
          onClick={handleOpen}
          autoFocus
          className="wax-envelope"
          aria-label={guestName ? `Mở thiệp cưới. Trân trọng kính mời ${guestName}` : 'Mở thiệp cưới'}
        >
          <span className="wax-sheet" aria-hidden />
          <span className="wax-body">
            <span className="wax-invite">Trân trọng kính mời</span>
            <span className="wax-guest">{guestLine}</span>
            <span className="wax-hint">{stage === 'closed' ? 'Chạm để mở' : 'Đang mở'}</span>
          </span>
          <span className="wax-flap" aria-hidden>
            <span className="wax-flap-face wax-flap-front">
              <span className="wax-welcome">
                <span className="wax-kicker">Welcome</span>
                <span className="wax-to">to</span>
                <span className="wax-word">Wedding</span>
              </span>
            </span>
            <span className="wax-flap-face wax-flap-back" />
          </span>
          <span className="wax-seal">
            <WaxSeal gradientId={sealId} />
          </span>
        </button>
        </div>
      </div>
    </div>
  )
}
