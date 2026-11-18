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
      className="mx-auto mt-6 flex w-fit min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 p-2 text-w-muted transition-colors hover:text-w-strong touch-manipulation sm:mt-8"
      aria-label="Cuộn xuống phần bữa cơm thân mật"
    >
      <ChevronDown className="h-5 w-5" />
    </a>
  )
}

export function HeroSection({ model = CLASSIC_MODEL }: { model?: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="pt-20 pb-10 sm:pt-24 sm:pb-14 md:pt-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <TiltCard className="hero-card-in">
          <article className="invite-fold grid md:grid-cols-2">
            <div className="invite-photo relative p-3 sm:p-4">
              <div className="invite-card-inner flex h-full flex-col p-2.5 sm:p-3">
                <HeroPhoto
                  className="aspect-[4/5] md:aspect-auto md:min-h-[22rem] md:flex-1"
                  hero={model.hero}
                  groomShort={w.groomShort}
                  brideShort={w.brideShort}
                />
              </div>
            </div>
            <div className="invite-paper p-3 sm:p-4">
              <InviteLetter model={model} />
            </div>
          </article>
        </TiltCard>
        <ScrollHint />
      </div>
    </section>
  )
}
