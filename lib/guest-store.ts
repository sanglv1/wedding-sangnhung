import { allocateGuestKey, matchGuest, type GuestSide } from './guest'
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

function takenKeys(raw: unknown) {
  const taken = new Set<string>()
  if (!Array.isArray(raw)) return taken
  for (const key of raw) if (typeof key === 'string' && key) taken.add(key)
  return taken
}

/** Thêm từng khách một bản ghi. Cùng tên vẫn tạo thêm người, không gộp. */
export async function addGuests(names: unknown[]) {
  const now = Date.now()
  const drafts = names
    .map(readDraft)
    .filter((d): d is { name: string; phone: string; side: GuestSide | '' } => d !== null)
    .slice(0, MAX_BATCH)
  if (drafts.length === 0) return { added: 0, filled: 0 }

  const [existing] = await pipeline([['HKEYS', LIST_KEY]])
  const taken = takenKeys(existing)
  const records = drafts.flatMap((draft, i) => {
    const key = allocateGuestKey(draft.name, taken)
    if (!key) return []
    const record: GuestRecord = {
      key,
      name: draft.name,
      createdAt: new Date(now + i).toISOString(),
      ...(draft.phone ? { phone: draft.phone } : {}),
      ...(draft.side ? { side: draft.side } : {}),
    }
    return [record]
  })
  if (records.length === 0) return { added: 0, filled: 0 }
  await pipeline(records.map((record) => ['HSET', LIST_KEY, record.key, JSON.stringify(record)]))
  return { added: records.length, filled: 0 }
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

function recordsFromHash(list: unknown): GuestRecord[] {
  return hashValues(list)
    .map((raw) => parseJson<GuestRecord>(raw))
    .filter((guest): guest is GuestRecord => guest !== null && typeof guest.key === 'string')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** Ghi nhận khách mở thiệp. Có mã trên link thì tính đúng người khi trùng tên. */
export async function recordOpen(name: string, id?: string | null, side?: GuestSide | null) {
  const [list] = await pipeline([['HGETALL', LIST_KEY]])
  const target = matchGuest(recordsFromHash(list), name, id, side)
  if (!target) return false
  const [raw] = await pipeline([['HGET', OPENS_KEY, target.key]])
  const now = new Date().toISOString()
  const prev = typeof raw === 'string' ? parseJson<GuestOpens>(raw) : null
  const opens: GuestOpens = { first: prev?.first ?? now, last: now, count: (prev?.count ?? 0) + 1 }
  await pipeline([['HSET', OPENS_KEY, target.key, JSON.stringify(opens)]])
  return true
}
