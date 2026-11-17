import { NextResponse } from 'next/server'
import { isRedisConfigured } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({ ok: true, rsvp: isRedisConfigured ? 'luu-duoc' : 'chua-gan-redis' })
}
