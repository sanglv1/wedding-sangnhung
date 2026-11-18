'use client'

import { useSyncExternalStore } from 'react'
import { readGuestName } from '@/lib/guest'

const noopSubscribe = () => () => {}

/** true sau khi đã ở trình duyệt, false lúc render trên server */
export function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

/** Tên khách từ ?to=... (null khi render ở server hoặc link không có tên) */
export function useGuestName() {
  return useSyncExternalStore(
    noopSubscribe,
    () => readGuestName(window.location.search),
    () => null,
  )
}
