import { ChevronDown } from 'lucide-react'
import { InviteLetter } from '@/components/invite-letter'
import { CLASSIC_MODEL } from '@/lib/constants'
import type { WeddingModel } from '@/lib/wedding-model'
import { HeroPhoto } from './hero-photo'
import { TiltCard } from './tilt-card'

function ScrollHint() {
  return (
    <a
      href="#lich-trinh"
      className="absolute bottom-0 left-1/2 z-10 flex h-11 w-11 -translate-x-1/2 translate-y-1/2 items-center justify-center text-w-muted transition-colors hover:text-w-strong touch-manipulation"
      aria-label="Cuộn xuống phần bữa cơm thân mật"
    >
      <ChevronDown className="h-5 w-5" />
    </a>
  )
}

export function HeroSection({ model = CLASSIC_MODEL }: { model?: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="relative z-[1] pt-20 pb-8 sm:pt-24 sm:pb-[calc(4rem*2/3)] md:pt-28 md:pb-[calc(5rem*2/3)]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <TiltCard className="hero-card-in">
          <article className="invite-fold grid md:grid-cols-2 lg:grid-cols-[minmax(0,1.42fr)_minmax(0,1fr)]">
            <div className="invite-photo relative flex items-center">
              <HeroPhoto
                framed={false}
                className="aspect-[2/3] w-full"
                hero={model.hero}
                groomShort={w.groomShort}
                brideShort={w.brideShort}
              />
            </div>
            <div className="invite-paper">
              <InviteLetter model={model} />
            </div>
          </article>
        </TiltCard>
        <ScrollHint />
      </div>
    </section>
  )
}
