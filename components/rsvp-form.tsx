'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useGuestName } from '@/hooks/use-guest-name'
import { useGuestSide } from '@/hooks/use-guest-side'
import { normalizePhone, postRsvp, RSVP_GUEST_OPTIONS, VN_PHONE } from '@/lib/rsvp'
import { Reveal } from './reveal'
import { SectionFrame } from './section-frame'
import { SectionHeading } from './section-heading'

/** Chỉ dùng khi chưa kết nối Upstash Redis */
const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID

const INITIAL_FORM = {
  /** null = khách chưa sửa, dùng tên trong link mời */
  name: null as string | null,
  phone: '',
  attendance: 'yes' as 'yes' | 'no',
  side: 'groom' as 'groom' | 'bride',
  guests: '1',
  note: '',
}

async function postFormspree(payload: Record<string, string>) {
  const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Gửi thất bại')
}

function RadioOption({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string
  value: string
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  children: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 cursor-pointer accent-[var(--w-btn)]"
      />
      <span className="text-w-text">{children}</span>
    </label>
  )
}

export function RSVPForm() {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [gotcha, setGotcha] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<{ name: string; attending: boolean } | null>(null)
  const thanksRef = useRef<HTMLHeadingElement>(null)
  const guestName = useGuestName()
  const name = formData.name ?? guestName ?? ''

  // Khung cảm ơn ngắn hơn form nhiều: kéo khách về đúng chỗ thay vì để họ đứng giữa phần bên dưới
  useEffect(() => {
    if (status !== 'success') return
    const heading = thanksRef.current
    if (!heading) return
    heading.focus({ preventScroll: true })
    const { top, bottom } = heading.getBoundingClientRect()
    if (top < 80 || bottom > window.innerHeight) {
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      heading.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' })
    }
  }, [status])

  const invitedSide = useGuestSide()
  const [pickedSide, setPickedSide] = useState<'groom' | 'bride' | null>(null)
  const side = pickedSide ?? invitedSide ?? formData.side

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === 'side' && (value === 'groom' || value === 'bride')) setPickedSide(value)
    if (name === 'phone') setPhoneError(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const phone = normalizePhone(formData.phone)
    if (!VN_PHONE.test(phone)) {
      setPhoneError('Số điện thoại chưa đúng, ví dụ: 0912 345 678')
      document.getElementById('rsvp-phone')?.focus()
      return
    }

    setStatus('submitting')
    const attending = formData.attendance === 'yes'
    try {
      try {
        await postRsvp({
          name: name.trim(),
          phone,
          attending,
          side,
          guests: formData.guests,
          note: formData.note.trim(),
          invite: guestName ?? undefined,
          _gotcha: gotcha,
        })
      } catch (err) {
        if ((err as { status?: number }).status !== 503) throw err
        if (!FORMSPREE_ID) {
          throw new Error('Hệ thống xác nhận đang được cập nhật. Vui lòng báo trực tiếp cho cô dâu chú rể.')
        }
        await postFormspree({
          name: name.trim(),
          phone,
          attendance: attending ? 'Có, tôi sẽ tham dự' : 'Không, xin lỗi',
          side: side === 'groom' ? 'Khách nhà trai' : 'Khách nhà gái',
          guests: attending ? formData.guests : '0',
          note: formData.note.trim() || '(Không có)',
          _subject: `Xác nhận tham dự: ${name.trim()}`,
          _gotcha: gotcha,
        })
      }
      setSent({ name: name.trim(), attending })
      setStatus('success')
      setPickedSide(null)
      setFormData({ ...INITIAL_FORM, name: '' })
    } catch (err) {
      setStatus('error')
      const message = err instanceof Error && err.message !== 'Failed to fetch' ? err.message : ''
      setError(message || 'Không thể gửi. Vui lòng kiểm tra kết nối mạng và thử lại.')
    }
  }

  const isAttending = formData.attendance === 'yes'

  return (
    <section id="xac-nhan" className="scroll-mt-16 py-12 sm:py-16 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <SectionFrame>
          <SectionHeading description="Vui lòng xác nhận để gia đình chuẩn bị chu đáo nhất">
            Xác nhận tham dự
          </SectionHeading>

          <Reveal className="card-wedding rounded-2xl p-6 sm:p-8 md:p-10">
            {status === 'success' ? (
              <div className="rsvp-thanks text-center py-8" role="status">
                <CheckCircle2 className="rsvp-thanks-icon w-16 h-16 text-w-soft mx-auto mb-4" aria-hidden />
                <h3 ref={thanksRef} tabIndex={-1} className="text-xl font-semibold text-w-strong mb-2 focus:outline-none">
                  {sent?.name ? `Cảm ơn ${sent.name}!` : 'Cảm ơn bạn đã xác nhận!'}
                </h3>
                <p className="text-w-muted mb-6">
                  {sent?.attending === false
                    ? 'Tiếc vì bạn không đến được. Cảm ơn bạn đã báo để gia đình biết.'
                    : 'Gia đình đã nhận được xác nhận. Hẹn gặp bạn trong ngày vui!'}
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="min-h-11 text-sm font-medium text-w-text underline underline-offset-4"
                >
                  Gửi thêm xác nhận cho người khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="rsvp-name" className="block text-sm font-medium text-w-text mb-2">
                    Họ và tên *
                  </label>
                  <input
                    id="rsvp-name"
                    name="name"
                    value={name}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên của bạn"
                    required
                    autoComplete="name"
                    maxLength={80}
                    className="field-wedding"
                  />
                </div>

                <div>
                  <label htmlFor="rsvp-phone" className="block text-sm font-medium text-w-text mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    id="rsvp-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0900 000 000"
                    required
                    autoComplete="tel"
                    aria-invalid={phoneError ? true : undefined}
                    aria-describedby={phoneError ? 'rsvp-phone-error' : undefined}
                    className="field-wedding"
                  />
                  {phoneError && (
                    <p id="rsvp-phone-error" className="error-wedding mt-2">
                      {phoneError}
                    </p>
                  )}
                </div>

                <fieldset>
                  <legend className="text-sm font-medium text-w-text mb-2">Bạn có thể tham dự không? *</legend>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-6">
                    <RadioOption name="attendance" value="yes" checked={isAttending} onChange={handleChange}>
                      Có, tôi sẽ tham dự
                    </RadioOption>
                    <RadioOption name="attendance" value="no" checked={!isAttending} onChange={handleChange}>
                      Rất tiếc, tôi không đến được
                    </RadioOption>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-medium text-w-text mb-2">Bạn là khách của *</legend>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-6">
                    <RadioOption name="side" value="groom" checked={side === 'groom'} onChange={handleChange}>
                      Nhà trai
                    </RadioOption>
                    <RadioOption name="side" value="bride" checked={side === 'bride'} onChange={handleChange}>
                      Nhà gái
                    </RadioOption>
                  </div>
                </fieldset>

                {isAttending && (
                  <div>
                    <label htmlFor="rsvp-guests" className="block text-sm font-medium text-w-text mb-2">
                      Số người tham dự (tính cả bạn)
                    </label>
                    <select
                      id="rsvp-guests"
                      name="guests"
                      value={formData.guests}
                      onChange={handleChange}
                      className="field-wedding"
                    >
                      {RSVP_GUEST_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n === '6+' ? 'Từ 6 người trở lên' : `${n} người`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="rsvp-note" className="block text-sm font-medium text-w-text mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    id="rsvp-note"
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="Ví dụ: ăn chay, đi cùng trẻ nhỏ..."
                    rows={3}
                    maxLength={500}
                    className="field-wedding resize-y"
                  />
                </div>

                <input
                  type="text"
                  name="_gotcha"
                  value={gotcha}
                  onChange={(e) => setGotcha(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden
                />

                {error && (
                  <p className="error-wedding text-center" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  aria-busy={status === 'submitting'}
                  className="btn-shine inline-flex w-full items-center justify-center gap-2 bg-w-btn hover:bg-w-btn-hover text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-70"
                >
                  {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {status === 'submitting' ? 'Đang gửi...' : 'Gửi xác nhận'}
                </button>
              </form>
            )}
          </Reveal>
        </SectionFrame>
      </div>
    </section>
  )
}
