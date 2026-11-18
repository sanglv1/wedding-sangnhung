import { NextResponse } from 'next/server'
import { authorizeAdminWrite } from '@/lib/admin-guard'
import { validateContent, type WeddingContent } from '@/lib/content'
import { getLiveContent, saveLiveContent } from '@/lib/live-content'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const rejected = await authorizeAdminWrite(request)
  if (rejected) return rejected
  return NextResponse.json(await getLiveContent())
}

export async function PUT(request: Request) {
  const rejected = await authorizeAdminWrite(request)
  if (rejected) return rejected

  let data: unknown
  try {
    data = await request.json()
  } catch {
    return NextResponse.json({ error: 'Dữ liệu gửi lên không phải JSON' }, { status: 400 })
  }
  const error = validateContent(data)
  if (error) return NextResponse.json({ error }, { status: 400 })

  try {
    await saveLiveContent(data as WeddingContent)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Lưu thất bại'
    return NextResponse.json({ error: message }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
