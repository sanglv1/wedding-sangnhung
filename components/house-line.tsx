'use client'

import { useGuestSide } from '@/hooks/use-guest-side'
import { houseFocus } from '@/lib/house-focus'
import type { WeddingModel } from '@/lib/wedding-model'

/** Một dòng nói nhà khách được mời, và nhà còn lại chỉ là chú thích. */
export function HouseLine({ model, variant }: { model: WeddingModel; variant: 'hero' | 'cover' }) {
  const focus = houseFocus(model, useGuestSide())
  if (!focus) return null
  if (variant === 'cover') {
    return <p className="cover-date mt-2 text-xs uppercase tracking-[0.22em]">Về {focus.label.toLocaleLowerCase('vi')}</p>
  }
  return (
    <div className="mt-3 text-sm invite-muted">
      <p>Mời về {focus.label.toLocaleLowerCase('vi')}</p>
      {focus.time && focus.time !== model.wedding.ceremony.time && <p className="mt-0.5">Giờ đến: {focus.time}</p>}
    </div>
  )
}
