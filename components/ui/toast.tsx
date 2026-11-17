'use client'

import { useEffect, useState } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'

const TOAST_EVENT = 'wedding-toast'
const TOAST_MS = 2400

type ToastTone = 'success' | 'error'
type ToastDetail = { message: string; tone: ToastTone }

export function showToast(message: string, tone: ToastTone = 'success') {
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { message, tone } }))
}

/**
 * Đặt ngoài <main>: phần tử cha có transform/filter (như .reveal) sẽ làm position: fixed bám theo nó.
 * Vùng aria-live luôn có sẵn trong DOM để trình đọc màn hình đọc được thông báo chèn vào sau.
 */
export function Toaster() {
  const [toast, setToast] = useState<(ToastDetail & { id: number }) | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const onToast = (e: Event) => {
      const { detail } = e as CustomEvent<ToastDetail>
      setToast({ ...detail, id: Date.now() })
      clearTimeout(timer)
      timer = setTimeout(() => setToast(null), TOAST_MS)
    }
    window.addEventListener(TOAST_EVENT, onToast)
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast)
      clearTimeout(timer)
    }
  }, [])

  const Icon = toast?.tone === 'error' ? CircleAlert : CircleCheck
  return (
    <div className="wedding-toast-region" role="status" aria-live="polite">
      {toast && (
        <p key={toast.id} className={`wedding-toast ${toast.tone === 'error' ? 'is-error' : ''}`}>
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {toast.message}
        </p>
      )}
    </div>
  )
}
