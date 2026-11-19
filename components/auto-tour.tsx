'use client'

import { useEffect } from 'react'

/** Sau khi bìa mở, nghỉ một nhịp để khách thấy mặt thiệp rồi mới trôi. */
const START_DELAY_MS = 1100
/** Giây đầu tăng tốc dần, tránh giật khi vừa mở xong. */
const EASE_IN_MS = 1400
/** Mỗi giây đi khoảng 9% chiều cao màn hình: chậm đủ để đọc, vẫn thấy là đang trôi. */
const VIEWPORTS_PER_SECOND = 0.09

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

function maxScroll() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
}

function cruiseSpeed() {
  return Math.min(96, Math.max(34, window.innerHeight * VIEWPORTS_PER_SECOND))
}

/** Sau khi mở phong bì, trang tự trôi từ trên xuống dưới. Khách cuộn hoặc bấm menu thì dừng. */
export function AutoTour() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const html = document.documentElement
    const previousBehavior = html.style.scrollBehavior

    let stopped = false
    let held = false
    let frame = 0
    let delayTimer = 0
    let writing = false
    let expected = window.scrollY
    let last = 0
    let startedAt = 0

    const release = () => {
      if (!held) return
      held = false
      html.style.scrollBehavior = previousBehavior
    }
    const stop = () => {
      stopped = true
      window.cancelAnimationFrame(frame)
      window.clearTimeout(delayTimer)
      release()
    }

    const onScroll = () => {
      if (writing) return
      if (Math.abs(window.scrollY - expected) > 2) stop()
    }
    const onKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) stop()
    }
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('a[href^="#"]')) stop()
    }

    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchmove', stop, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('click', onClick)

    const tick = (now: number) => {
      if (stopped) return
      if (document.hidden) {
        last = now
        frame = window.requestAnimationFrame(tick)
        return
      }

      const dt = Math.min(34, now - last)
      last = now
      const max = maxScroll()
      if (max <= 0 || expected >= max - 0.5) {
        stop()
        return
      }

      const elapsed = now - startedAt
      const fadeIn = Math.min(1, elapsed / EASE_IN_MS)
      const easeIn = fadeIn * fadeIn * (3 - 2 * fadeIn)
      const remain = (max - expected) / max
      const easeOut = remain < 0.08 ? Math.max(0.22, remain / 0.08) : 1
      const next = Math.min(max, expected + cruiseSpeed() * (dt / 1000) * easeIn * easeOut)

      writing = true
      expected = next
      html.scrollTop = next
      window.requestAnimationFrame(() => {
        writing = false
      })
      frame = window.requestAnimationFrame(tick)
    }

    const run = async () => {
      await waitUntilCoverGone()
      if (stopped) return
      await new Promise<void>((resolve) => {
        delayTimer = window.setTimeout(resolve, START_DELAY_MS)
      })
      if (stopped) return
      expected = window.scrollY
      if (expected >= maxScroll() - 8) return
      held = true
      html.style.scrollBehavior = 'auto'
      startedAt = performance.now()
      last = startedAt
      frame = window.requestAnimationFrame(tick)
    }

    void run()

    return () => {
      stop()
      html.style.scrollBehavior = previousBehavior
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchmove', stop)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return null
}
