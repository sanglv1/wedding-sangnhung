import { clearGuestSent, deleteGuest, markGuestSent, setGuestSide } from '@/lib/guest-store'
import { withAdmin } from '@/lib/redis'

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
  return withAdmin(
    request,
    async () => {
      const { key } = await params
      const body = (await request.json().catch(() => ({}))) as { sent?: unknown; side?: unknown }
      if ('side' in body) {
        if (body.side !== null && body.side !== '' && body.side !== 'groom' && body.side !== 'bride') {
          return Response.json({ error: 'Nhà chưa đúng' }, { status: 400 })
        }
        const side = body.side === 'groom' || body.side === 'bride' ? body.side : null
        const changed = await setGuestSide(key, side)
        return changed ? Response.json({ ok: true }) : Response.json({ error: 'Không tìm thấy khách' }, { status: 404 })
      }
      const ok = body.sent === false ? await clearGuestSent(key) : await markGuestSent(key)
      return ok ? Response.json({ ok: true }) : Response.json({ error: 'Không tìm thấy khách' }, { status: 404 })
    },
    'Không cập nhật được trạng thái gửi',
  )
}

export async function DELETE(request: Request, { params }: { params: Promise<{ key: string }> }) {
  return withAdmin(
    request,
    async () => {
      const { key } = await params
      return (await deleteGuest(key))
        ? Response.json({ ok: true })
        : Response.json({ error: 'Không tìm thấy khách' }, { status: 404 })
    },
    'Không xoá được khách',
  )
}
