'use client'

import { useEffect, useState } from 'react'
import { useInView } from '@/hooks/use-in-view'

/** Chữ hiện dần từng nhịp khi phần đó đi vào màn hình. */
export function RunningText({ text, className = '' }: { text: string; className?: string }) {
  const { ref, isInView } = useInView<HTMLSpanElement>(0.4)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView || !text) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let i = 0
    const id = window.setInterval(() => {
      i = reduce ? text.length : i + 1
      setCount(Math.min(i, text.length))
      if (i >= text.length) window.clearInterval(id)
    }, reduce ? 0 : 24)
    return () => window.clearInterval(id)
  }, [isInView, text])

  const done = count >= text.length

  return (
    <span ref={ref} className={className}>
      {text.slice(0, count)}
      {text && !done && <span className="run-caret" aria-hidden />}
      {count === 0 && '\u00a0'}
    </span>
  )
}
