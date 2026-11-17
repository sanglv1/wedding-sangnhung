/** Số ngày sau lễ thiệp còn nhận xác nhận và lời chúc */
export const KEEP_DAYS = 45

export function isArchived(endIso: string, now = Date.now()) {
  const end = Date.parse(endIso)
  if (!endIso || Number.isNaN(end)) return false
  return now > end + KEEP_DAYS * 24 * 60 * 60 * 1000
}
