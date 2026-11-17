import { ChevronDown } from 'lucide-react'
import { CLASSIC_MODEL } from '@/lib/constants'
import type { WeddingModel } from '@/lib/wedding-model'
import { Countdown } from './countdown'
import { GuestGreeting } from './guest-greeting'
import { HeroPhoto } from './hero-photo'
import { HouseLine } from './house-line'
import { CornerOrnament, OrnamentDivider, SongHy } from './invitation-ornaments'
import { TiltCard } from './tilt-card'

function Names({ model, className }: { model: WeddingModel; className: string }) {
  const { wedding: w } = model
  return (
    <h1 className={className}>
      <span className="block">{w.groomShort}</span>
      <span className="block text-[0.55em] invite-amp my-0.5">&amp;</span>
      <span className="block">{w.brideShort}</span>
    </h1>
  )
}

function ScrollHint({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="mx-auto mt-6 flex w-fit min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 p-2 text-w-muted transition-colors hover:text-w-strong touch-manipulation sm:mt-8"
      aria-label={href === '#cau-chuyen' ? 'Cuộn xuống phần câu chuyện' : 'Cuộn xuống'}
    >
      <ChevronDown className="h-5 w-5" />
    </a>
  )
}

export function HeroSection({ model = CLASSIC_MODEL }: { model?: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="pt-20 sm:pt-24 md:pt-28 pb-10 sm:pb-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <TiltCard className="hero-card-in">
          <article className="invite-fold grid md:grid-cols-2">
            <div className="invite-photo relative p-3 sm:p-4">
              <div className="invite-card-inner h-full flex flex-col p-2.5 sm:p-3">
                <HeroPhoto className="aspect-[4/5] md:aspect-auto md:flex-1 md:min-h-[22rem]" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
                {w.dateShort && (
                  <div className="pt-4 pb-1.5 text-center">
                    <p className="invite-kicker">Lễ thành hôn</p>
                    <p className="mt-1.5 text-xl sm:text-2xl font-light tracking-[0.25em] tabular-nums invite-date">
                      {w.dateShort.replaceAll('/', ' · ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="invite-paper p-3 sm:p-4">
              <div className="invite-card-inner h-full flex flex-col items-center justify-center text-center px-5 sm:px-8 py-10 sm:py-12">
                <CornerOrnament position="top-left" />
                <CornerOrnament position="top-right" />
                <CornerOrnament position="bottom-left" />
                <CornerOrnament position="bottom-right" />
                <SongHy className="invite-hy h-7 w-14" />
                <p className="invite-kicker mt-2">{model.announcement}</p>
                <GuestGreeting />
                <Names model={model} className="mt-4 font-serif text-[2.6rem] sm:text-5xl leading-[1.1] invite-names invite-shimmer" />
                <OrnamentDivider className="mt-5" />
                {w.ceremony.day && (
                  <div className="mt-4 flex items-center justify-center gap-3 sm:gap-4 invite-date">
                    <span className="w-[5.5rem] sm:w-24 text-right text-[0.7rem] sm:text-xs uppercase tracking-[0.2em] whitespace-nowrap">
                      {w.ceremony.dayOfWeek}
                    </span>
                    <span className="invite-date-day px-3 sm:px-4 text-4xl sm:text-5xl font-semibold tabular-nums">{w.ceremony.day}</span>
                    <span className="w-[5.5rem] sm:w-24 text-left text-[0.7rem] sm:text-xs uppercase tracking-[0.2em] whitespace-nowrap">
                      {w.ceremony.month}
                      <br />
                      {w.ceremony.year}
                    </span>
                  </div>
                )}
                {w.ceremony.lunarDate && <p className="mt-2 text-xs sm:text-sm italic invite-muted">({w.ceremony.lunarDate})</p>}
                {w.ceremony.timeDisplay && <p className="mt-1 text-xs sm:text-sm invite-muted">Vào lúc {w.ceremony.timeDisplay.toLowerCase()}</p>}
                <HouseLine model={model} variant="hero" />
                {w.startISO && w.endISO && (
                  <div className="mt-6">
                    <Countdown startISO={w.startISO} endISO={w.endISO} />
                  </div>
                )}
              </div>
            </div>
          </article>
        </TiltCard>
        <ScrollHint href={model.hasStory ? '#cau-chuyen' : '#gia-dinh'} />
      </div>
    </section>
  )
}
