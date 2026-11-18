'use client'

import { useEffect } from 'react'

const STOPS = ['thu-moi', 'lich-trinh', 'khoanh-khac', 'xac-nhan', 'loi-chuc', 'hop-mung']
const PAUSE_MS = 3400

function waitUntilCoverGone() {
  return new Promise<void>((resolve) => {
    if (!document.querySelector('.wax-root')) {
      resolve()
      return
    }
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.wax-root')) {
        observer.disconnect()
        resolve()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

/** Sau khi mở phong bì, trang tự lướt qua từng phần. Khách cuộn hoặc bấm menu thì dừng. */
export function AutoTour() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let stopped = false
    let armed = false
    const timers: number[] = []

    const stop = () => {
      if (armed) stopped = true
    }
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms))
      })

    const onKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) stop()
    }
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('a[href^="#"]')) stop()
    }

    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchstart', stop, { passive: true })
    window.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)

    const run = async () => {
      await waitUntilCoverGone()
      await sleep(1600)
      if (stopped) return
      armed = true

      for (const id of STOPS) {
        if (stopped) return
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top >= 0 && top < window.innerHeight * 0.35) continue
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        await sleep(PAUSE_MS)
      }
    }

    void run()

    return () => {
      stopped = true
      timers.forEach((id) => window.clearTimeout(id))
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return null
}
