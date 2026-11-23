'use client'

import { Countdown } from '@/components/countdown'
import { CornerOrnament, OrnamentDivider, SongHy } from '@/components/invitation-ornaments'
import { ParentsOnCard } from '@/components/parents-on-card'
import { Reveal } from '@/components/reveal'
import { useGuestName } from '@/hooks/use-guest-name'
import type { WeddingModel } from '@/lib/wedding-model'

function hourPhrase(time: string) {
  const match = /^(\d{1,2})(?::(\d{2}))?/.exec(time.trim())
  if (!match) return time
  const hour = String(Number(match[1]))
  const minute = match[2]
  if (!minute || minute === '00') return `${hour} giờ`
  return `${hour} giờ ${minute}`
}

function venuePhrase(venue: string) {
  const text = venue.trim()
  if (!text) return ''
  const lower = text.toLocaleLowerCase('vi')
  return lower.startsWith('tại ') ? `, ${lower}` : `, tại ${lower}`
}

function Names({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <h1 className="mt-6 font-serif text-[2.6rem] leading-[1.05] invite-names sm:text-5xl">
      <span className="block">{w.groom}</span>
      <span className="invite-amp my-1 block text-[0.5em]">&amp;</span>
      <span className="block">{w.bride}</span>
    </h1>
  )
}

export function InviteLetter({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  const guestName = useGuestName()
  const who = guestName || 'Quý khách'
  const when = hourPhrase(w.ceremony.time || '11:00')

  return (
    <div id="thu-moi" className="relative flex h-full scroll-mt-24 flex-col items-center justify-center px-6 pt-10 pb-14 text-center sm:px-8 sm:pt-12 sm:pb-16">
      <CornerOrnament position="top-left" />
      <CornerOrnament position="top-right" />
      <CornerOrnament position="bottom-left" />
      <CornerOrnament position="bottom-right" />
      <SongHy className="invite-hy h-14 w-16" />

      <Reveal duration={680} className="mt-5 flex flex-col items-center">
        <p className="text-[0.68rem] uppercase tracking-[0.32em] invite-muted sm:text-xs">Trân trọng kính mời</p>
        <p className="mt-2 font-serif text-[2rem] leading-none invite-names sm:text-4xl">{who}</p>
        <p className="mt-3 text-sm leading-relaxed invite-date">
          tới tham dự lễ thành hôn
          <br />
          cùng gia đình
        </p>
      </Reveal>

      <Reveal delay={60} duration={680} className="flex flex-col items-center">
        <Names model={model} />
        <OrnamentDivider className="mt-5" />
      </Reveal>

      <Reveal delay={110} duration={680} className="flex flex-col items-center">
      {w.ceremony.day && (
        <div className="mt-4 flex items-center justify-center gap-3 invite-date sm:gap-4">
          <span className="w-[5.5rem] whitespace-nowrap text-right text-[0.7rem] uppercase tracking-[0.2em] sm:w-24 sm:text-xs">
            {w.ceremony.dayOfWeek}
          </span>
          <span className="invite-date-day px-3 text-4xl font-semibold tabular-nums sm:px-4 sm:text-5xl">{w.ceremony.day}</span>
          <span className="w-[5.5rem] whitespace-nowrap text-left text-[0.7rem] uppercase tracking-[0.2em] sm:w-24 sm:text-xs">
            {w.ceremony.month}
            <br />
            {w.ceremony.year}
          </span>
        </div>
      )}
      {w.ceremony.lunarDate && <p className="mt-2 text-xs italic invite-muted sm:text-sm">({w.ceremony.lunarDate})</p>}
      <p className="mt-2 text-sm invite-date">Hôn lễ lúc {when}{venuePhrase(w.ceremony.venue)}</p>
      </Reveal>

      <Reveal delay={160} duration={680} className="mt-6 w-full max-w-[19.5rem] sm:max-w-md">
      <div className="w-full">
        <div className="mx-auto mb-4 h-px w-14 bg-w-line-strong/55" aria-hidden />
        <ParentsOnCard model={model} />
        {w.startISO && w.endISO && (
          <Countdown startISO={w.startISO} endISO={w.endISO} />
        )}
      </div>
      </Reveal>
    </div>
  )
}
