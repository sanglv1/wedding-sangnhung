import type { GuestSide } from '@/lib/guest'
import type { WeddingModel } from '@/lib/wedding-model'

export type HouseFocus = {
  side: GuestSide
  label: string
  place: string
  mapsUrl: string
  mapEmbed: string
  /** Giờ khách nhà này cần đến. Trống giờ riêng thì lấy giờ lễ chung. */
  time: string
  /** Một dòng về nhà còn lại, không phải một thiệp thứ hai. */
  otherLine: string
}

function embedFor(place: string) {
  if (!place) return ''
  return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&z=15&hl=vi&output=embed`
}

/** Mặt thực dụng của thiệp khi link đã gắn nhà. Link không gắn nhà thì trả null và thiệp hiện cả hai nhà. */
export function houseFocus(model: WeddingModel, side: GuestSide | null): HouseFocus | null {
  if (!side) return null
  const homes = model.familyAddresses
  const host = side === 'groom' ? homes.groomFamily : homes.brideFamily
  const other = side === 'groom' ? homes.brideFamily : homes.groomFamily
  const sharedTime = model.wedding.ceremony.time
  const time = host.time || sharedTime
  const place = host.address || model.wedding.ceremony.venue || model.wedding.ceremony.location
  const otherTime = other.time || sharedTime
  const otherPlace = other.address
  const otherLine = otherPlace
    ? otherTime && time && otherTime !== time
      ? `${other.label} lúc ${otherTime}, ${otherPlace}`
      : `${other.label}: ${otherPlace}`
    : ''
  return {
    side,
    label: host.label,
    place,
    mapsUrl: host.mapsUrl,
    mapEmbed: embedFor(place) || model.mapEmbed,
    time,
    otherLine,
  }
}

/** "Tại gia" là chỗ chưa nói rõ nhà nào. Khi đã biết nhà khách, thay bằng địa chỉ nhà đó. */
export function venueForGuest(stored: string, focus: HouseFocus | null) {
  if (!focus?.place) return stored
  const plain = stored.trim().toLocaleLowerCase('vi')
  if (!plain || plain === 'tại gia') return focus.place
  return stored
}
