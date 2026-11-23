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

/** Khoá so khớp một khách mời: "Chị  Lan" và "chị lan" là cùng một người */
export function guestKey(name: string) {
  return name.normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, MAX_GUEST_NAME_LENGTH).toLocaleLowerCase('vi')
}

/** Link "Mở thử" của người quản lý có thêm tham số này để không tính là khách đã mở */
export const PREVIEW_PARAM = 'xem-thu'

/** Giữ chữ và dấu tiếng Việt. Dấu cách thành +, chỉ mã hóa ký tự làm gãy query. */
function readableQueryValue(value: string) {
  return value.replace(/[&=#?%+]/g, (char) => encodeURIComponent(char)).replace(/ /g, '+')
}

export function guestLink(origin: string, name: string, preview = false, path = '/', side?: GuestSide | null) {
  const guest = name.normalize('NFC').replace(/\s+/g, ' ').trim()
  const parts = [`to=${readableQueryValue(guest)}`]
  if (side) parts.push(`nha=${sideParam(side)}`)
  if (preview) parts.push(`${PREVIEW_PARAM}=1`)
  return `${origin}${path}?${parts.join('&')}`
}
