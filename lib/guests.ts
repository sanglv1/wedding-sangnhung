/**
 * Danh sách khách mời + theo dõi ai đã mở thiệp - lưu trên Upstash Redis
 * Phần lưu trữ phía server: lib/guest-store.ts
 */
import { adminHeaders, readJson } from './fetch-json'
import type { GuestSide } from './guest'

export interface GuestOpens {
  first: string
  last: string
  count: number
}

export interface GuestRecord {
  key: string
  name: string
  createdAt: string
  phone?: string
  /** Nhà khách được mời. Trống thì link không gắn nhà và thiệp hiện cả hai nhà. */
  side?: GuestSide
  /** Lúc người quản lý đánh dấu đã gửi lời mời */
  sentAt?: string
  opens?: GuestOpens
}

export async function fetchGuests(password: string): Promise<GuestRecord[]> {
  const res = await fetch('/api/guests', { headers: adminHeaders(password), cache: 'no-store' })
  const data = await readJson<{ guests?: GuestRecord[] }>(res)
  return Array.isArray(data.guests) ? data.guests : []
}

export async function addGuests(names: { name: string; phone?: string; side?: GuestSide | '' }[], password: string) {
  const res = await fetch('/api/guests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(password) },
    body: JSON.stringify({ names }),
  })
  return readJson<{ added: number; filled: number }>(res)
}

export async function setGuestSide(key: string, password: string, side: GuestSide | null) {
  const res = await fetch(`/api/guests/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(password) },
    body: JSON.stringify({ side }),
  })
  await readJson(res)
}

export async function setGuestSent(key: string, password: string, sent: boolean) {
  const res = await fetch(`/api/guests/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(password) },
    body: JSON.stringify({ sent }),
  })
  await readJson(res)
}

export async function deleteGuest(key: string, password: string) {
  const res = await fetch(`/api/guests/${encodeURIComponent(key)}`, { method: 'DELETE', headers: adminHeaders(password) })
  await readJson(res)
}

export function recordGuestOpen(
  name: string,
  endpoint = '/api/guest-open',
  extra?: { id?: string | null; side?: GuestSide | null },
) {
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      ...(extra?.id ? { id: extra.id } : {}),
      ...(extra?.side ? { side: extra.side } : {}),
    }),
    keepalive: true,
  })
}
