import { CLASSIC_MODEL } from '@/lib/constants'
import type { WeddingModel } from '@/lib/wedding-model'
import { OrnamentDivider } from './invitation-ornaments'
import { Reveal } from './reveal'
import { SectionFrame } from './section-frame'

export function StorySection({ model = CLASSIC_MODEL }: { model?: WeddingModel }) {
  const LOVE_STORY = model.loveStory
  if (!model.hasStory) return null
  return (
    <section id="cau-chuyen" className="scroll-mt-16 py-8 sm:py-[calc(4rem*2/3)] md:py-[calc(5rem*2/3)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Reveal>
          <SectionFrame>
          <h2 className="heading-title text-center font-sans text-3xl font-medium tracking-wide text-w-strong md:text-4xl">
            {LOVE_STORY.title}
          </h2>
          <OrnamentDivider className="mt-4 mb-6 sm:mb-8" />

          {LOVE_STORY.story && (
            <p className="text-base sm:text-lg text-w-text leading-relaxed text-center mb-10 sm:mb-12 max-w-2xl mx-auto">
              {LOVE_STORY.story}
            </p>
          )}

          {/* Timeline dọc - nội dung xen kẽ trái-phải */}
          <div className="relative">
            <div className="timeline-track" aria-hidden>
              <span className="timeline-fill" />
            </div>
            <ol>
              {LOVE_STORY.timeline.map((item, i) => {
                const isLeft = i % 2 === 0
                const content = (
                  <Reveal
                    delay={120}
                    variant={isLeft ? 'left' : 'right'}
                    className={`max-w-[85%] sm:max-w-[75%] ${isLeft ? 'text-right' : 'text-left'}`}
                  >
                    <p className="font-bold text-w-strong text-base sm:text-lg">{item.date}</p>
                    <p className="text-w-soft text-sm sm:text-base mt-0.5">{item.event}</p>
                  </Reveal>
                )
                return (
                  <li key={`${item.date}-${item.event}-${i}`} className="relative flex items-center min-h-[4rem] py-6 first:pt-0 last:pb-0">
                    <div className="flex-1 flex justify-end pr-6 sm:pr-8">{isLeft && content}</div>
                    <div
                      className="timeline-dot w-4 h-4 rounded-full bg-w-gold border-2 border-white shadow-md shrink-0 z-10"
                      aria-hidden
                    />
                    <div className="flex-1 flex justify-start pl-6 sm:pl-8">{!isLeft && content}</div>
                  </li>
                )
              })}
            </ol>
          </div>
          </SectionFrame>
        </Reveal>
      </div>
    </section>
  )
}
