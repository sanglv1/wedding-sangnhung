import { allowOpen, recordOpen } from '@/lib/guest-store'
import { clientIp, isRedisConfigured, notConfigured } from '@/lib/redis'

export async function POST(request: Request) {
  if (!isRedisConfigured) return notConfigured()
  const body = (await request.json().catch(() => ({}))) as { name?: unknown; id?: unknown; side?: unknown }
  const name = typeof body.name === 'string' ? body.name : ''
  if (!name.trim()) return Response.json({ error: 'Thiếu tên' }, { status: 400 })
  const id = typeof body.id === 'string' ? body.id.trim().slice(0, 80) : ''
  const side = body.side === 'groom' || body.side === 'bride' ? body.side : null
  try {
    if (!(await allowOpen(clientIp(request)))) return Response.json({ ok: false }, { status: 429 })
    return Response.json({ ok: await recordOpen(name, id, side) })
  } catch {
    return Response.json({ error: 'Không ghi nhận được' }, { status: 502 })
  }
}
