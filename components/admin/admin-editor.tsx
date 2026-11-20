'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, ExternalLink, Loader2, LogOut, RotateCcw, Save } from 'lucide-react'
import type { WeddingContent } from '@/lib/content'
import { ADMIN_PASSWORD_KEY, verifyGuestbookPassword } from '@/lib/guestbook'
import { errorText } from './shared'
import {
  CoupleSection,
  GiftSection,
  HousesSection,
  ImagesSection,
  LetterSection,
  MealSection,
  MusicSection,
  ThemeSection,
  type Update,
} from './admin-sections'

const NAV = [
  { id: 'mau-nen', label: 'Màu nền' },
  { id: 'co-dau-chu-re', label: 'Cô dâu & chú rể' },
  { id: 'thu-moi', label: 'Thư mời' },
  { id: 'hai-nha', label: 'Ông bà & hai nhà' },
  { id: 'bua-com', label: 'Bữa cơm' },
  { id: 'anh', label: 'Ảnh' },
  { id: 'mung-cuoi', label: 'Hộp mừng' },
  { id: 'nhac', label: 'Nhạc nền' },
]

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string }

export function AdminEditor({ initial, requirePassword }: { initial: WeddingContent; requirePassword: boolean }) {
  const [saved, setSaved] = useState(initial)
  const [content, setContent] = useState(initial)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [password, setPassword] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [loginError, setLoginError] = useState('')
  const dirty = content !== saved

  const update: Update = useCallback((fn) => {
    setContent((prev) => {
      const next = structuredClone(prev)
      fn(next)
      return next
    })
    setStatus({ kind: 'idle' })
  }, [])

  const save = useCallback(async () => {
    setStatus({ kind: 'saving' })
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (password) headers['x-admin-password'] = password
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers,
        body: JSON.stringify(content),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Lưu thất bại')
      setSaved(content)
      setStatus({ kind: 'saved' })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : 'Lưu thất bại' })
    }
  }, [content, password])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('beforeunload', warn)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('beforeunload', warn)
      window.removeEventListener('keydown', onKey)
    }
  }, [dirty, save])

  useEffect(() => {
    if (!requirePassword) return
    const stored = sessionStorage.getItem(ADMIN_PASSWORD_KEY)
    if (!stored) return
    verifyGuestbookPassword(stored)
      .then(() => setPassword(stored))
      .catch(() => sessionStorage.removeItem(ADMIN_PASSWORD_KEY))
  }, [requirePassword])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setChecking(true)
    setLoginError('')
    try {
      await verifyGuestbookPassword(input)
      sessionStorage.setItem(ADMIN_PASSWORD_KEY, input)
      setPassword(input)
      setInput('')
    } catch (err) {
      setLoginError(errorText(err))
    } finally {
      setChecking(false)
    }
  }

  const logout = () => {
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY)
    setPassword(null)
  }

  if (requirePassword && !password) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 text-stone-800">
        <form onSubmit={login} className="w-full max-w-sm space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-center text-xl font-semibold text-stone-900">Quản trị thiệp cưới</h1>
          <p className="text-center text-sm text-stone-500">Cùng mật khẩu trang quản lý khách.</p>
          <label htmlFor="admin-pass" className="block text-sm font-medium text-stone-700">
            Mật khẩu
          </label>
          <input
            id="admin-pass"
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
            autoFocus
            autoComplete="current-password"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-400"
          />
          {loginError && (
            <p className="text-center text-sm text-red-600" role="alert">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={checking}
            className="w-full rounded-xl bg-rose-600 py-3 font-semibold text-white hover:bg-rose-700 disabled:opacity-70"
          >
            {checking ? 'Đang kiểm tra...' : 'Đăng nhập'}
          </button>
        </form>
      </main>
    )
  }

  const props = { content, update }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-base font-semibold text-stone-900">Quản trị thiệp cưới</h1>
            <p className="text-xs text-stone-500">
              {content.couple.groomShort} &amp; {content.couple.brideShort}
              {requirePassword ? ' · lưu lên mạng, khách thấy ngay' : ' · lưu vào content/wedding.json'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusText status={status} dirty={dirty} />
            <a
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              <ExternalLink className="w-4 h-4" /> Xem thiệp
            </a>
            {requirePassword && (
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                <LogOut className="w-4 h-4" /> Thoát
              </button>
            )}
            <button
              type="button"
              disabled={!dirty || status.kind === 'saving'}
              onClick={() => {
                setContent(saved)
                setStatus({ kind: 'idle' })
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" /> Hoàn tác
            </button>
            <button
              type="button"
              disabled={!dirty || status.kind === 'saving'}
              onClick={save}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-40"
            >
              {status.kind === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_1fr]">
        <nav className="hidden lg:block" aria-label="Các phần">
          <ul className="sticky top-24 space-y-1">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className="block rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-white hover:text-stone-900">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="space-y-6 pb-16">
          {/*<p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">*/}
          {/*  {requirePassword ? (*/}
          {/*    <>*/}
          {/*      Đang sửa bản khách đang xem. Bấm Lưu là thấy ngay, không cần deploy lại. Ảnh và nhạc mới thì tải trên*/}
          {/*      máy khi chạy <code className="font-mono">npm run dev</code>, rồi deploy.*/}
          {/*    </>*/}
          {/*  ) : (*/}
          {/*    <>*/}
          {/*      Lưu tại đây ghi vào <code className="font-mono">content/wedding.json</code> trên máy. Muốn khách thấy thì*/}
          {/*      deploy lại. Bản trên Vercel mở <code className="font-mono">/admin</code>, đăng nhập bằng mật khẩu trang*/}
          {/*      quản lý, lưu là khách thấy ngay.*/}
          {/*    </>*/}
          {/*  )}*/}
          {/*</p>*/}
          <ThemeSection {...props} />
          <CoupleSection {...props} />
          <LetterSection {...props} />
          <HousesSection {...props} />
          <MealSection {...props} />
          <ImagesSection {...props} />
          <GiftSection {...props} />
          <MusicSection {...props} />
        </main>
      </div>
    </div>
  )
}

function StatusText({ status, dirty }: { status: Status; dirty: boolean }) {
  if (status.kind === 'error') return <span className="text-sm text-red-600">{status.message}</span>
  if (status.kind === 'saved')
    return (
      <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
        <Check className="w-4 h-4" /> Đã lưu
      </span>
    )
  if (dirty) return <span className="text-sm text-amber-600">Chưa lưu (Ctrl + S)</span>
  return null
}
