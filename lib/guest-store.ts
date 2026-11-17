import { guestKey, type GuestSide } from './guest'
import type { GuestOpens, GuestRecord } from './guests'
import { allowAttempt, hashValues, pipeline } from './redis'

const LIST_KEY = 'guests:list'
const OPENS_KEY = 'guests:opens'
const MAX_NAME = 60
const MAX_BATCH = 500
const OPEN_LIMIT = { max: 30, windowSeconds: 600 }

export const allowOpen = (ip: string) => allowAttempt(`guests:open-rate:${ip}`, OPEN_LIMIT)

function parseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function listGuests(): Promise<GuestRecord[]> {
  const [list, opens] = await pipeline([
    ['HGETALL', LIST_KEY],
    ['HGETALL', OPENS_KEY],
  ])
  const openMap = new Map<string, GuestOpens>()
  if (Array.isArray(opens)) {
    for (let i = 0; i + 1 < opens.length; i += 2) {
      const value = parseJson<GuestOpens>(String(opens[i + 1]))
      if (value) openMap.set(String(opens[i]), value)
    }
  }
  return hashValues(list)
    .map((raw) => parseJson<GuestRecord>(raw))
    .filter((g): g is GuestRecord => g !== null && typeof g.key === 'string')
    .map((g) => ({ ...g, opens: openMap.get(g.key) }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

function readSide(value: unknown): GuestSide | '' {
  return value === 'groom' || value === 'bride' ? value : ''
}

function readDraft(raw: unknown): { name: string; phone: string; side: GuestSide | '' } | null {
  const source = typeof raw === 'string' ? { name: raw, phone: '' } : raw
  if (!source || typeof source !== 'object') return null
  const row = source as { name?: unknown; phone?: unknown; side?: unknown }
  const name = String(row.name ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME)
  if (!name) return null
  const phone = String(row.phone ?? '').replace(/[^\d+]/g, '').slice(0, 16)
  return { name, phone, side: readSide(row.side) }
}

/** Thêm khách. Tên đã có thì giữ nguyên; số hoặc nhà còn trống thì bổ sung, không ghi đè. */
export async function addGuests(names: unknown[]) {
  const now = Date.now()
  const seen = new Set<string>()
  const drafts = names
    .map(readDraft)
    .filter((d): d is { name: string; phone: string; side: GuestSide | '' } => d !== null)
    .filter((d) => {
      const key = guestKey(d.name)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, MAX_BATCH)
  if (drafts.length === 0) return { added: 0, filled: 0 }

  const records = drafts.map((draft, i) => {
    const record: GuestRecord = {
      key: guestKey(draft.name),
      name: draft.name,
      createdAt: new Date(now + i).toISOString(),
      ...(draft.phone ? { phone: draft.phone } : {}),
      ...(draft.side ? { side: draft.side } : {}),
    }
    return record
  })
  const created = await pipeline(records.map((record) => ['HSETNX', LIST_KEY, record.key, JSON.stringify(record)]))
  const added = created.filter((result) => Number(result) === 1).length

  const enrich = records.filter((record, i) => Number(created[i]) !== 1 && (record.phone || record.side))
  if (enrich.length === 0) return { added, filled: 0 }

  const existing = await pipeline(enrich.map((record) => ['HGET', LIST_KEY, record.key]))
  const updates = existing.flatMap((raw, i) => {
    if (typeof raw !== 'string') return []
    const saved = parseJson<GuestRecord>(raw)
    const incoming = enrich[i]
    if (!saved || saved.key !== incoming.key) return []
    const next = { ...saved }
    if (!saved.phone && incoming.phone) next.phone = incoming.phone
    if (!saved.side && incoming.side) next.side = incoming.side
    if (next.phone === saved.phone && next.side === saved.side) return []
    return [['HSET', LIST_KEY, saved.key, JSON.stringify(next)]]
  })
  if (updates.length > 0) await pipeline(updates)
  return { added, filled: updates.length }
}

async function patchGuest(key: string, patch: (guest: GuestRecord) => GuestRecord) {
  const [raw] = await pipeline([['HGET', LIST_KEY, key]])
  if (typeof raw !== 'string') return false
  const saved = parseJson<GuestRecord>(raw)
  if (!saved || saved.key !== key) return false
  await pipeline([['HSET', LIST_KEY, key, JSON.stringify(patch(saved))]])
  return true
}

export function markGuestSent(key: string) {
  const sentAt = new Date().toISOString()
  return patchGuest(key, (guest) => ({ ...guest, sentAt }))
}

export function setGuestSide(key: string, side: GuestSide | null) {
  return patchGuest(key, (guest) => {
    const next = { ...guest }
    if (side) next.side = side
    else delete next.side
    return next
  })
}

export function clearGuestSent(key: string) {
  return patchGuest(key, (guest) => {
    const next = { ...guest }
    delete next.sentAt
    return next
  })
}

export async function deleteGuest(key: string) {
  const [removed] = await pipeline([
    ['HDEL', LIST_KEY, key],
    ['HDEL', OPENS_KEY, key],
  ])
  return Number(removed) > 0
}

/** Ghi nhận khách mở thiệp - chỉ với tên có trong danh sách khách mời */
export async function recordOpen(name: string) {
  const key = guestKey(name)
  const [exists, raw] = await pipeline([
    ['HEXISTS', LIST_KEY, key],
    ['HGET', OPENS_KEY, key],
  ])
  if (Number(exists) !== 1) return false
  const now = new Date().toISOString()
  const prev = typeof raw === 'string' ? parseJson<GuestOpens>(raw) : null
  const opens: GuestOpens = { first: prev?.first ?? now, last: now, count: (prev?.count ?? 0) + 1 }
  await pipeline([['HSET', OPENS_KEY, key, JSON.stringify(opens)]])
  return true
}
