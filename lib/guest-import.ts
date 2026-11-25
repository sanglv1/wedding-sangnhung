import { guestKey, type GuestSide } from './guest'

export type GuestDraft = { name: string; phone: string; side: GuestSide | '' }

const MAX_IMPORT = 500
const HEADER = new Set([
  'stt',
  'ten',
  'ten khach',
  'ho ten',
  'ho va ten',
  'name',
  'khach',
  'khach moi',
  'so dien thoai',
  'sdt',
  'phone',
  'dien thoai',
  'ghi chu',
  'note',
  'nha',
  'nha trai',
  'nha gai',
  'ben',
])

function fold(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function titleName(raw: string) {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      if (!word) return word
      const lower = word.toLocaleLowerCase('vi')
      const upper = word.toLocaleUpperCase('vi')
      const base = word === lower || word === upper ? lower : word
      return base.charAt(0).toLocaleUpperCase('vi') + base.slice(1)
    })
    .join(' ')
    .slice(0, 60)
}

function phoneDigits(value: string) {
  return value.replace(/[\s.\-()]/g, '')
}

export function looksLikePhone(value: string) {
  return /^(?:\+?84|0)\d{8,10}$/.test(phoneDigits(value))
}

/** Chuẩn về dạng 0xxxxxxxxx để nhắn SMS */
export function cleanGuestPhone(value: string) {
  const digits = phoneDigits(value)
  if (!looksLikePhone(value)) return ''
  if (digits.startsWith('+84')) return `0${digits.slice(3)}`
  if (digits.startsWith('84')) return `0${digits.slice(2)}`
  return digits
}

function isIndex(value: string) {
  return /^\d{1,4}$/.test(value.trim())
}

function sideOf(value: string): GuestSide | '' {
  const folded = fold(value)
  if (folded === 'nha trai' || folded === 'trai' || folded === 'chu re' || folded === 'groom') return 'groom'
  if (folded === 'nha gai' || folded === 'gai' || folded === 'co dau' || folded === 'bride') return 'bride'
  return ''
}

function isHeaderRow(cells: string[]) {
  const named = cells.map(fold).filter(Boolean)
  return named.length > 1 && named.every((cell) => HEADER.has(cell))
}

function unquote(cell: string) {
  const value = cell.trim()
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1).replace(/""/g, '"').trim()
  return value
}

function splitLine(line: string) {
  if (line.includes('\t')) return line.split('\t').map(unquote)
  if (line.includes(';')) return line.split(';').map(unquote)
  if (line.includes(',')) return line.split(',').map(unquote)
  return [unquote(line)]
}

function guestsFromCells(cells: string[]): GuestDraft[] {
  const cleaned = cells.map((cell) => cell.trim()).filter(Boolean)
  if (cleaned.length === 0 || isHeaderRow(cleaned)) return []
  const phoneCell = cleaned.find(looksLikePhone)
  const phone = phoneCell ? cleanGuestPhone(phoneCell) : ''
  const sideCell = cleaned.length > 1 ? cleaned.find((cell) => sideOf(cell)) : undefined
  const side = sideCell ? sideOf(sideCell) : ''
  const names = cleaned.filter((cell) => cell !== phoneCell && cell !== sideCell && !isIndex(cell))
  if (phone || side) {
    const name = titleName(names[0] ?? '')
    return name ? [{ name, phone, side }] : []
  }
  return names
    .map(titleName)
    .filter(Boolean)
    .map((name) => ({ name, phone: '', side: '' as const }))
}

/** Đọc danh sách dán từ Excel, file CSV hoặc từng tên cách nhau bằng dấu phẩy */
export function parseGuestImport(text: string): { guests: GuestDraft[]; duplicates: number; truncated: boolean } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  const found: GuestDraft[] = []
  for (const line of lines) {
    if (!line.trim()) continue
    found.push(...guestsFromCells(splitLine(line)))
  }

  const seen = new Set<string>()
  let duplicates = 0
  const guests: GuestDraft[] = []
  for (const guest of found) {
    const key = guestKey(guest.name)
    if (!key) continue
    if (seen.has(key)) duplicates += 1
    else seen.add(key)
    guests.push(guest)
  }

  return { guests: guests.slice(0, MAX_IMPORT), duplicates, truncated: guests.length > MAX_IMPORT }
}
