'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import { Check, Copy, Download, Gift, X } from 'lucide-react'
import { CLASSIC_MODEL } from '@/lib/constants'
import type { WeddingModel } from '@/lib/wedding-model'
import { isOptimizableImage } from '@/lib/media-src'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { showToast } from '@/components/ui/toast'
import { Reveal } from './reveal'
import { SectionFrame } from './section-frame'
import { SectionHeading } from './section-heading'

type GiftAccount = WeddingModel['gift']['groom']
type GiftSide = { key: 'groom' | 'bride'; role: 'Chú Rể' | 'Cô Dâu'; account: GiftAccount; fullName: string; shortName: string }

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

async function copyText(text: string, host: HTMLElement) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    // Bẫy focus của hộp thoại kéo focus khỏi textarea nằm ngoài nó, làm mất vùng chọn
    host.appendChild(textarea)
    textarea.select()
    // iOS Safari không chọn được chữ trong textarea readonly chỉ bằng select()
    textarea.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    textarea.remove()
    return ok
  }
}

function CopyAccountButton({ accountNumber, role }: { accountNumber: string; role: GiftSide['role'] }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const host = e.currentTarget.parentElement ?? document.body
    if (!(await copyText(accountNumber.replace(/\s/g, ''), host))) {
      showToast('Không chép được, vui lòng chép tay số tài khoản', 'error')
      return
    }
    showToast('Đã sao chép số tài khoản thành công!')
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      // Hộp thoại ẩn phần còn lại của trang với trình đọc màn hình, kể cả vùng toast, nên nút tự báo
      aria-live="polite"
      className="btn-shine mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-w-btn px-4 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-w-btn-hover active:scale-[0.98] touch-manipulation"
    >
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copied ? 'Đã sao chép' : `Sao chép STK ${role}`}
    </button>
  )
}

function GiftCard({ side }: { side: GiftSide }) {
  const { account, fullName, role } = side
  return (
    <div className="gift-card">
      <h3 className="gift-card-title">Mừng cưới {role}</h3>
      <p className="mt-0.5 font-semibold text-w-strong">{fullName}</p>
      {account.qrPath && (
        <div className="gift-card-qr">
          <Image
            src={account.qrPath}
            alt={`Mã QR chuyển khoản của ${fullName}`}
            fill
            className="object-contain p-2"
            sizes="176px"
            unoptimized={!isOptimizableImage(account.qrPath)}
          />
          <a
            href={account.qrPath}
            download={`qr-mung-cuoi-${side.key === 'groom' ? 'chu-re' : 'co-dau'}.png`}
            className="gift-card-save"
            aria-label={`Tải mã QR của ${fullName} về máy`}
            title="Tải mã QR về máy"
          >
            <Download className="h-4 w-4" aria-hidden />
          </a>
        </div>
      )}
      <div className="gift-card-info">
        {account.bankName && <p className="gift-card-bank">{account.bankName}</p>}
        {account.accountNumber && (
          <p className="font-mono text-xl tracking-[0.14em] text-w-strong">{account.accountNumber}</p>
        )}
        {account.accountName && <p className="text-xs uppercase tracking-wider text-w-muted">{account.accountName}</p>}
      </div>
      {account.accountNumber && <CopyAccountButton accountNumber={account.accountNumber} role={role} />}
    </div>
  )
}

/** Vuốt ngang bằng scroll-snap; thẻ đang xem quyết định tab nào sáng */
function GiftCards({ sides, initial, closeButton }: { sides: GiftSide[]; initial: number; closeButton: React.ReactNode }) {
  const [active, setActive] = useState(initial)
  const trackRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId()
  const tabbed = sides.length > 1

  useEffect(() => {
    const track = trackRef.current
    if (track) track.scrollLeft = initial * track.clientWidth
  }, [initial])

  const goTo = (index: number) => {
    const track = trackRef.current
    if (!track) return
    const smooth = !window.matchMedia(REDUCED_MOTION).matches
    track.scrollTo({ left: index * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' })
    setActive(index)
  }

  const onScroll = () => {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    const index = Math.round(track.scrollLeft / track.clientWidth)
    if (index !== active) setActive(index)
  }

  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const next = (active + (e.key === 'ArrowRight' ? 1 : -1) + sides.length) % sides.length
    goTo(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {tabbed && (
        <div role="tablist" aria-label="Chọn người nhận mừng cưới" className="gift-tabs flex-1" onKeyDown={onTabKey}>
          {sides.map((side, i) => (
            <button
              key={side.key}
              ref={(node) => {
                tabRefs.current[i] = node
              }}
              id={`${id}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls={`${id}-panel-${i}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => goTo(i)}
              className="gift-tab"
            >
              {side.role}
            </button>
          ))}
        </div>
        )}
        {closeButton}
      </div>
      <div ref={trackRef} onScroll={onScroll} className="gift-track">
        {sides.map((side, i) => (
          <section
            key={side.key}
            id={`${id}-panel-${i}`}
            role={tabbed ? 'tabpanel' : undefined}
            aria-labelledby={tabbed ? `${id}-tab-${i}` : undefined}
            inert={i !== active}
            className="gift-slide"
          >
            <GiftCard side={side} />
          </section>
        ))}
      </div>
    </>
  )
}

function sideHasDetail(account: GiftAccount) {
  return Boolean(account.qrPath || account.accountNumber || account.bankName || account.accountName)
}

function RedEnvelope({ side, onOpen }: { side: GiftSide; onOpen: (rect?: DOMRect) => void }) {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(event.currentTarget.getBoundingClientRect())}
      className="wenv"
      aria-haspopup="dialog"
      aria-label={`Mở hộp mừng cưới ${side.role.toLocaleLowerCase('vi')} ${side.fullName}`}
    >
      <span className="wenv-flap" aria-hidden />
      <span className="wenv-seal" aria-hidden>
        囍
      </span>
      <span className="wenv-role">{side.role}</span>
      <span className="wenv-name">{side.shortName}</span>
    </button>
  )
}

function burstAt(rect?: DOMRect) {
  if (!rect) return
  const x = (rect.left + rect.width / 2) / window.innerWidth
  const y = (rect.top + rect.height * 0.35) / window.innerHeight
  import('@/lib/confetti').then(({ fireGiftBurst }) => fireGiftBurst(x, y))
}

export function GiftSection({ model = CLASSIC_MODEL }: { model?: WeddingModel }) {
  // session đổi mỗi lần mở để thẻ quay về đúng tab được chọn; giữ index khi đóng để nội dung không biến mất giữa hiệu ứng
  const [dialog, setDialog] = useState({ open: false, index: 0, session: 0 })
  const WEDDING = model.wedding

  if (!model.hasGift) return null

  const sides = (
    [
      { key: 'groom', role: 'Chú Rể', account: model.gift.groom, fullName: WEDDING.groom, shortName: WEDDING.groomShort },
      { key: 'bride', role: 'Cô Dâu', account: model.gift.bride, fullName: WEDDING.bride, shortName: WEDDING.brideShort },
    ] satisfies GiftSide[]
  ).filter((side) => sideHasDetail(side.account))

  const open = (index: number) => (rect?: DOMRect) => {
    setDialog((d) => ({ open: true, index, session: d.session + 1 }))
    burstAt(rect)
  }

  return (
    <>
      <section id="hop-mung" className="scroll-mt-16 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SectionFrame>
            <SectionHeading
              icon={<Gift className="w-7 h-7" aria-hidden />}
              description="Gửi lời chúc phúc đến chú rể và cô dâu qua mã QR hoặc số tài khoản."
            >
              Hộp mừng cưới
            </SectionHeading>

            <Reveal delay={120} className="flex flex-col items-center">
              <div className={`grid w-full gap-4 sm:gap-6 ${sides.length > 1 ? 'max-w-[22rem] grid-cols-2' : 'max-w-[11rem]'}`}>
                {sides.map((side, i) => (
                  <div key={side.key} className="wenv-float flex justify-center" style={{ animationDelay: `${i * 0.45}s` }}>
                    <RedEnvelope side={side} onOpen={open(i)} />
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-w-muted">Chọn hộp để xem mã QR</p>
            </Reveal>
          </SectionFrame>
        </div>
      </section>

      <Dialog open={dialog.open} onOpenChange={(next) => !next && setDialog((d) => ({ ...d, open: false }))}>
        <DialogContent
          showCloseButton={false}
          className="gift-modal bg-w-bg border-w-gold/45 w-[calc(100%-1.5rem)] max-w-[24rem] sm:max-w-[24rem] max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-[1.75rem] gap-3 p-3 sm:p-4 text-w-text"
        >
          <DialogTitle className="sr-only">Hộp mừng cưới</DialogTitle>
          <DialogDescription className="sr-only">
            Quét mã QR bằng ứng dụng ngân hàng hoặc sao chép số tài khoản của chú rể và cô dâu.
          </DialogDescription>
          <GiftCards
            key={dialog.session}
            sides={sides}
            initial={Math.min(dialog.index, sides.length - 1)}
            closeButton={
              <DialogClose
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-w-line text-w-soft transition-colors hover:bg-w-tint hover:text-w-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-w-gold"
                aria-label="Đóng hộp mừng cưới"
              >
                <X className="h-5 w-5" aria-hidden />
              </DialogClose>
            }
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
