'use client'

import { useSyncExternalStore } from 'react'
import { readGuestSide } from '@/lib/guest'

const noopSubscribe = () => () => {}

/** Nhà khách được mời, từ ?nha=trai hoặc ?nha=gai. Null khi link không gắn nhà. */
export function useGuestSide() {
  return useSyncExternalStore(
    noopSubscribe,
    () => readGuestSide(window.location.search),
    () => null,
  )
}
