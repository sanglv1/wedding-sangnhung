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

/** Tên khách mời từ link dạng ?to=Anh%20Minh - dùng để cá nhân hóa thiệp */
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

export function guestLink(origin: string, name: string, preview = false, path = '/', side?: GuestSide | null) {
  const params = new URLSearchParams({ to: name })
  if (side) params.set('nha', sideParam(side))
  if (preview) params.set(PREVIEW_PARAM, '1')
  return `${origin}${path}?${params}`
}
