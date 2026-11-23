'use client'

import { MapPin } from 'lucide-react'
import { PeachBlossom } from '@/components/invitation-ornaments'
import { Reveal } from '@/components/reveal'
import { SectionFrame } from '@/components/section-frame'
import { SectionHeading } from '@/components/section-heading'
import { CLASSIC_MODEL } from '@/lib/constants'
import type { WeddingModel } from '@/lib/wedding-model'

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const DAY_NAMES = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY']

function partyDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

function monthCells(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const blanks = (first + 6) % 7
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: Array<number | null> = Array.from({ length: blanks }, () => null)
  for (let day = 1; day <= total; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function parseMeal(time: string) {
  const match = /(\d{1,2})\s*h(?:\s*(\d{2}))?[^\d]*(\d{1,2})\/(\d{1,2})\/(\d{4})/i.exec(time)
  if (!match) return null
  const hour = Number(match[1])
  const minute = match[2] ?? '00'
  const day = Number(match[3])
  const month = Number(match[4])
  const year = Number(match[5])
  const start = new Date(
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${minute}:00+07:00`,
  )
  if (Number.isNaN(start.getTime())) return null
  return {
    year,
    month,
    day,
    clock: `${String(hour).padStart(2, '0')}:${minute}`,
    weekday: DAY_NAMES[start.getUTCDay()],
    start,
  }
}

/** Ngày âm của bữa cơm, lùi từ ngày hôn lễ khi bữa cơm đúng hôm trước. */
function mealLunar(ceremonyLunar: string, ceremonyISO: string, mealStart: Date) {
  const ceremony = partyDate(ceremonyISO)
  const match = /ngày\s+(\d+)\s+tháng\s+(\d+)\s+năm\s+(.+)/i.exec(ceremonyLunar)
  if (!ceremony || !match) return ''
  const ceremonyUtc = Date.UTC(ceremony.year, ceremony.month - 1, ceremony.day)
  const mealUtc = Date.UTC(mealStart.getUTCFullYear(), mealStart.getUTCMonth(), mealStart.getUTCDate())
  const lunarDay = Number(match[1]) - Math.round((ceremonyUtc - mealUtc) / 86_400_000)
  if (lunarDay < 1) return ''
  return `Tức ngày ${lunarDay} tháng ${match[2]} năm ${match[3].trim()}`
}

function calendarStamp(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function mealCalendar(model: WeddingModel) {
  const meal = model.wedding.intimateMeal
  const parsed = parseMeal(meal.time)
  if (!parsed) return ''
  const end = new Date(parsed.start.getTime() + 3 * 60 * 60 * 1000)
  const dates = `${calendarStamp(parsed.start.toISOString())}/${calendarStamp(end.toISOString())}`
  if (!dates.includes('/')) return ''
  const places = [model.familyAddresses.groomFamily, model.familyAddresses.brideFamily]
    .filter((house) => house.address)
    .map((house) => `${house.label}: ${house.address}`)
    .join('\n')
  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', `${meal.name} - ${model.wedding.groomShort} & ${model.wedding.brideShort}`)
  url.searchParams.set('dates', dates)
  url.searchParams.set('ctz', 'Asia/Ho_Chi_Minh')
  url.searchParams.set('details', [meal.time, places].filter(Boolean).join('\n'))
  return url.toString()
}

function addressLines(address: string) {
  return address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function HeartDay({ day }: { day: number }) {
  return (
    <span className="relative inline-flex h-7 w-7 items-center justify-center">
      <svg viewBox="0 0 24 22" className="absolute inset-0 h-full w-full text-w-line-strong" aria-hidden>
        <path
          fill="currentColor"
          d="M12 20.5s-6.4-4.1-8.9-7.8C1.2 10.2 1.6 6.8 4.2 5.4 6.3 4.3 8.3 5 12 8.1 15.7 5 17.7 4.3 19.8 5.4c2.6 1.4 3 4.8 1.1 7.3-2.5 3.7-8.9 7.8-8.9 7.8z"
        />
      </svg>
      <span className="relative text-[0.68rem] font-semibold text-w-bg">{day}</span>
    </span>
  )
}

export function ScheduleSection({ model = CLASSIC_MODEL }: { model?: WeddingModel }) {
  const wedding = model.wedding
  const meal = parseMeal(wedding.intimateMeal.time)
  const houses = [model.familyAddresses.groomFamily, model.familyAddresses.brideFamily].filter(
    (house) => house.address || house.mapsUrl,
  )
  if (!meal && houses.length === 0) return null

  const lunar = meal ? mealLunar(wedding.ceremony.lunarDate, wedding.startISO, meal.start) : ''
  const calendar = meal ? mealCalendar(model) : ''
  const cells = meal ? monthCells(meal.year, meal.month) : []

  return (
    <section id="lich-trinh" className="scroll-mt-16 py-8 sm:py-[calc(4rem*2/3)] md:py-[calc(5rem*2/3)]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionFrame className="text-center">
          <SectionHeading>{wedding.intimateMeal.name || 'Bữa cơm thân mật'}</SectionHeading>

          {meal && (
            <Reveal>
              <p className="text-sm tracking-[0.28em] text-w-muted">
                {meal.clock}
                <span className="mx-3 text-w-line-strong">·</span>
                {meal.weekday}
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 text-w-strong">
                <span className="text-6xl font-medium leading-none tabular-nums text-w-strong sm:text-7xl">{meal.day}</span>
                <span className="h-14 w-px bg-w-line" aria-hidden />
                <span className="text-left text-sm leading-tight tracking-[0.18em]">
                  THÁNG {String(meal.month).padStart(2, '0')}
                  <br />
                  {meal.year}
                </span>
              </div>
              {lunar && <p className="mt-3 text-sm italic text-w-soft">({lunar})</p>}
            </Reveal>
          )}

          {meal && (
            <Reveal delay={120}>
              <div className="mx-auto mt-8 max-w-sm">
                <p className="font-serif text-3xl text-w-strong">Tháng {meal.month} / {meal.year}</p>
                <div className="mx-auto mt-2 h-px w-24 bg-w-line" />
                <div className="mt-3 grid grid-cols-7 text-[0.68rem] tracking-[0.14em] text-w-muted">
                  {WEEKDAYS.map((name) => (
                    <span key={name} className="py-1.5">
                      {name}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 text-[0.95rem] text-w-text">
                  {cells.map((day, index) => (
                    <span key={`${day ?? 'x'}-${index}`} className="flex h-9 items-center justify-center">
                      {day === meal.day ? <HeartDay day={day} /> : day}
                    </span>
                  ))}
                </div>
              </div>

              {calendar && (
                <a
                  href={calendar}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex text-sm tracking-wide text-w-strong underline decoration-w-line-strong underline-offset-4"
                >
                  Thêm vào lịch
                </a>
              )}
            </Reveal>
          )}

          {houses.length > 0 && (
            <Reveal delay={160}>
            <div className={`mx-auto mt-10 grid max-w-2xl items-stretch ${houses.length > 1 ? 'grid-cols-[1fr_auto_1fr] gap-x-2 gap-y-0 sm:gap-x-6' : ''}`}>
              {houses.map((house, index) => {
                const lines = addressLines(house.address)
                return (
                  <div key={house.label} className="contents">
                    {index > 0 && (
                      <div className="flex flex-col items-center self-stretch" aria-hidden>
                        <span className="w-px flex-1 bg-w-line" />
                        <PeachBlossom className="my-1.5 h-3.5 w-3.5 text-w-line-strong sm:my-2 sm:h-4 sm:w-4" />
                        <span className="w-px flex-1 bg-w-line" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-sans text-[0.62rem] font-medium uppercase tracking-[0.16em] text-w-muted sm:text-xs sm:tracking-[0.24em]">{house.label}</h3>
                      {lines.length > 0 && (
                        <p className="mt-2 text-[0.75rem] leading-relaxed text-w-soft sm:text-sm">
                          {lines.map((line) => (
                            <span key={line} className="block">
                              {line}
                            </span>
                          ))}
                        </p>
                      )}
                      {house.mapsUrl && (
                        <a
                          href={house.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex min-h-9 items-center gap-1 rounded-full border border-w-line px-2.5 text-[0.65rem] font-semibold tracking-[0.06em] text-w-strong sm:min-h-10 sm:gap-1.5 sm:px-4 sm:text-xs sm:tracking-[0.12em]"
                        >
                          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
                          Chỉ đường
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            </Reveal>
          )}
        </SectionFrame>
      </div>
    </section>
  )
}
