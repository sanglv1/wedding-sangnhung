'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Check, Copy, Download, ExternalLink, FileUp, MessageCircle, RefreshCw, Send, Trash2, UserPlus } from 'lucide-react'
import { FAMILY_ADDRESSES, WEDDING } from '@/lib/constants'
import { guestKey, guestLink, type GuestSide } from '@/lib/guest'
import { parseGuestImport, type GuestDraft } from '@/lib/guest-import'
import { addGuests, deleteGuest, fetchGuests, setGuestSent, setGuestSide, type GuestRecord } from '@/lib/guests'
import { fetchRsvps, type RsvpEntry } from '@/lib/rsvp'
import { isPhoneDevice, smsHref } from '@/lib/share-invite'
import { Badge, BTN, BTN_DANGER, copyText, dateFormatter, downloadCsv, errorText, FilterChips, StatCard } from './shared'

type Filter = 'all' | 'unsent' | 'sent' | 'groom' | 'bride' | 'unassigned' | 'unopened' | 'opened' | 'replied' | 'unreplied'

function houseBits(side: GuestSide | '' | undefined) {
  if (side !== 'groom' && side !== 'bride') return { nha: '', diachi: '', gio: '' }
  const home = side === 'groom' ? FAMILY_ADDRESSES.groomFamily : FAMILY_ADDRESSES.brideFamily
  return {
    nha: home.label.toLocaleLowerCase('vi'),
    diachi: home.address,
    gio: home.time || WEDDING.ceremony.time,
  }
}

const MEAL_WEEKDAYS = ['chủ nhật', 'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy']

function mealInviteWhen(time: string) {
  const match = /(\d{1,2})\s*h(?:\s*(\d{2}))?[^\d]*(\d{1,2})\/(\d{1,2})\/(\d{4})/i.exec(time)
  if (!match) return time
  const hour = Number(match[1])
  const minute = match[2] ?? '00'
  const day = Number(match[3])
  const month = Number(match[4])
  const year = Number(match[5])
  const weekday = MEAL_WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  const part = hour < 11 ? 'sáng' : hour < 13 ? 'trưa' : hour < 18 ? 'chiều' : 'tối'
  return `${String(hour).padStart(2, '0')}:${minute} ${part}, ${weekday} ngày ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

const TEMPLATE_KEY = 'guest-invite-template'
const PREVIOUS_TEMPLATE =
  `Trân trọng kính mời {ten} tới dự lễ thành hôn của ${WEDDING.groomShort} & ${WEDDING.brideShort} ` +
  `vào lúc ${WEDDING.ceremony.timeDisplay.toLowerCase()}, ${WEDDING.ceremony.dayOfWeek.toLowerCase()} ngày ${WEDDING.dateShort}.\n` +
  `Thiệp mời: {link}`
const DEFAULT_TEMPLATE =
  `Trân trọng kính mời {ten} tới dự ${WEDDING.intimateMeal.name.toLocaleLowerCase('vi')} của ${WEDDING.groomShort} & ${WEDDING.brideShort} ` +
  `vào lúc ${mealInviteWhen(WEDDING.intimateMeal.time)}.\n` +
  `Thiệp mời: {link}`

const noopSubscribe = () => () => {}

function readTemplate() {
  try {
    const saved = localStorage.getItem(TEMPLATE_KEY)
    if (!saved || saved === PREVIOUS_TEMPLATE) return DEFAULT_TEMPLATE
    return saved
  } catch {
    return DEFAULT_TEMPLATE
  }
}

type InviteRow = GuestRecord & { link: string; preview: string; message: string; rsvp?: RsvpEntry }

export function GuestsPanel({ password }: { password: string }) {
  const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => '')
  const savedTemplate = useSyncExternalStore(noopSubscribe, readTemplate, () => DEFAULT_TEMPLATE)
  const phoneDevice = useSyncExternalStore(noopSubscribe, () => isPhoneDevice(navigator.userAgent), () => false)
  const [editedTemplate, setEditedTemplate] = useState<string | null>(null)
  const template = editedTemplate ?? savedTemplate
  const fileRef = useRef<HTMLInputElement>(null)

  const [guests, setGuests] = useState<GuestRecord[]>([])
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingKey, setSendingKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [namesText, setNamesText] = useState('')
  const [batchSide, setBatchSide] = useState<GuestSide | ''>('')
  const [filter, setFilter] = useState<Filter>('all')
  const [copied, setCopied] = useState<string | null>(null)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState('')

  const refresh = useCallback(
    () =>
      Promise.all([fetchGuests(password), fetchRsvps(password)])
        .then(([g, r]) => {
          setGuests(g)
          setRsvps(r)
        })
        .catch((err) => setError(errorText(err)))
        .finally(() => setLoading(false)),
    [password],
  )
  const load = () => {
    setLoading(true)
    setError('')
    return refresh()
  }

  useEffect(() => {
    refresh()
  }, [refresh])

  const rsvpByGuest = useMemo(() => {
    const map = new Map<string, RsvpEntry>()
    for (const r of rsvps) {
      const key = guestKey(r.invite || r.name)
      if (!map.has(key)) map.set(key, r)
    }
    return map
  }, [rsvps])

  const rows = useMemo(
    () =>
      guests.map((g) => {
        const link = guestLink(origin, g.name, false, '/', g.side)
        const house = houseBits(g.side)
        return {
          ...g,
          link,
          preview: guestLink(origin, g.name, true, '/', g.side),
          message: template
            .replaceAll('{ten}', g.name)
            .replaceAll('{link}', link)
            .replaceAll('{nha}', house.nha)
            .replaceAll('{diachi}', house.diachi)
            .replaceAll('{gio}', house.gio),
          rsvp: rsvpByGuest.get(g.key),
        }
      }),
    [guests, origin, template, rsvpByGuest],
  )

  const shown = rows.filter((r) => {
    if (filter === 'unsent') return !r.sentAt
    if (filter === 'sent') return Boolean(r.sentAt)
    if (filter === 'groom') return r.side === 'groom'
    if (filter === 'bride') return r.side === 'bride'
    if (filter === 'unassigned') return !r.side
    if (filter === 'unopened') return !r.opens
    if (filter === 'opened') return Boolean(r.opens)
    if (filter === 'replied') return Boolean(r.rsvp)
    if (filter === 'unreplied') return !r.rsvp
    return true
  })

  const imported = useMemo(() => parseGuestImport(namesText), [namesText])
  const pending = useMemo(
    () => imported.guests.map((guest) => ({ ...guest, side: guest.side || batchSide })),
    [imported.guests, batchSide],
  )
  const nextUnsent = rows.find((r) => !r.sentAt)
  const unsentCount = rows.filter((r) => !r.sentAt).length
  const withPhone = pending.filter((g) => g.phone).length

  const add = async () => {
    if (pending.length === 0) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const { added, filled } = await addGuests(pending, password)
      const skipped = pending.length - added - filled
      const parts = [`Đã thêm ${added} khách`]
      if (filled > 0) parts.push(`bổ sung nhà hoặc số cho ${filled} khách`)
      if (skipped > 0) parts.push(`${skipped} tên đã có sẵn`)
      setNotice(`${parts.join(', ')}.`)
      setNamesText('')
      await load()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  const readGuestFile = async (file: File) => {
    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.txt') && !lower.endsWith('.csv')) {
      setError('Chỉ đọc được file .txt và .csv. Với Excel, chép cột tên rồi dán vào ô, hoặc lưu thành CSV.')
      return
    }
    setNamesText(await file.text())
    setError('')
  }

  const remove = async (g: GuestRecord) => {
    if (!window.confirm(`Xoá "${g.name}" khỏi danh sách khách mời?`)) return
    setDeletingKey(g.key)
    setError('')
    try {
      await deleteGuest(g.key, password)
      setGuests((prev) => prev.filter((x) => x.key !== g.key))
    } catch (err) {
      setError(errorText(err))
    } finally {
      setDeletingKey(null)
    }
  }

  const assignSide = async (row: InviteRow, value: string) => {
    const side = value === 'groom' || value === 'bride' ? value : null
    const previous = row.side
    setGuests((prev) => prev.map((g) => (g.key === row.key ? { ...g, side: side ?? undefined } : g)))
    setError('')
    try {
      await setGuestSide(row.key, password, side)
    } catch (err) {
      setGuests((prev) => prev.map((g) => (g.key === row.key ? { ...g, side: previous } : g)))
      setError(errorText(err))
    }
  }

  const markSent = async (row: InviteRow, sent: boolean) => {
    setError('')
    const previous = row.sentAt
    setGuests((prev) => prev.map((g) => (g.key === row.key ? { ...g, sentAt: sent ? new Date().toISOString() : undefined } : g)))
    try {
      await setGuestSent(row.key, password, sent)
    } catch (err) {
      setGuests((prev) => prev.map((g) => (g.key === row.key ? { ...g, sentAt: previous } : g)))
      setError(errorText(err))
    }
  }

  const deliver = async (row: InviteRow) => {
    setPasteHint('')
    setError('')
    if (phoneDevice && typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: row.message })
        setSendingKey(row.key)
        await markSent(row, true)
        setNotice(`Đã chuyển lời mời của ${row.name} sang ứng dụng nhắn tin.`)
        setSendingKey(null)
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }
    const popup = window.open('https://chat.zalo.me/', '_blank', 'noopener,noreferrer')
    setSendingKey(row.key)
    try {
      await copyText(row.message)
      setPasteHint(row.key)
      setNotice(
        popup
          ? `Đã chép lời mời của ${row.name}. Dán vào cuộc trò chuyện Zalo, rồi bấm Đã gửi.`
          : `Đã chép lời mời của ${row.name}. Mở Zalo Web và dán vào cuộc trò chuyện, rồi bấm Đã gửi.`,
      )
    } finally {
      setSendingKey(null)
    }
  }

  const copy = async (id: string, text: string) => {
    await copyText(text)
    setCopied(id)
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800)
  }
  const copyIcon = (id: string) =>
    copied === id ? <Check className="w-4 h-4 text-green-600" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />

  const changeTemplate = (value: string) => {
    setEditedTemplate(value)
    try {
      localStorage.setItem(TEMPLATE_KEY, value)
    } catch {}
  }

  const exportCsv = () =>
    downloadCsv('khach-moi.csv', [
      ['Tên', 'Số điện thoại', 'Nhà', 'Link mời', 'Đã gửi', 'Đã mở', 'Số lần mở', 'Mở lần cuối', 'Xác nhận', 'Số người'],
      ...shown.map((r) => [
        r.name,
        r.phone ?? '',
        r.side === 'groom' ? 'Nhà trai' : r.side === 'bride' ? 'Nhà gái' : '',
        r.link,
        r.sentAt ? 'Có' : 'Chưa',
        r.opens ? 'Có' : 'Chưa',
        r.opens?.count ?? 0,
        r.opens ? dateFormatter.format(new Date(r.opens.last)) : '',
        r.rsvp ? (r.rsvp.attending ? 'Sẽ đến' : 'Không đến') : 'Chưa',
        r.rsvp?.attending ? r.rsvp.guests : '',
      ]),
    ])

  const openedCount = rows.filter((r) => r.opens).length
  const repliedCount = rows.filter((r) => r.rsvp).length
  const sentCount = rows.filter((r) => r.sentAt).length

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Khách mời" value={rows.length} />
        <StatCard label="Chưa gửi" value={unsentCount} hint={sentCount > 0 ? `${sentCount} đã gửi` : undefined} />
        <StatCard label="Đã mở thiệp" value={openedCount} hint={`${rows.length - openedCount} chưa mở`} />
        <StatCard label="Đã xác nhận" value={repliedCount} hint={`${rows.length - repliedCount} chưa trả lời`} />
      </div>

      <div
        className="card-wedding rounded-2xl p-5 sm:p-6 space-y-5 mb-6"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) void readGuestFile(file)
        }}
      >
        <div>
          <label htmlFor="guest-names" className="block text-sm font-medium text-w-text mb-1.5">
            Thêm khách: dán từ Excel, mỗi dòng một người, hoặc kéo file .csv / .txt vào đây
          </label>
          <textarea
            id="guest-names"
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            rows={4}
            placeholder={'Bạn Sáng\nChị Lan, 0912345678\nGia đình chú Hùng'}
            className="field-wedding resize-y"
          />
          <p className="mt-1.5 text-xs text-w-muted">
            Cột tên, số điện thoại và nhà (Nhà trai / Nhà gái) dán từ Excel được nhận cùng lúc. Dòng tiêu đề như “Họ tên”, “SĐT”, “Nhà” sẽ được bỏ qua. Khách chưa chọn nhà nhận thiệp hiện cả hai nhà.
          </p>
          {pending.length > 0 && (
            <p className="mt-2 text-sm text-w-text">
              Sẽ thêm {pending.length} khách{withPhone > 0 ? `, ${withPhone} có số điện thoại` : ''}: {previewNames(pending)}
              {imported.duplicates > 0 ? ` Đã gộp ${imported.duplicates} tên trùng.` : ''}
              {imported.truncated ? ' Chỉ lấy 500 khách đầu.' : ''}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Gán nhà cho các khách sắp thêm">
            {(
              [
                ['', 'Chưa chọn nhà'],
                ['groom', 'Nhà trai'],
                ['bride', 'Nhà gái'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id || 'none'}
                type="button"
                onClick={() => setBatchSide(id)}
                className={batchSide === id ? 'bg-w-btn text-white font-medium px-3 py-2 rounded-xl text-sm' : BTN}
                aria-pressed={batchSide === id}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={add}
              disabled={saving || pending.length === 0}
              className="inline-flex items-center gap-1.5 bg-w-btn hover:bg-w-btn-hover text-white font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" aria-hidden />
              {saving ? 'Đang lưu...' : pending.length ? `Thêm ${pending.length} khách` : 'Thêm khách'}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={BTN}>
              <FileUp className="w-4 h-4" aria-hidden />
              Chọn file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.csv,text/plain,text/csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void readGuestFile(file)
                e.target.value = ''
              }}
            />
          </div>
          {notice && <p className="mt-2 text-sm text-green-700">{notice}</p>}
        </div>
        <div>
          <label htmlFor="guest-template" className="block text-sm font-medium text-w-text mb-1.5">
            Lời nhắn kèm link (<code>{'{ten}'}</code> tên, <code>{'{link}'}</code> thiệp, <code>{'{nha}'}</code> nhà, <code>{'{diachi}'}</code> địa chỉ, <code>{'{gio}'}</code> giờ đến)
          </label>
          <textarea
            id="guest-template"
            value={template}
            onChange={(e) => changeTemplate(e.target.value)}
            rows={4}
            className="field-wedding resize-y"
          />
          {template !== DEFAULT_TEMPLATE && (
            <button type="button" onClick={() => changeTemplate(DEFAULT_TEMPLATE)} className="mt-2 text-sm text-w-muted underline">
              Dùng lại lời nhắn mặc định
            </button>
          )}
        </div>
      </div>

      {nextUnsent && (
        <div className="card-wedding rounded-2xl p-5 sm:p-6 mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-w-muted">Gửi lần lượt · còn {unsentCount}</p>
          <p className="mt-1 font-serif text-3xl text-w-strong break-words">{nextUnsent.name}</p>
          {nextUnsent.phone && <p className="text-sm text-w-muted">{nextUnsent.phone}</p>}
          <p className="mt-3 text-sm text-w-text whitespace-pre-line break-words">{nextUnsent.message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => deliver(nextUnsent)}
              disabled={sendingKey === nextUnsent.key}
              className="inline-flex items-center gap-1.5 bg-w-btn hover:bg-w-btn-hover text-white font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              <Send className="w-4 h-4" aria-hidden />
              {phoneDevice ? 'Gửi' : 'Chép và mở Zalo'}
            </button>
            {nextUnsent.phone && (
              <a href={smsHref(nextUnsent.phone, nextUnsent.message, phoneDevice ? navigator.userAgent : '')} className={BTN}>
                <MessageCircle className="w-4 h-4" aria-hidden />
                Nhắn SMS
              </a>
            )}
            <button type="button" onClick={() => markSent(nextUnsent, true)} className={BTN}>
              <Check className="w-4 h-4" aria-hidden />
              Đã gửi
            </button>
          </div>
          <p className="mt-3 text-xs text-w-muted">
            {phoneDevice
              ? 'Gửi mở Zalo, Messenger hoặc Tin nhắn của máy, kèm sẵn tên và link. Sau khi chọn ứng dụng, khách này được đánh dấu đã gửi.'
              : 'Máy tính chép lời mời và mở Zalo Web. Dán vào cuộc trò chuyện, gửi xong thì bấm Đã gửi để sang khách tiếp theo.'}
          </p>
          {pasteHint === nextUnsent.key && <p className="mt-2 text-sm text-green-700">Đã chép. Dán vào Zalo bằng Ctrl+V.</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <FilterChips<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'Tất cả' },
            { id: 'unsent', label: 'Chưa gửi' },
            { id: 'sent', label: 'Đã gửi' },
            { id: 'groom', label: 'Nhà trai' },
            { id: 'bride', label: 'Nhà gái' },
            { id: 'unassigned', label: 'Chưa chọn nhà' },
            { id: 'unopened', label: 'Chưa mở' },
            { id: 'opened', label: 'Đã mở' },
            { id: 'unreplied', label: 'Chưa xác nhận' },
            { id: 'replied', label: 'Đã xác nhận' },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} disabled={loading} className={BTN}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Tải lại
          </button>
          <button
            type="button"
            onClick={() => copy('all', shown.map((r) => r.message).join('\n\n'))}
            disabled={shown.length === 0}
            className={BTN}
          >
            {copyIcon('all')}
            {copied === 'all' ? 'Đã chép' : `Chép ${shown.length} lời mời`}
          </button>
          <button type="button" onClick={exportCsv} disabled={shown.length === 0} className={BTN}>
            <Download className="w-4 h-4" aria-hidden />
            Tải Excel
          </button>
        </div>
      </div>

      {error && (
        <p className="error-wedding mb-4" role="alert">
          {error}
        </p>
      )}
      {!loading && shown.length === 0 && !error && (
        <p className="card-wedding rounded-2xl p-8 text-center text-w-muted">
          {rows.length === 0 ? 'Chưa có khách mời nào. Dán tên hoặc chọn file ở ô phía trên.' : 'Không có khách nào ở mục này.'}
        </p>
      )}

      <ul className="space-y-3">
        {shown.map((r) => (
          <li key={r.key} className="card-wedding rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="font-semibold text-w-strong break-words">{r.name}</p>
              {r.side === 'groom' ? <Badge tone="gold">Nhà trai</Badge> : r.side === 'bride' ? <Badge tone="gold">Nhà gái</Badge> : <Badge tone="gray">Chưa chọn nhà</Badge>}
              {r.sentAt ? <Badge tone="gold">Đã gửi</Badge> : <Badge tone="gray">Chưa gửi</Badge>}
              {r.opens ? (
                <Badge tone="green">Đã mở{r.opens.count > 1 ? ` · ${r.opens.count} lần` : ''}</Badge>
              ) : (
                <Badge tone="gray">Chưa mở</Badge>
              )}
              {r.rsvp &&
                (r.rsvp.attending ? (
                  <Badge tone="gold">Sẽ đến · {r.rsvp.guests} người</Badge>
                ) : (
                  <Badge tone="red">Không đến</Badge>
                ))}
            </div>
            {r.phone && <p className="text-xs text-w-muted mb-1">{r.phone}</p>}
            {r.opens && (
              <p className="text-xs text-w-muted mb-1">
                Mở lần đầu {dateFormatter.format(new Date(r.opens.first))}
                {r.opens.count > 1 && ` · lần cuối ${dateFormatter.format(new Date(r.opens.last))}`}
              </p>
            )}
            <p className="text-xs text-w-muted break-all mb-3">{r.link}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => deliver(r)} disabled={sendingKey === r.key} className={BTN}>
                <Send className="w-4 h-4" aria-hidden />
                {phoneDevice ? 'Gửi' : 'Mở Zalo'}
              </button>
              {r.phone && (
                <a href={smsHref(r.phone, r.message, phoneDevice ? navigator.userAgent : '')} className={BTN}>
                  <MessageCircle className="w-4 h-4" aria-hidden />
                  SMS
                </a>
              )}
              <button type="button" onClick={() => copy(`msg-${r.key}`, r.message)} className={BTN}>
                {copyIcon(`msg-${r.key}`)}
                {copied === `msg-${r.key}` ? 'Đã chép' : 'Chép lời mời'}
              </button>
              <button type="button" onClick={() => copy(`link-${r.key}`, r.link)} className={BTN}>
                {copyIcon(`link-${r.key}`)}
                {copied === `link-${r.key}` ? 'Đã chép' : 'Chỉ chép link'}
              </button>
              <select
                value={r.side ?? ''}
                onChange={(e) => assignSide(r, e.target.value)}
                aria-label={`Nhà của ${r.name}`}
                className="field-wedding w-auto py-2 text-sm"
              >
                <option value="">Chưa chọn nhà</option>
                <option value="groom">Nhà trai</option>
                <option value="bride">Nhà gái</option>
              </select>
              <button type="button" onClick={() => markSent(r, !r.sentAt)} className={BTN}>
                <Check className="w-4 h-4" aria-hidden />
                {r.sentAt ? 'Bỏ đánh dấu' : 'Đã gửi'}
              </button>
              <a href={r.preview} target="_blank" rel="noopener noreferrer" className={BTN}>
                <ExternalLink className="w-4 h-4" aria-hidden />
                Mở thử
              </a>
              <button
                type="button"
                onClick={() => remove(r)}
                disabled={deletingKey === r.key}
                aria-label={`Xoá ${r.name}`}
                className={`ml-auto ${BTN_DANGER}`}
              >
                <Trash2 className="w-4 h-4" aria-hidden />
              </button>
            </div>
            {pasteHint === r.key && <p className="mt-2 text-sm text-green-700">Đã chép lời mời. Dán vào Zalo bằng Ctrl+V.</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function previewNames(guests: GuestDraft[]) {
  const shown = guests.slice(0, 4).map((g) => g.name)
  return guests.length > 4 ? `${shown.join(', ')}…` : shown.join(', ')
}
