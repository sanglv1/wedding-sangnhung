import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { isOptimizableImage } from '@/lib/media-src'
import type { WeddingModel } from '@/lib/wedding-model'

export const SHARE_SIZE = { width: 1200, height: 630 }

/** Trình tạo ảnh OG chỉ đọc được PNG và JPEG */
const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' }
const PHOTO_WIDTH = 470
const INK = '#fbf3e4'
const GOLD = '#e3c58f'

const FONT_FILES = { 'Be Vietnam Pro': 'BeVietnamPro-Regular.ttf', 'Great Vibes': 'GreatVibes-Regular.ttf' } as const
type FontName = keyof typeof FONT_FILES

let fontsLoaded: Promise<{ name: FontName; data: Buffer }[]> | undefined

/** Khi đã truyền font riêng, trình tạo ảnh bỏ font mặc định nên phải nạp cả font chữ thường */
function loadFonts() {
  fontsLoaded ??= Promise.all(
    (Object.entries(FONT_FILES) as [FontName, string][]).map(async ([name, file]) => {
      const data = await readFile(join(process.cwd(), 'assets', 'fonts', file)).catch(() => null)
      return data ? [{ name, data }] : []
    }),
  ).then((list) => list.flat())
  return fontsLoaded
}

function dataUrl(bytes: ArrayBuffer | Buffer, mime: string) {
  return `data:${mime};base64,${Buffer.from(bytes as ArrayBuffer).toString('base64')}`
}

/** Chỉ đọc ảnh nằm trên chính site (public hoặc /api/media), không tải URL ngoài từ server */
async function loadPhoto(src: string) {
  if (!src.startsWith('/') || src.startsWith('//')) return null
  try {
    if (isOptimizableImage(src)) {
      const mime = MIME[src.split('.').pop()?.toLowerCase() ?? '']
      if (!mime) return null
      return dataUrl(await readFile(join(process.cwd(), 'public', src)), mime)
    }
    const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
    if (!site) return null
    const res = await fetch(`${site}${src}`, { signal: AbortSignal.timeout(4000) })
    const mime = res.headers.get('content-type')?.split(';')[0] ?? ''
    if (!res.ok || !Object.values(MIME).includes(mime)) return null
    return dataUrl(await res.arrayBuffer(), mime)
  } catch {
    return null
  }
}

export async function renderShareCard(model: WeddingModel | null) {
  const [fonts, photo] = await Promise.all([loadFonts(), model ? loadPhoto(model.hero.src) : null])
  const w = model?.wedding
  const has = (name: FontName) => fonts.some((font) => font.name === name)
  const script = has('Great Vibes') && has('Be Vietnam Pro') ? 'Great Vibes' : undefined
  const date = w?.dateShort.replaceAll('/', ' · ') ?? ''

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#420a10', color: INK, fontFamily: 'Be Vietnam Pro' }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            width={PHOTO_WIDTH}
            height={SHARE_SIZE.height}
            style={{ width: PHOTO_WIDTH, height: SHARE_SIZE.height, objectFit: 'cover', objectPosition: model?.hero.focus }}
          />
        )}
        <div style={{ flex: 1, display: 'flex', padding: 28 }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              border: `2px solid ${GOLD}88`,
              borderRadius: 24,
              padding: '0 40px',
            }}
          >
            <div style={{ fontSize: 24, letterSpacing: 8, color: GOLD }}>{(w?.ceremony.name ?? 'Trân trọng kính mời').toUpperCase()}</div>
            {w ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 18, fontFamily: script, lineHeight: 1.05 }}>
                <div style={{ fontSize: 96 }}>{w.groomShort}</div>
                <div style={{ fontSize: 56, color: GOLD }}>&amp;</div>
                <div style={{ fontSize: 96 }}>{w.brideShort}</div>
              </div>
            ) : (
              <div style={{ fontSize: 96, marginTop: 18, fontFamily: script }}>Thiệp cưới</div>
            )}
            {date && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 26 }}>
                <div style={{ width: 220, height: 2, background: GOLD, opacity: 0.7 }} />
                <div style={{ fontSize: 40, letterSpacing: 8, marginTop: 22 }}>{date}</div>
              </div>
            )}
            {w?.ceremony.lunarDate && <div style={{ fontSize: 22, marginTop: 10, color: GOLD }}>{w.ceremony.lunarDate}</div>}
          </div>
        </div>
      </div>
    ),
    {
      ...SHARE_SIZE,
      fonts: script ? fonts.map(({ name, data }) => ({ name, data, style: 'normal' as const, weight: 400 as const })) : undefined,
    },
  )
}
