'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BACKGROUND_MUSIC } from '@/lib/music'

export const WEDDING_OPEN_EVENT = 'wedding-open'

type Music = { playlist: string[]; volume: number }

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext }

function isSameOrigin(src: string) {
  try {
    return new URL(src, window.location.href).origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * iOS Safari bỏ qua audio.volume nên phải chỉnh âm lượng bằng GainNode.
 * Nhạc khác domain không có CORS sẽ bị Web Audio tắt tiếng, nên trường hợp đó dùng audio.volume.
 */
function createGain(audio: HTMLAudioElement, playlist: string[]) {
  const Ctx = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext
  if (!Ctx || !playlist.every(isSameOrigin)) return null
  try {
    const context = new Ctx()
    const gain = context.createGain()
    context.createMediaElementSource(audio).connect(gain).connect(context.destination)
    return { context, gain }
  } catch {
    return null
  }
}

/**
 * Chỉ tạo và tải file nhạc khi khách mở thiệp hoặc bấm nút nhạc,
 * để lần tải trang đầu tiên không phải tải vài MB âm thanh.
 */
export function useBackgroundMusic(music: Music = BACKGROUND_MUSIC) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackRef = useRef(0)
  const failedRef = useRef(new Set<number>())
  const pausedByVisibilityRef = useRef(false)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const gainRef = useRef<ReturnType<typeof createGain>>(null)
  const musicRef = useRef(music)
  useEffect(() => {
    musicRef.current = music
  }, [music])

  const setVolume = useCallback((value: number) => {
    const gain = gainRef.current?.gain
    if (gain) gain.gain.value = value
    else if (audioRef.current) audioRef.current.volume = value
  }, [])

  /** AudioContext bị treo khi tạo ngoài thao tác bấm hoặc khi iOS đưa trang xuống nền */
  const start = useCallback((audio: HTMLAudioElement) => {
    const context = gainRef.current?.context
    if (context?.state === 'suspended') context.resume().catch(() => {})
    audio.play().catch(() => {})
  }, [])

  const getAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current
    const { playlist, volume } = musicRef.current
    if (playlist.length === 0) return null

    const audio = new Audio(playlist[0])
    audio.loop = playlist.length === 1
    audio.preload = 'metadata'
    audioRef.current = audio
    gainRef.current = createGain(audio, playlist)
    setVolume(volume)

    const playTrack = (index: number) => {
      trackRef.current = index
      audio.src = playlist[index]
      start(audio)
    }
    const nextPlayable = () => {
      for (let step = 1; step <= playlist.length; step++) {
        const index = (trackRef.current + step) % playlist.length
        if (!failedRef.current.has(index)) return index
      }
      return null
    }

    audio.addEventListener('play', () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))
    audio.addEventListener('ended', () => {
      const next = nextPlayable()
      if (next !== null) playTrack(next)
    })
    audio.addEventListener('error', () => {
      failedRef.current.add(trackRef.current)
      setIsPlaying(false)
      const next = nextPlayable()
      if (next !== null) playTrack(next)
    })

    return audio
  }, [setVolume, start])

  const play = useCallback(() => {
    const audio = getAudio()
    if (audio) start(audio)
  }, [getAudio, start])

  /**
   * Bắt đầu phát (tắt tiếng) ngay trong thao tác bấm để trình duyệt cho phép,
   * rồi sau delayMs mới bật tiếng và tăng dần âm lượng
   */
  const playAfter = useCallback(
    (delayMs: number) => {
      const audio = getAudio()
      if (!audio) return
      const target = musicRef.current.volume
      if (gainRef.current) setVolume(0)
      else audio.muted = true
      start(audio)
      clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = setTimeout(() => {
        fadeTimerRef.current = undefined
        setVolume(0)
        audio.muted = false
        const begin = performance.now()
        const FADE_MS = 3000
        const step = (now: number) => {
          const t = Math.min((now - begin) / FADE_MS, 1)
          setVolume(target * t)
          if (t < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }, delayMs)
    },
    [getAudio, setVolume, start],
  )

  const toggle = useCallback(() => {
    const audio = getAudio()
    if (!audio) return
    if (audio.paused) start(audio)
    else audio.pause()
  }, [getAudio, start])

  useEffect(() => {
    const onOpen = (e: Event) => {
      const delayMs = (e as CustomEvent<{ delayMs?: number }>).detail?.delayMs
      if (delayMs) playAfter(delayMs)
      else play()
    }
    window.addEventListener(WEDDING_OPEN_EVENT, onOpen)

    const onVisibilityChange = () => {
      const audio = audioRef.current
      if (!audio) return
      if (document.hidden && !audio.paused) {
        pausedByVisibilityRef.current = true
        audio.pause()
      } else if (!document.hidden && pausedByVisibilityRef.current) {
        pausedByVisibilityRef.current = false
        start(audio)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener(WEDDING_OPEN_EVENT, onOpen)
      clearTimeout(fadeTimerRef.current)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      audioRef.current?.pause()
      audioRef.current = null
      gainRef.current?.context.close().catch(() => {})
      gainRef.current = null
    }
  }, [play, playAfter, start])

  return { isPlaying, toggle }
}
