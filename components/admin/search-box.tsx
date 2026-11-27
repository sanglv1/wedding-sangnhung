'use client'

import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { highlightPattern } from '@/lib/search-text'

export function SearchBox({
  id,
  value,
  onChange,
  placeholder = 'Tìm tên hoặc số điện thoại, không cần dấu',
  label = 'Tìm khách',
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
      if (event.key === 'Escape' && document.activeElement === ref.current) {
        event.preventDefault()
        if (value) onChange('')
        else ref.current?.blur()
        return
      }
      if (typing || event.altKey || event.isComposing) return
      const shortcut = event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')
      if (!shortcut) return
      event.preventDefault()
      ref.current?.focus()
      ref.current?.select()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onChange, value])

  return (
    <div className="relative" role="search">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-w-muted" aria-hidden />
      <input
        ref={ref}
        id={id}
        type="text"
        role="searchbox"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        autoFocus
        className={`field-wedding pl-10 ${value ? 'pr-12' : 'pr-4 sm:pr-16'}`}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('')
            ref.current?.focus()
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-w-muted hover:text-w-text hover:bg-w-tint"
          aria-label="Xoá ô tìm"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      ) : (
        <kbd className="hidden sm:inline absolute right-3 top-1/2 -translate-y-1/2 rounded border border-w-gold/40 px-1.5 py-0.5 text-[11px] text-w-muted">
          /
        </kbd>
      )}
    </div>
  )
}

export function Highlight({ text, query }: { text: string; query: string }) {
  const pattern = highlightPattern(query)
  if (!pattern || !text) return text
  const parts = text.split(new RegExp(pattern.source, 'g'))
  if (parts.length === 1) return text
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="rounded-sm bg-amber-300 px-0.5 text-stone-900">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}
