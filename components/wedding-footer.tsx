import { OrnamentDivider } from './invitation-ornaments'
import { Reveal } from './reveal'

export function WeddingFooter() {
  return (
    <footer className="relative z-[1] py-8 sm:py-[calc(4rem*2/3)] md:py-[calc(5rem*2/3)]">
      <Reveal className="max-w-4xl mx-auto px-4 text-center sm:px-6">
        <OrnamentDivider className="mb-6" />
        <h2 className="mb-4 font-sans text-2xl font-medium tracking-[0.14em] text-w-strong uppercase sm:text-3xl">Trân trọng cảm ơn</h2>
        <p className="mx-auto max-w-lg text-base italic text-w-soft sm:text-lg">
          Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi.
        </p>
      </Reveal>
    </footer>
  )
}
