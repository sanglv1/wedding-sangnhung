'use client'

import { useEffect, useRef, useState } from 'react'

export function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.08) {
  const ref = useRef<T>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsInView(true)
      return
    }

    let cancelled = false
    let io: IntersectionObserver | null = null
    let mo: MutationObserver | null = null

    const arm = () => {
      if (cancelled || !ref.current) return
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return
          setIsInView(true)
          io?.disconnect()
        },
        // Chừa một khoảng dưới màn hình để khối chỉ trồi lên khi đã lướt tới, không phải lúc mới ló mép
        { threshold, rootMargin: '0px 0px -12% 0px' },
      )
      io.observe(ref.current)
    }

    // Đừng chạy khi phong bì còn che: khách không thấy, và lúc mở ra thì hiệu ứng đã hết
    if (!document.querySelector('.wax-root')) {
      arm()
    } else {
      mo = new MutationObserver(() => {
        if (document.querySelector('.wax-root')) return
        mo?.disconnect()
        arm()
      })
      mo.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      cancelled = true
      mo?.disconnect()
      io?.disconnect()
    }
  }, [threshold])

  return { ref, isInView }
}
