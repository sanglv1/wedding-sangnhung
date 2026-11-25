const MAX_GUEST_NAME_LENGTH = 60

export type GuestSide = 'groom' | 'bride'

/** `nha=trai` hoặc `nha=gai` trên link mời */
export function readGuestSide(search: string): GuestSide | null {
  const raw = new URLSearchParams(search).get('nha')?.trim().toLocaleLowerCase('vi')
  if (raw === 'trai' || raw === 'nha-trai' || raw === 'groom') return 'groom'
  if (raw === 'gai' || raw === 'nha-gai' || raw === 'bride') return 'bride'
  return null
}

export function sideParam(side: GuestSide) {
  return side === 'groom' ? 'trai' : 'gai'
}

/** Tên khách mời từ link dạng ?to=Anh Minh - dùng để cá nhân hóa thiệp */
export function readGuestName(search: string): string | null {
  const raw = new URLSearchParams(search).get('to')
  if (!raw) return null
  const name = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_GUEST_NAME_LENGTH)
  return name || null
}

/** Khoá so khớp tên: "Chị  Lan" và "chị lan" là cùng một tên. */
export function guestKey(name: string) {
  return name.normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, MAX_GUEST_NAME_LENGTH).toLocaleLowerCase('vi')
}

/**
 * Khoá lưu một khách. Người đầu tiên giữ khoá theo tên để link cũ vẫn khớp.
 * Tên trùng nhận hậu tố :2, :3, ... để mỗi người một bản ghi.
 */
export function allocateGuestKey(name: string, taken: Set<string>) {
  const base = guestKey(name)
  if (!base) return ''
  if (!taken.has(base)) {
    taken.add(base)
    return base
  }
  let n = 2
  while (taken.has(`${base}:${n}`)) n += 1
  const key = `${base}:${n}`
  taken.add(key)
  return key
}

/** Chọn đúng khách khi có nhiều người trùng tên. Mã trên link được ưu tiên. */
export function matchGuest<T extends { key: string; name: string; side?: GuestSide | null }>(
  guests: readonly T[],
  name: string,
  id?: string | null,
  side?: GuestSide | null,
): T | null {
  const wanted = guestKey(name)
  if (!wanted) return null
  if (id) {
    const byId = guests.find((guest) => guest.key === id)
    if (byId) return byId
  }
  const matches = guests.filter((guest) => guestKey(guest.name) === wanted)
  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0]
  if (side) {
    const sided = matches.filter((guest) => guest.side === side)
    if (sided.length === 1) return sided[0]
    if (sided.length > 1) return sided.find((guest) => guest.key === wanted) ?? sided[0]
  }
  return matches.find((guest) => guest.key === wanted) ?? matches[0]
}

/** Mã khách trên link mời, để biết đúng người khi trùng tên */
export function readGuestId(search: string): string | null {
  const raw = new URLSearchParams(search).get('ma')?.trim()
  if (!raw) return null
  const id = raw.replace(/\s+/g, ' ').slice(0, 80)
  return id || null
}

/** Link "Mở thử" của người quản lý có thêm tham số này để không tính là khách đã mở */
export const PREVIEW_PARAM = 'xem-thu'

/** Giữ chữ và dấu tiếng Việt. Dấu cách thành +, chỉ mã hóa ký tự làm gãy query. */
function readableQueryValue(value: string) {
  return value.replace(/[&=#?%+]/g, (char) => encodeURIComponent(char)).replace(/ /g, '+')
}

export function guestLink(
  origin: string,
  name: string,
  preview = false,
  path = '/',
  side?: GuestSide | null,
  id?: string | null,
) {
  const guest = name.normalize('NFC').replace(/\s+/g, ' ').trim()
  const parts = [`to=${readableQueryValue(guest)}`]
  if (side) parts.push(`nha=${sideParam(side)}`)
  if (id) parts.push(`ma=${readableQueryValue(id)}`)
  if (preview) parts.push(`${PREVIEW_PARAM}=1`)
  return `${origin}${path}?${parts.join('&')}`
}
