'use client'

import { CalendarPlus, MapPin } from 'lucide-react'
import { useGuestSide } from '@/hooks/use-guest-side'
import { houseFocus } from '@/lib/house-focus'
import { CLASSIC_MODEL } from '@/lib/constants'
import type { WeddingModel } from '@/lib/wedding-model'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const VAGUE_PLACE = /^(tư gia|tại gia)/i

function addressFor(model: WeddingModel, focus: ReturnType<typeof houseFocus>) {
  if (focus?.place && !VAGUE_PLACE.test(focus.place.trim())) return focus.place
  if (focus?.side === 'bride') return model.familyAddresses.brideFamily.address
  return model.wedding.ceremony.location || model.familyAddresses.groomFamily.address
}

export function ScheduleSection({ model = CLASSIC_MODEL }: { model?: WeddingModel }) {
  const wedding = model.wedding
  const focus = houseFocus(model, useGuestSide())
  const address = addressFor(model, focus)
  const direction = focus?.mapsUrl || model.familyAddresses.groomFamily.mapsUrl
  const hasSheet = Boolean(wedding.ceremony.time || wedding.date || wedding.intimateMeal.time || address)
  if (!hasSheet) return null

  return (
    <section id="lich-trinh" className="scroll-mt-16 py-16 sm:py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="section-frame">
          <SectionHeading>Lịch trình</SectionHeading>
          <Reveal className="ceremony-card rounded-2xl px-6 py-8 text-center sm:px-10 sm:py-10">
            <div>
              <h3 className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-w-label">{wedding.ceremony.name}</h3>
              {wedding.ceremony.time && <p className="mt-2 font-sans text-lg text-w-strong sm:text-xl">{wedding.ceremony.time}</p>}
              {wedding.date && <p className="mt-1 text-sm text-w-soft">{wedding.date}</p>}
              {wedding.ceremony.lunarDate && <p className="ceremony-lunar mt-1 text-sm italic">({wedding.ceremony.lunarDate})</p>}
            </div>

            {wedding.intimateMeal.time && (
              <>
                <div className="mx-auto my-6 h-px w-16 bg-w-line" aria-hidden />
                <div>
                  <h3 className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-w-label">{wedding.intimateMeal.name}</h3>
                  <p className="mt-2 font-sans text-lg text-w-strong sm:text-xl">{wedding.intimateMeal.time}</p>
                </div>
              </>
            )}

            {address && (
              <>
                <div className="mx-auto my-6 h-px w-16 bg-w-line" aria-hidden />
                <div>
                  <h3 className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-w-label">
                    {focus ? `Địa chỉ ${focus.label.toLocaleLowerCase('vi')}` : 'Địa chỉ'}
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-w-strong">{address}</p>
                </div>
              </>
            )}

            {(direction || wedding.addToCalendarUrl) && (
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {direction && (
                  <a
                    href={direction}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ceremony-btn inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
                  >
                    <MapPin className="h-4 w-4" aria-hidden />
                    Chỉ đường
                  </a>
                )}
                {wedding.addToCalendarUrl && (
                  <a
                    href={wedding.addToCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ceremony-btn inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
                  >
                    <CalendarPlus className="h-4 w-4" aria-hidden />
                    Thêm lịch
                  </a>
                )}
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
