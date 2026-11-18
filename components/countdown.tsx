'use client'

import { useEffect, useState } from 'react'
import { WEDDING } from '@/lib/constants'

type CountdownState =
  | { status: 'loading' }
  | { status: 'counting'; days: number; hours: number; minutes: number; seconds: number }
  | { status: 'today' }
  | { status: 'past' }

function calculate(now: number, start: number, end: number): CountdownState {
  if (!start || !end) return { status: 'loading' }
  if (now >= end) return { status: 'past' }
  if (now >= start) return { status: 'today' }
  const diff = start - now
  return {
    status: 'counting',
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function CountdownItem({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex w-11 flex-col items-center">
      <span className="text-lg font-medium leading-none tabular-nums invite-names">
        {value === null ? '––' : String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[0.55rem] uppercase tracking-[0.14em] text-w-muted">{label}</span>
    </div>
  )
}

export function Countdown({ startISO = WEDDING.startISO, endISO = WEDDING.endISO }: { startISO?: string; endISO?: string }) {
  const [state, setState] = useState<CountdownState>({ status: 'loading' })

  useEffect(() => {
    const start = new Date(startISO).getTime()
    const end = new Date(endISO).getTime()
    const tick = () => setState(calculate(Date.now(), start, end))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [startISO, endISO])

  if (state.status === 'past') {
    return <p className="mt-5 text-sm italic invite-names">Cảm ơn quý khách đã đến dự ngày trọng đại của chúng tôi.</p>
  }

  if (state.status === 'today') {
    return <p className="mt-5 text-sm italic invite-names">Hôm nay là ngày vui của chúng tôi. Hẹn gặp quý khách.</p>
  }

  const counting = state.status === 'counting' ? state : null
  const parts = [
    { value: counting?.days ?? null, label: 'Ngày' },
    { value: counting?.hours ?? null, label: 'Giờ' },
    { value: counting?.minutes ?? null, label: 'Phút' },
    { value: counting?.seconds ?? null, label: 'Giây' },
  ]

  return (
    <div className="mt-5" role="timer" aria-label="Đếm ngược đến lễ thành hôn">
      <p className="text-[0.58rem] uppercase tracking-[0.28em] text-w-muted">Còn lại</p>
      <div className="mt-2 flex items-start justify-center">
        {parts.map((part, index) => (
          <div key={part.label} className="flex items-start">
            {index > 0 && <span className="mt-[0.45rem] h-1 w-1 rounded-full bg-w-line-strong" aria-hidden />}
            <CountdownItem value={part.value} label={part.label} />
          </div>
        ))}
      </div>
    </div>
  )
}
