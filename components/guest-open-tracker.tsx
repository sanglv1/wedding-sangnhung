'use client'

import { useEffect } from 'react'
import { guestKey, PREVIEW_PARAM, readGuestId, readGuestName, readGuestSide } from '@/lib/guest'
import { recordGuestOpen } from '@/lib/guests'

/** Báo cho trang quản lý biết khách đã mở link mời (mỗi phiên trình duyệt tính một lần) */
export function GuestOpenTracker({ endpoint = '/api/guest-open' }: { endpoint?: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const name = readGuestName(window.location.search)
    if (!name || params.has(PREVIEW_PARAM)) return
    const id = readGuestId(window.location.search)
    const side = readGuestSide(window.location.search)
    const flag = `guest-opened:${endpoint}:${id || guestKey(name)}:${side ?? ''}`
    try {
      if (sessionStorage.getItem(flag)) return
      sessionStorage.setItem(flag, '1')
    } catch {}
    recordGuestOpen(name, endpoint, { id, side }).catch(() => {})
  }, [endpoint])
  return null
}
