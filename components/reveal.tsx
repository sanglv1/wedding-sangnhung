'use client'

import { useInView } from '@/hooks/use-in-view'

export type RevealVariant = 'up' | 'left' | 'right' | 'zoom' | 'mask'

interface RevealProps {
  children: React.ReactNode
  className?: string
  /** Độ trễ hiệu ứng (ms) để các phần tử xuất hiện lần lượt */
  delay?: number
  /** Thời lượng hiệu ứng (ms). Bỏ trống thì dùng nhịp mặc định của trang. */
  duration?: number
  variant?: RevealVariant
}

/** Hiện dần nội dung khi cuộn tới (mờ nhòe -> rõ nét) */
export function Reveal({ children, className = '', delay = 0, duration, variant = 'up' }: RevealProps) {
  const { ref, isInView } = useInView()
  const style = {
    ...(delay ? { '--reveal-delay': `${delay}ms` } : {}),
    ...(duration ? { '--reveal-time': `${duration}ms` } : {}),
  } as React.CSSProperties

  return (
    <div
      ref={ref}
      className={`reveal reveal-${variant} ${isInView ? 'is-visible' : ''} ${className}`}
      style={Object.keys(style).length ? style : undefined}
    >
      {children}
    </div>
  )
}
