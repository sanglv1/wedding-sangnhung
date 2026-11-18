'use client'

/* eslint-disable @next/next/no-img-element -- ảnh xem trước trong trang quản trị, không cần tối ưu */
import { Crosshair, ImagePlus, Star } from 'lucide-react'
import { describeDate, type WeddingContent } from '@/lib/content'
import { DEFAULT_THEME, isThemeId, THEMES, THEME_ORDER, type ThemeId } from '@/lib/themes'
import {
  AdminSection,
  Field,
  Grid,
  ListControls,
  SmallButton,
  TextInput,
  UploadButton,
  moveItem,
} from './fields'

export type Update = (fn: (draft: WeddingContent) => void) => void

interface SectionProps {
  content: WeddingContent
  update: Update
}

function hourPhrase(time: string) {
  const match = /^(\d{1,2})(?::(\d{2}))?/.exec(time.trim())
  if (!match) return time.trim()
  const hour = String(Number(match[1]))
  const minute = match[2]
  if (!minute || minute === '00') return `${hour} giờ`
  return `${hour} giờ ${minute}`
}

function venuePhrase(venue: string) {
  const text = venue.trim()
  if (!text) return ''
  const lower = text.toLocaleLowerCase('vi')
  return lower.startsWith('tại ') ? `, ${lower}` : `, tại ${lower}`
}

const MEAL_WEEKDAYS = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY']

function mealPreview(time: string) {
  const match = /(\d{1,2})\s*h(?:\s*(\d{2}))?[^\d]*(\d{1,2})\/(\d{1,2})\/(\d{4})/i.exec(time)
  if (!match) return null
  const hour = String(Number(match[1])).padStart(2, '0')
  const minute = match[2] ?? '00'
  const day = Number(match[3])
  const month = Number(match[4])
  const year = Number(match[5])
  const weekday = MEAL_WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${hour}:${minute} · ${weekday} · ngày ${day} tháng ${month}, ${year}`
}

export function ThemeSection({ content, update }: SectionProps) {
  const theme: ThemeId = isThemeId(content.theme) ? content.theme : DEFAULT_THEME
  const names = `${content.couple.groomShort || 'Chú rể'} & ${content.couple.brideShort || 'Cô dâu'}`

  return (
    <AdminSection
      id="mau-nen"
      title="Màu nền thiệp"
      description="Màu khách thấy khi mở link. Nút đổi màu trên thiệp chỉ nhớ trên máy người bấm, không đổi màu này."
    >
      <div
        data-theme={theme}
        className="rounded-2xl border border-black/10 px-5 py-6 text-center shadow-inner"
        style={{ background: 'var(--w-bg)', color: 'var(--w-strong)' }}
      >
        <p className="text-[0.68rem] uppercase tracking-[0.32em]" style={{ color: 'var(--w-muted)' }}>
          Trân trọng kính mời
        </p>
        <p className="mt-2 font-serif text-3xl leading-none">{names}</p>
        <p className="mt-2 text-sm" style={{ color: 'var(--w-soft)' }}>
          {THEMES[theme].name}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {THEME_ORDER.map((id) => {
          const selected = id === theme
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                update((d) => {
                  d.theme = id
                })
              }
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition ${
                selected ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <span
                className="h-8 w-8 shrink-0 rounded-full border border-black/10 shadow-sm"
                style={{ background: THEMES[id].swatch }}
              />
              <span className="font-medium text-stone-800">{THEMES[id].name}</span>
            </button>
          )
        })}
      </div>
    </AdminSection>
  )
}

export function CoupleSection({ content, update }: SectionProps) {
  const c = content.couple
  const set = (key: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) =>
    update((d) => {
      d.couple[key] = e.target.value
    })

  return (
    <AdminSection
      id="co-dau-chu-re"
      title="Cô dâu & chú rể"
      description="Tên lớn in trên thư mời. Tên ngắn ở hộp mừng và ảnh chia sẻ. Tên menu ở thanh trên cùng."
    >
      <Grid>
        <Field label="Tên chú rể trên thư mời" hint="Chữ lớn, ví dụ: Lương Sáng">
          <TextInput value={c.groom} onChange={set('groom')} />
        </Field>
        <Field label="Tên cô dâu trên thư mời" hint="Ví dụ: Trần Nhung">
          <TextInput value={c.bride} onChange={set('bride')} />
        </Field>
        <Field label="Tên ngắn chú rể" hint="Hộp mừng và dòng chia sẻ link">
          <TextInput value={c.groomShort} onChange={set('groomShort')} />
        </Field>
        <Field label="Tên ngắn cô dâu">
          <TextInput value={c.brideShort} onChange={set('brideShort')} />
        </Field>
        <Field label="Tên chú rể trên menu" hint="Ngắn, ví dụ: Sáng">
          <TextInput value={c.groomBrand} onChange={set('groomBrand')} />
        </Field>
        <Field label="Tên cô dâu trên menu" hint="Ví dụ: Nhung">
          <TextInput value={c.brideBrand} onChange={set('brideBrand')} />
        </Field>
      </Grid>
    </AdminSection>
  )
}

export function LetterSection({ content, update }: SectionProps) {
  const e = content.event
  const start = describeDate(e.start)
  const set = (key: 'start' | 'end' | 'lunarDate' | 'ceremonyTime' | 'ceremonyVenue') =>
    (ev: React.ChangeEvent<HTMLInputElement>) =>
      update((d) => {
        d.event[key] = ev.target.value
      })
  const when = hourPhrase(e.ceremonyTime)

  return (
    <AdminSection
      id="thu-moi"
      title="Thư mời"
      description="Ngày, giờ và dòng “Hôn lễ lúc…” in cạnh ảnh. Đếm ngược chạy tới giờ kết thúc."
    >
      <Grid>
        <Field label="Giờ hôn lễ" hint="Thứ, ngày và tháng trên thiệp lấy từ đây.">
          <TextInput type="datetime-local" value={e.start} onChange={set('start')} />
        </Field>
        <Field label="Giờ kết thúc" hint="Đếm ngược và nút thêm vào lịch.">
          <TextInput type="datetime-local" value={e.end} onChange={set('end')} />
        </Field>
        <Field label="Giờ in trên thư" hint="Ví dụ 11:00 thành “11 giờ”.">
          <TextInput value={e.ceremonyTime} onChange={set('ceremonyTime')} placeholder="11:00" />
        </Field>
        <Field label="Nơi in trên thư" hint="Ví dụ: Nhà chú rể">
          <TextInput value={e.ceremonyVenue} onChange={set('ceremonyVenue')} />
        </Field>
      </Grid>
      <Field label="Ngày âm lịch" hint="In trong ngoặc dưới ngày dương. Ví dụ: Tức ngày 12 tháng 11 năm Bính Ngọ">
        <TextInput value={e.lunarDate} onChange={set('lunarDate')} />
      </Field>
      {start && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm leading-relaxed text-rose-800">
          Thư sẽ in: <b>{start.dayOfWeek}</b> · {start.day} · tháng {start.month} {start.year}
          {e.lunarDate.trim() ? ` · (${e.lunarDate.trim()})` : ''}
          <br />
          Hôn lễ lúc {when || '…'}{venuePhrase(e.ceremonyVenue)}
        </p>
      )}
    </AdminSection>
  )
}

export function HousesSection({ content, update }: SectionProps) {
  return (
    <AdminSection
      id="hai-nha"
      title="Ông bà & hai nhà"
      description="In dưới thư mời, và lại hiện ở phần bữa cơm kèm nút chỉ đường."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            ['nhaTrai', 'groomFamily', 'Nhà trai'],
            ['nhaGai', 'brideFamily', 'Nhà gái'],
          ] as const
        ).map(([familySide, addressSide, label]) => (
          <div key={familySide} className="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="font-medium text-stone-800">{label}</p>
            <Field label="Ông">
              <TextInput
                value={content.family[familySide].ong}
                onChange={(ev) =>
                  update((d) => {
                    d.family[familySide].ong = ev.target.value
                  })
                }
              />
            </Field>
            <Field label="Bà">
              <TextInput
                value={content.family[familySide].ba}
                onChange={(ev) =>
                  update((d) => {
                    d.family[familySide].ba = ev.target.value
                  })
                }
              />
            </Field>
            <Field label="Địa chỉ" hint="Mỗi dấu phẩy xuống một dòng trên thiệp.">
              <TextInput
                value={content.addresses[addressSide].address}
                onChange={(ev) =>
                  update((d) => {
                    d.addresses[addressSide].address = ev.target.value
                  })
                }
              />
            </Field>
            <Field label="Link chỉ đường" hint="Google Maps → Chia sẻ → Sao chép đường liên kết">
              <TextInput
                value={content.addresses[addressSide].mapsUrl}
                onChange={(ev) =>
                  update((d) => {
                    d.addresses[addressSide].mapsUrl = ev.target.value
                  })
                }
              />
            </Field>
          </div>
        ))}
      </div>
    </AdminSection>
  )
}

export function MealSection({ content, update }: SectionProps) {
  const meal = content.event
  const preview = mealPreview(meal.mealTime)
  const set = (key: 'mealName' | 'mealTime') => (ev: React.ChangeEvent<HTMLInputElement>) =>
    update((d) => {
      d.event[key] = ev.target.value
    })

  return (
    <AdminSection
      id="bua-com"
      title="Bữa cơm thân mật"
      description="Phần lịch phía dưới thư mời. Địa chỉ hai nhà lấy ở mục ông bà."
    >
      <Grid>
        <Field label="Tên phần" hint="Tiêu đề, ví dụ: Bữa cơm thân mật">
          <TextInput value={meal.mealName} onChange={set('mealName')} />
        </Field>
        <Field label="Giờ và ngày" hint="Viết đủ ngày để thiệp vẽ lịch. Ví dụ: Từ 16h ngày 19/12/2026">
          <TextInput value={meal.mealTime} onChange={set('mealTime')} />
        </Field>
      </Grid>
      {preview ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          Thiệp sẽ in: <b>{preview}</b>
        </p>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Chưa tách được giờ và ngày. Viết theo mẫu: Từ 16h ngày 19/12/2026
        </p>
      )}
    </AdminSection>
  )
}

function parseFocus(focus: string) {
  const m = focus.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/)
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 50, y: 50 }
}

export function ImagesSection({ content, update }: SectionProps) {
  const hero = content.hero
  const focus = parseFocus(hero.focus)

  const pickFocus = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    update((d) => {
      d.hero.focus = `${x}% ${y}%`
    })
  }

  return (
    <AdminSection
      id="anh"
      title="Ảnh thiệp & album"
      description="Ảnh bên trái của thư mời. Album hiện ở phần Khoảnh khắc. Ảnh tải lên lưu vào public/gallery, không ghi đè ảnh cũ."
    >
      <div>
        <p className="text-sm font-medium text-stone-700">Ảnh bìa</p>
        <p className="mt-0.5 text-xs text-stone-500">
          Bấm vào khuôn mặt trên ảnh bên trái để đặt điểm giữ lại khi ảnh phải cắt cho vừa khung.
        </p>
        <div className="mt-3 flex flex-wrap items-start gap-5">
          <div
            className="relative cursor-crosshair overflow-hidden rounded-lg border border-stone-200"
            onClick={pickFocus}
            role="button"
            tabIndex={-1}
            aria-label="Chọn điểm lấy nét"
          >
            <img src={hero.src} alt="Ảnh bìa" className="block max-h-72 w-auto max-w-full select-none" draggable={false} />
            <span
              className="pointer-events-none absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose-500/40 shadow-[0_0_0_2px_rgba(0,0,0,0.35)]"
              style={{ left: `${focus.x}%`, top: `${focus.y}%` }}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-stone-500">Xem trước khung 4:5</p>
            <div className="w-40 aspect-[4/5] overflow-hidden rounded-md border border-amber-300 shadow">
              <img src={hero.src} alt="" className="h-full w-full object-cover" style={{ objectPosition: hero.focus }} />
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-stone-500">
              <Crosshair className="w-3.5 h-3.5" /> {hero.focus}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <UploadButton
            folder="gallery"
            accept="image/jpeg,image/png,image/webp"
            label="Tải ảnh bìa mới"
            onUploaded={([path]) =>
              update((d) => {
                d.hero = { src: path, focus: '50% 40%' }
              })
            }
          />
        </div>
      </div>

      <div className="border-t border-stone-200 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-stone-700">Album ảnh ({content.gallery.length} ảnh)</p>
            <p className="mt-0.5 text-xs text-stone-500">Thứ tự dưới đây là thứ tự trình chiếu.</p>
          </div>
          <UploadButton
            folder="gallery"
            accept="image/jpeg,image/png,image/webp"
            multiple
            label="Thêm ảnh vào album"
            onUploaded={(paths) =>
              update((d) => {
                for (const src of paths) {
                  d.gallery.push({ src, alt: `Ảnh cưới ${d.gallery.length + 1}`, caption: '' })
                }
              })
            }
          />
        </div>

        {content.gallery.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-300 py-10 text-stone-500">
            <ImagePlus className="w-8 h-8" />
            <p className="text-sm">Chưa có ảnh nào</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.gallery.map((img, i) => (
              <li key={`${img.src}-${i}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-stone-200">
                  <img src={img.src} alt={img.alt} className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
                    {i + 1}
                  </span>
                  {hero.src === img.src && (
                    <span className="absolute right-2 top-2 rounded-md bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white">
                      Ảnh bìa
                    </span>
                  )}
                </div>
                <div className="mt-2.5 space-y-2">
                  <TextInput
                    value={img.caption}
                    placeholder="Chú thích (tuỳ chọn)"
                    aria-label="Chú thích"
                    onChange={(ev) =>
                      update((d) => {
                        d.gallery[i].caption = ev.target.value
                      })
                    }
                  />
                  <TextInput
                    value={img.alt}
                    placeholder="Mô tả ảnh"
                    aria-label="Mô tả ảnh"
                    onChange={(ev) =>
                      update((d) => {
                        d.gallery[i].alt = ev.target.value
                      })
                    }
                  />
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <SmallButton
                    disabled={hero.src === img.src}
                    onClick={() =>
                      update((d) => {
                        d.hero = { src: img.src, focus: '50% 40%' }
                      })
                    }
                  >
                    <Star className="w-3.5 h-3.5" /> Làm ảnh bìa
                  </SmallButton>
                  <ListControls
                    index={i}
                    length={content.gallery.length}
                    onMove={(from, to) =>
                      update((d) => {
                        d.gallery = moveItem(d.gallery, from, to)
                      })
                    }
                    onRemove={(idx) =>
                      update((d) => {
                        d.gallery.splice(idx, 1)
                      })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminSection>
  )
}

export function GiftSection({ content, update }: SectionProps) {
  return (
    <AdminSection id="mung-cuoi" title="Hộp mừng cưới" description="Mã QR lấy từ app ngân hàng (mục Nhận tiền / Mã QR của tôi).">
      <div className="grid gap-6 md:grid-cols-2">
        {(['groom', 'bride'] as const).map((side) => {
          const g = content.gift[side]
          const set = (key: 'name' | 'bankName' | 'accountNumber' | 'accountName') =>
            (ev: React.ChangeEvent<HTMLInputElement>) =>
              update((d) => {
                d.gift[side][key] = ev.target.value
              })
          return (
            <div key={side} className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-4">
              <p className="font-medium text-stone-800">{side === 'groom' ? 'Phía chú rể' : 'Phía cô dâu'}</p>
              <div className="flex items-center gap-4">
                <img src={g.qrPath} alt="Mã QR" className="h-28 w-28 rounded-lg border border-stone-200 bg-white object-contain p-1" />
                <UploadButton
                  folder="qrcode"
                  accept="image/jpeg,image/png,image/webp"
                  label="Tải mã QR"
                  onUploaded={([path]) =>
                    update((d) => {
                      d.gift[side].qrPath = path
                    })
                  }
                />
              </div>
              <Field label="Tiêu đề thẻ" hint="Ví dụ: Chú rể, Nhà trai">
                <TextInput value={g.name} onChange={set('name')} />
              </Field>
              <Field label="Ngân hàng">
                <TextInput value={g.bankName} onChange={set('bankName')} />
              </Field>
              <Field label="Số tài khoản">
                <TextInput value={g.accountNumber} onChange={set('accountNumber')} inputMode="numeric" />
              </Field>
              <Field label="Tên chủ tài khoản" hint="Viết hoa không dấu như trên app, ví dụ: LUONG VAN SANG">
                <TextInput value={g.accountName} onChange={set('accountName')} />
              </Field>
            </div>
          )
        })}
      </div>
    </AdminSection>
  )
}

export function MusicSection({ content, update }: SectionProps) {
  const m = content.music
  return (
    <AdminSection id="nhac" title="Nhạc nền" description="Phát lần lượt từng bài, hết bài cuối quay lại bài đầu.">
      <ul className="space-y-2">
        {m.playlist.map((src, i) => (
          <li key={`${src}-${i}`} className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-2.5">
            <span className="w-6 text-center text-sm font-medium text-stone-500">{i + 1}</span>
            <audio controls preload="none" src={src} className="h-9 flex-1 min-w-[12rem]" />
            <span className="max-w-[12rem] truncate text-xs text-stone-500" title={src}>
              {src.split('/').pop()}
            </span>
            <ListControls
              index={i}
              length={m.playlist.length}
              onMove={(from, to) =>
                update((d) => {
                  d.music.playlist = moveItem(d.music.playlist, from, to)
                })
              }
              onRemove={(idx) =>
                update((d) => {
                  d.music.playlist.splice(idx, 1)
                })
              }
            />
          </li>
        ))}
      </ul>
      <UploadButton
        folder="music"
        accept="audio/mpeg,audio/mp4,audio/ogg,.mp3,.m4a,.ogg"
        multiple
        label="Thêm bài hát (mp3)"
        onUploaded={(paths) =>
          update((d) => {
            d.music.playlist.push(...paths)
          })
        }
      />
      <Field label={`Âm lượng: ${Math.round(m.volume * 100)}%`}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={m.volume}
          onChange={(ev) =>
            update((d) => {
              d.music.volume = Number(ev.target.value)
            })
          }
          className="w-full max-w-xs accent-rose-500"
        />
      </Field>
    </AdminSection>
  )
}
