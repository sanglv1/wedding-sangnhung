'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'
import { deleteGuestbookEntry, fetchGuestbook, type GuestbookEntry } from '@/lib/guestbook'
import { haystack, matchRank, matchesQuery, parseQuery } from '@/lib/search-text'
import { Highlight } from './search-box'
import { BTN, BTN_DANGER, dateFormatter, errorText } from './shared'

export function GuestbookPanel({ password, query }: { password: string; query: string }) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const refresh = useCallback(
    () =>
      fetchGuestbook()
        .then(setEntries)
        .catch((err) => setError(errorText(err)))
        .finally(() => setLoading(false)),
    [],
  )
  const load = () => {
    setLoading(true)
    setError('')
    refresh()
  }

  useEffect(() => {
    refresh()
  }, [refresh])

  const parsed = useMemo(() => parseQuery(query), [query])
  const shown = useMemo(() => {
    const indexed = entries.map((entry) => ({
      entry,
      nameFold: haystack(entry.name, []).text,
      search: haystack([entry.name, entry.message].join(' '), []),
    }))
    const hits = indexed.filter((row) => matchesQuery(parsed, row.search))
    if (!parsed) return hits.map((row) => row.entry)
    return hits
      .map((row, index) => ({ ...row, index, rank: matchRank(row.nameFold, '', parsed) }))
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map((row) => row.entry)
  }, [entries, parsed])

  const remove = async (entry: GuestbookEntry) => {
    if (!entry.id) return
    if (!window.confirm(`Xoá lời chúc của "${entry.name}"?`)) return
    setDeletingId(entry.id)
    setError('')
    try {
      await deleteGuestbookEntry(entry.id, password)
      setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    } catch (err) {
      setError(errorText(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-w-muted">
          {parsed && !loading ? `${shown.length} lời chúc khớp “${parsed.raw}”` : `${entries.length} lời chúc`}
          {' · '}Xoá xong khách tải lại trang thiệp là không còn thấy.
        </p>
        <button type="button" onClick={load} disabled={loading} className={BTN}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          Tải lại
        </button>
      </div>

      {error && (
        <p className="error-wedding mb-4" role="alert">
          {error}
        </p>
      )}
      {!loading && shown.length === 0 && !error && (
        <p className="card-wedding rounded-2xl p-8 text-center text-w-muted">
          {parsed ? `Không thấy lời chúc khớp “${parsed.raw}”.` : 'Chưa có lời chúc nào.'}
        </p>
      )}

      <ul className="space-y-3">
        {shown.map((entry, i) => (
          <li key={entry.id ?? i} className="card-wedding rounded-2xl p-4 sm:p-5 flex gap-4 items-start">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-w-strong break-words">
                <Highlight text={entry.name} query={query} />
              </p>
              <p className="text-xs text-w-muted mb-2">{dateFormatter.format(new Date(entry.createdAt))}</p>
              <p className="text-w-text whitespace-pre-line break-words">
                <Highlight text={entry.message} query={query} />
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(entry)}
              disabled={!entry.id || deletingId === entry.id}
              aria-label={`Xoá lời chúc của ${entry.name}`}
              className={`shrink-0 ${BTN_DANGER}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden />
              <span className="hidden sm:inline">{deletingId === entry.id ? 'Đang xoá...' : 'Xoá'}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
