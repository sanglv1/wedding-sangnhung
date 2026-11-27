/** Tìm gần đúng: không phân biệt hoa thường, dấu tiếng Việt, và khớp số điện thoại dù viết 0 hay 84. */

const MARKS = /[\u0300-\u036f]/g

const VI: Record<string, string> = {
  a: 'aàáảãạăằắẳẵặâầấẩẫậ',
  e: 'eèéẻẽẹêềếểễệ',
  i: 'iìíỉĩị',
  o: 'oòóỏõọôồốổỗộơờớởỡợ',
  u: 'uùúủũụưừứửữự',
  y: 'yỳýỷỹỵ',
  d: 'dđ',
}

export function foldVi(value: string) {
  return value.normalize('NFD').replace(MARKS, '').replace(/đ/gi, 'd').toLowerCase()
}

function digits(value: string) {
  return value.replace(/\D/g, '')
}

export type SearchHaystack = {
  /** Chuỗi đã fold, dùng để so khớp */
  text: string
  /** Số điện thoại chỉ còn chữ số */
  phones: string[]
}

export function haystack(text: string, phones: Array<string | undefined | null>): SearchHaystack {
  return {
    text: foldVi(text),
    phones: phones.map((phone) => digits(phone ?? '')).filter((phone) => phone.length > 0),
  }
}

export type ParsedQuery = {
  raw: string
  tokens: { folded: string; digits: string }[]
}

export function parseQuery(query: string): ParsedQuery | null {
  const raw = query.trim()
  if (!raw) return null
  const tokens = raw.split(/\s+/).map((token) => ({ folded: foldVi(token), digits: digits(token) }))
  return { raw, tokens }
}

function phoneNeedles(tokenDigits: string) {
  const needles = new Set<string>([tokenDigits])
  if (tokenDigits.startsWith('84') && tokenDigits.length > 2) needles.add(`0${tokenDigits.slice(2)}`)
  if (tokenDigits.startsWith('0') && tokenDigits.length > 1) needles.add(tokenDigits.slice(1))
  return [...needles]
}

function phoneMatches(tokenDigits: string, phones: string[]) {
  if (tokenDigits.length < 2) return false
  const needles = phoneNeedles(tokenDigits)
  return phones.some((phone) => {
    const forms = [phone]
    if (phone.startsWith('0') && phone.length > 1) forms.push(phone.slice(1))
    if (phone.startsWith('84') && phone.length > 2) forms.push(`0${phone.slice(2)}`)
    return forms.some((form) => needles.some((needle) => form.includes(needle)))
  })
}

function tokenMatches(token: { folded: string; digits: string }, fields: SearchHaystack) {
  const digitsOnly = token.digits.length > 0 && token.folded === token.digits
  if (!digitsOnly) return token.folded.length > 0 && fields.text.includes(token.folded)
  // Ít hơn 3 số thì chưa lọc theo điện thoại, kẻo "09" khớp gần như mọi máy.
  if (token.digits.length < 3) return fields.text.includes(token.folded)
  return phoneMatches(token.digits, fields.phones) || fields.text.includes(token.folded)
}

/** Mỗi từ trong ô tìm phải gặp trong chữ hoặc trong số điện thoại. Thứ tự từ không quan trọng. */
export function matchesQuery(parsed: ParsedQuery | null, fields: SearchHaystack) {
  if (!parsed) return true
  return parsed.tokens.every((token) => tokenMatches(token, fields))
}

/** 0 = khớp đầu tên hoặc đầu số, 1 = khớp đầu một từ, 2 = khớp ở giữa. */
export function matchRank(nameFold: string, phoneDigits: string, parsed: ParsedQuery | null) {
  if (!parsed) return 1
  const phrase = parsed.tokens.map((token) => token.folded).join(' ')
  if (phrase && nameFold.startsWith(phrase)) return 0
  const first = parsed.tokens[0]
  if (!first) return 2
  if (first.digits.length >= 3 && phoneDigits.startsWith(first.digits)) return 0
  if (first.folded && nameFold.split(' ').some((word) => word.startsWith(first.folded))) return 1
  return 2
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function letterClass(ch: string) {
  const chars = VI[ch.toLowerCase()]
  if (chars) {
    const upper = [...chars].map((letter) => letter.toLocaleUpperCase('vi')).join('')
    return `[${chars}${upper}]`
  }
  const lower = ch.toLowerCase()
  const upper = ch.toUpperCase()
  if (lower !== upper) return `[${escapeRegExp(lower)}${escapeRegExp(upper)}]`
  return escapeRegExp(ch)
}

const patternCache = new Map<string, RegExp | null>()

export function highlightPattern(query: string) {
  const key = query.trim()
  const cached = patternCache.get(key)
  if (cached !== undefined) return cached
  const tokens = key.split(/\s+/).filter(Boolean)
  const bodies = tokens
    .map((token) => [...foldVi(token)].map(letterClass).join(''))
    .filter(Boolean)
  const pattern = bodies.length ? new RegExp(`(${bodies.join('|')})`, 'g') : null
  if (patternCache.size > 40) patternCache.clear()
  patternCache.set(key, pattern)
  return pattern
}
