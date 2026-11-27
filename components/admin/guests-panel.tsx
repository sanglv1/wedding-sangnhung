'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Check, Copy, Download, ExternalLink, FileUp, MessageCircle, RefreshCw, Send, Trash2, UserPlus } from 'lucide-react'
import { FAMILY_ADDRESSES, WEDDING } from '@/lib/constants'
import { guestKey, guestLink, type GuestSide } from '@/lib/guest'
import { parseGuestImport, type GuestDraft } from '@/lib/guest-import'
import { addGuests, deleteGuest, fetchGuests, setGuestSent, setGuestSide, type GuestRecord } from '@/lib/guests'
import { fetchRsvps, type RsvpEntry } from '@/lib/rsvp'
import { foldVi, haystack, matchRank, matchesQuery, parseQuery, type SearchHaystack } from '@/lib/search-text'
import { isPhoneDevice, smsHref } from '@/lib/share-invite'
import { Highlight } from './search-box'
import { Badge, BTN, BTN_DANGER, copyText, dateFormatter, downloadCsv, errorText, FilterChips, StatCard } from './shared'

type Filter = 'all' | 'unsent' | 'sent' | 'unopened' | 'opened' | 'replied' | 'unreplied'
type HouseTab = 'groom' | 'bride' | 'none'

const HOUSE_PARAM: Record<HouseTab, string> = {
  groom: 'chu-re',
  bride: 'co-dau',
  none: 'chua-chon',
}

function readHouseTab(): HouseTab | null {
  const raw = new URLSearchParams(window.location.search).get('nha')
  if (raw === 'chu-re') return 'groom'
  if (raw === 'co-dau') return 'bride'
  if (raw === 'chua-chon') return 'none'
  return null
}

function inHouse(guest: { side?: GuestSide }, house: HouseTab) {
  if (house === 'groom') return guest.side === 'groom'
  if (house === 'bride') return guest.side === 'bride'
  return !guest.side
}

function audience(house: HouseTab) {
  if (house === 'bride') return 'khách cô dâu'
  if (house === 'none') return 'khách chưa chọn nhà'
  return 'khách chú rể'
}

function describePending(house: HouseTab, guests: { side?: GuestSide | '' }[]) {
  if (house !== 'none') return audience(house)
  const sides = new Set(guests.map((guest) => guest.side || ''))
  if (sides.size === 1) {
    const side = [...sides][0]
    if (side === 'groom') return 'khách chú rể'
    if (side === 'bride') return 'khách cô dâu'
    return audience('none')
  }
  return 'khách'
}

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

type InviteRow = GuestRecord & {
  link: string
  preview: string
  message: string
  rsvp?: RsvpEntry
  duplicate: boolean
  nameFold: string
  search: SearchHaystack
}

function passesFilter(row: InviteRow, filter: Filter) {
  if (filter === 'unsent') return !row.sentAt
  if (filter === 'sent') return Boolean(row.sentAt)
  if (filter === 'unopened') return !row.opens
  if (filter === 'opened') return Boolean(row.opens)
  if (filter === 'replied') return Boolean(row.rsvp)
  if (filter === 'unreplied') return !row.rsvp
  return true
}

function sideLabel(side: GuestSide | undefined) {
  if (side === 'groom') return 'chú rể nhà trai'
  if (side === 'bride') return 'cô dâu nhà gái'
  return 'chưa chọn nhà'
}

export function GuestsPanel({ password, query }: { password: string; query: string }) {
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
  const urlHouse = useSyncExternalStore(noopSubscribe, readHouseTab, () => null as HouseTab | null)
  const [pickedHouse, setPickedHouse] = useState<HouseTab | null>(null)
  const inferredHouse: HouseTab = guests.some((guest) => guest.side === 'groom')
    ? 'groom'
    : guests.some((guest) => guest.side === 'bride')
      ? 'bride'
      : guests.some((guest) => !guest.side)
        ? 'none'
        : 'groom'
  const house = pickedHouse ?? urlHouse ?? inferredHouse

  const selectHouse = (id: HouseTab) => {
    setPickedHouse(id)
    const params = new URLSearchParams(window.location.search)
    params.set('tab', params.get('tab') || 'khach-moi')
    params.set('nha', HOUSE_PARAM[id])
    window.history.replaceState(null, '', `?${params}`)
  }
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

  useEffect(() => {
    if (loading || pickedHouse || urlHouse) return
    setPickedHouse(inferredHouse)
  }, [loading, pickedHouse, urlHouse, inferredHouse])

  const rsvpByGuest = useMemo(() => {
    const map = new Map<string, RsvpEntry>()
    for (const r of rsvps) {
      const key = guestKey(r.invite || r.name)
      if (!map.has(key)) map.set(key, r)
    }
    return map
  }, [rsvps])

  const nameOwners = useMemo(() => {
    const map = new Map<string, number>()
    for (const guest of guests) {
      const key = guestKey(guest.name)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [guests])

  const houseGuests = useMemo(() => guests.filter((guest) => inHouse(guest, house)), [guests, house])

  const duplicateNames = useMemo(() => {
    const map = new Map<string, number>()
    for (const guest of guests) {
      const key = `${guest.side ?? ''}:${guestKey(guest.name)}`
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [guests])

  const allRows = useMemo(
    () =>
      guests.map((g) => {
        const link = guestLink(origin, g.name, false, '/', g.side, g.key)
        const place = houseBits(g.side)
        const nameKey = guestKey(g.name)
        const rsvp = (nameOwners.get(nameKey) ?? 0) === 1 ? rsvpByGuest.get(nameKey) : undefined
        return {
          ...g,
          link,
          preview: guestLink(origin, g.name, true, '/', g.side, g.key),
          message: template
            .replaceAll('{ten}', g.name)
            .replaceAll('{link}', link)
            .replaceAll('{nha}', place.nha)
            .replaceAll('{diachi}', place.diachi)
            .replaceAll('{gio}', place.gio),
          rsvp,
          duplicate: (duplicateNames.get(`${g.side ?? ''}:${nameKey}`) ?? 0) > 1,
          nameFold: foldVi(g.name),
          search: haystack([g.name, sideLabel(g.side), rsvp?.name, rsvp?.note].filter(Boolean).join(' '), [g.phone, rsvp?.phone]),
        }
      }),
    [guests, origin, template, rsvpByGuest, nameOwners, duplicateNames],
  )

  const rows = useMemo(() => allRows.filter((guest) => inHouse(guest, house)), [allRows, house])
  const parsed = useMemo(() => parseQuery(query), [query])
  const shown = useMemo(() => {
    const pool = parsed ? allRows : rows
    const hits = pool.filter((row) => matchesQuery(parsed, row.search) && passesFilter(row, filter))
    if (!parsed) return hits
    return hits
      .map((row, index) => ({ row, index, rank: matchRank(row.nameFold, row.search.phones[0] ?? '', parsed) }))
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map((item) => item.row)
  }, [parsed, allRows, rows, filter])
  const hiddenByFilter = useMemo(() => {
    if (!parsed) return 0
    return allRows.filter((row) => matchesQuery(parsed, row.search) && !passesFilter(row, filter)).length
  }, [parsed, allRows, filter])

  const imported = useMemo(() => parseGuestImport(namesText), [namesText])
  const pending = useMemo(
    () =>
      imported.guests.map((guest) => ({
        ...guest,
        side: house === 'none' ? guest.side || batchSide : house,
      })),
    [imported.guests, batchSide, house],
  )
  const alreadyListed = useMemo(() => {
    const names = new Set(houseGuests.map((guest) => guestKey(guest.name)))
    return pending.filter((guest) => names.has(guestKey(guest.name))).length
  }, [houseGuests, pending])
  const nextUnsent = rows.find((r) => !r.sentAt)
  const unsentCount = rows.filter((r) => !r.sentAt).length
  const withPhone = pending.filter((g) => g.phone).length

  const add = async () => {
    if (pending.length === 0) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const { added } = await addGuests(pending, password)
      const label = describePending(house, pending)
      setNotice(
        imported.duplicates > 0
          ? `Đã thêm ${added} ${label}, trong đó có tên trùng nhau.`
          : `Đã thêm ${added} ${label}.`,
      )
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
      const nextHouse: HouseTab = side === 'bride' ? 'bride' : side === 'groom' ? 'groom' : 'none'
      if (nextHouse !== house) {
        const where = nextHouse === 'bride' ? 'khách cô dâu' : nextHouse === 'groom' ? 'khách chú rể' : 'mục chưa chọn nhà'
        setNotice(`Đã chuyển ${row.name} sang ${where}.`)
      }
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
    downloadCsv(house === 'bride' ? 'khach-co-dau.csv' : house === 'none' ? 'khach-chua-chon.csv' : 'khach-chu-re.csv', [
      ['Tên', 'Số điện thoại', 'Phía', 'Link mời', 'Đã gửi', 'Đã mở', 'Số lần mở', 'Mở lần cuối', 'Xác nhận', 'Số người'],
      ...shown.map((r) => [
        r.name,
        r.phone ?? '',
        r.side === 'groom' ? 'Chú rể' : r.side === 'bride' ? 'Cô dâu' : '',
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
  const groomCount = guests.filter((g) => g.side === 'groom').length
  const brideCount = guests.filter((g) => g.side === 'bride').length
  const unassignedCount = guests.filter((g) => !g.side).length
  const houseTabs: { id: HouseTab; label: string; count: number }[] = [
    { id: 'groom', label: 'Khách chú rể', count: groomCount },
    { id: 'bride', label: 'Khách cô dâu', count: brideCount },
  ]
  if (unassignedCount > 0 || house === 'none') houseTabs.push({ id: 'none', label: 'Chưa chọn nhà', count: unassignedCount })

  return (
    <div>
      <div role="tablist" aria-label="Danh sách khách theo phía" className="flex gap-1 mb-5 border-b border-w-gold/30 overflow-x-auto">
        {houseTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={house === tab.id}
            onClick={() => selectHouse(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              house === tab.id ? 'border-w-btn text-w-strong' : 'border-transparent text-w-muted hover:text-w-text'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 tabular-nums">{tab.count}</span>
          </button>
        ))}
      </div>
      {!parsed && (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label={house === 'bride' ? 'Khách cô dâu' : house === 'none' ? 'Chưa chọn nhà' : 'Khách chú rể'} value={rows.length} />
        <StatCard label="Chưa gửi" value={unsentCount} hint={sentCount > 0 ? `${sentCount} đã gửi` : undefined} />
        <StatCard label="Đã mở thiệp" value={openedCount} hint={`${rows.length - openedCount} chưa mở`} />
        <StatCard label="Đã xác nhận" value={repliedCount} hint={`${rows.length - repliedCount} chưa trả lời`} />
      </div>
      )}

      {!parsed && (
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
            Thêm {audience(house)}: dán từ Excel, mỗi dòng một người, hoặc kéo file .csv / .txt vào đây
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
            {house === 'none'
              ? 'Cột tên, số điện thoại và nhà (Chú rể / Cô dâu, hoặc Nhà trai / Nhà gái) dán từ Excel được nhận cùng lúc. Dòng tiêu đề sẽ được bỏ qua. Tên trùng vẫn được thêm thành từng khách. Khách chưa chọn nhà nhận thiệp hiện cả hai nhà.'
              : `Mỗi dòng là một ${audience(house)}, kể cả khi trùng tên. Cột số điện thoại dán từ Excel được nhận cùng lúc. Dòng tiêu đề như “Họ tên”, “SĐT” sẽ được bỏ qua.`}
          </p>
          {pending.length > 0 && (
            <p className="mt-2 text-sm text-w-text">
              Sẽ thêm {pending.length} {describePending(house, pending)}
              {withPhone > 0 ? `, ${withPhone} có số điện thoại` : ''}: {previewNames(pending)}
              {imported.duplicates > 0 ? ` Có ${imported.duplicates} tên trùng, mỗi người vẫn được thêm riêng.` : ''}
              {alreadyListed > 0 ? ` ${alreadyListed} tên đã có trong tab này; bấm thêm vẫn tạo thêm người, không gộp.` : ''}
              {imported.truncated ? ' Chỉ lấy 500 khách đầu.' : ''}
            </p>
          )}
          {house === 'none' && (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Gán nhà cho các khách sắp thêm">
            {(
              [
                ['', 'Chưa chọn nhà'],
                ['groom', 'Chú rể'],
                ['bride', 'Cô dâu'],
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
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={add}
              disabled={saving || pending.length === 0}
              className="inline-flex items-center gap-1.5 bg-w-btn hover:bg-w-btn-hover text-white font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" aria-hidden />
              {saving ? 'Đang lưu...' : pending.length ? `Thêm ${pending.length} ${describePending(house, pending)}` : `Thêm ${audience(house)}`}
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
      )}

      {!parsed && nextUnsent && (
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

      {parsed && !loading && (
        <p className="mb-3 text-sm text-w-muted" aria-live="polite">
          {shown.length} khách khớp “{parsed.raw}”
          {shown.some((row) => !inHouse(row, house)) ? ' · gồm khách ở nhà khác' : ''}
          {hiddenByFilter > 0 && (
            <>
              {' '}
              · {hiddenByFilter} khách đang bị bộ lọc ẩn{' '}
              <button type="button" onClick={() => setFilter('all')} className="underline underline-offset-2">
                Hiện mọi trạng thái
              </button>
            </>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <FilterChips<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'Tất cả' },
            { id: 'unsent', label: 'Chưa gửi' },
            { id: 'sent', label: 'Đã gửi' },
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
          {parsed
            ? hiddenByFilter > 0
              ? `Có ${hiddenByFilter} khách khớp “${parsed.raw}” nhưng đang bị bộ lọc trạng thái ẩn.`
              : `Không thấy khách khớp “${parsed.raw}”.`
            : rows.length === 0
              ? `Chưa có ${audience(house)}. Dán tên hoặc chọn file ở ô phía trên.`
              : 'Không có khách nào ở mục này.'}
        </p>
      )}

      <ul className="space-y-3">
        {shown.map((r) => (
          <li key={r.key} className="card-wedding rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="font-semibold text-w-strong break-words">
                <Highlight text={r.name} query={query} />
              </p>
              {parsed && (
                <Badge tone="gold">{r.side === 'bride' ? 'Cô dâu' : r.side === 'groom' ? 'Chú rể' : 'Chưa chọn nhà'}</Badge>
              )}
              {r.duplicate && <Badge tone="gray">Trùng tên</Badge>}
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
            {r.phone && (
              <p className="text-xs text-w-muted mb-1">
                <Highlight text={r.phone} query={query} />
              </p>
            )}
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
                aria-label={`Phía của ${r.name}`}
                className="field-wedding w-auto py-2 text-sm"
              >
                <option value="">Chưa chọn nhà</option>
                <option value="groom">Chú rể</option>
                <option value="bride">Cô dâu</option>
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
