import { NextResponse } from 'next/server'
import { isRedisConfigured, rejectIfWrongPassword } from '@/lib/redis'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** Khi chạy npm run dev, chỉ chính máy này được sửa. Bản deploy dùng mật khẩu. */
export function isAdminAllowed(host: string | null) {
  if (process.env.NODE_ENV !== 'development') return false
  const hostname = (host ?? '').replace(/:\d+$/, '')
  return LOCAL_HOSTS.has(hostname)
}

/** Trang web lạ mở trong cùng trình duyệt có thể gửi form tới localhost, nên kiểm tra cả Origin */
function isLocalOrigin(origin: string | null) {
  if (!origin) return true
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname) || new URL(origin).hostname === '::1'
  } catch {
    return false
  }
}

/**
 * Local: chỉ localhost.
 * Bản deploy: cùng mật khẩu /quan-ly (GUESTBOOK_ADMIN_PASSWORD), và phải có Redis để lưu được.
 * Trả về Response lỗi, hoặc null nếu được phép.
 */
export async function authorizeAdminWrite(request: Request): Promise<Response | null> {
  if (process.env.NODE_ENV !== 'production') {
    if (isAdminAllowed(request.headers.get('host')) && isLocalOrigin(request.headers.get('origin'))) return null
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!process.env.GUESTBOOK_ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Chưa đặt GUESTBOOK_ADMIN_PASSWORD trên Vercel' }, { status: 503 })
  }
  if (!isRedisConfigured) {
    return NextResponse.json(
      { error: 'Chưa kết nối Upstash Redis, chưa lưu được nội dung trên Vercel' },
      { status: 503 },
    )
  }
  return rejectIfWrongPassword(request)
}
