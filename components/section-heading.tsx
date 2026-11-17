import { PeachBlossom } from './invitation-ornaments'
import { Reveal } from './reveal'

interface SectionHeadingProps {
  children: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
}

export function SectionHeading({ children, description, icon }: SectionHeadingProps) {
  return (
    <Reveal className="text-center mb-10 sm:mb-14">
      {icon && (
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-full bg-w-tint text-w-soft flex items-center justify-center">
            {icon}
          </div>
        </div>
      )}
      <h2 className="heading-title text-4xl md:text-5xl font-serif font-bold text-w-strong">{children}</h2>
      <div className="heading-ornament mt-4" aria-hidden>
        <span className="heading-line heading-line-left" />
        <PeachBlossom leaves className="heading-heart" />
        <span className="heading-line heading-line-right" />
      </div>
      {description && (
        <p className="text-w-muted max-w-md mx-auto text-sm sm:text-base px-2 mt-4">{description}</p>
      )}
    </Reveal>
  )
}
