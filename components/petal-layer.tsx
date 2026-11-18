'use client'

import { useEffect, useRef } from 'react'

const FALLBACK = ['rgb(166, 27, 41)', 'rgb(212, 165, 116)', 'rgb(232, 200, 138)', 'rgb(196, 90, 74)', 'rgb(224, 160, 120)']

interface Leaf {
  x: number
  y: number
  size: number
  speed: number
  drift: number
  phase: number
  sway: number
  rotation: number
  spin: number
  flip: number
  alpha: number
  color: string
}

function readColors(): string[] {
  const probe = document.createElement('span')
  probe.style.cssText = 'position:absolute;left:-9999px;top:0'
  document.body.appendChild(probe)
  const keys = ['--w-btn', '--w-soft', '--w-label', '--w-line-strong', '--w-muted']
  const colors = keys.map((key) => {
    probe.style.color = `var(${key})`
    return getComputedStyle(probe).color
  })
  probe.remove()
  const usable = colors.filter((color) => color && color !== 'rgba(0, 0, 0, 0)')
  return usable.length ? usable : FALLBACK
}

function createLeaf(width: number, height: number, anywhere: boolean, colors: string[], hero: boolean): Leaf {
  return {
    x: Math.random() * width,
    y: anywhere ? 96 + Math.random() * Math.max(height - 140, 40) : -48 - Math.random() * 80,
    size: hero ? 44 + Math.random() * 18 : 30 + Math.random() * 16,
    speed: 0.08 + Math.random() * 0.14,
    drift: (Math.random() - 0.5) * 0.28,
    phase: Math.random() * Math.PI * 2,
    sway: 0.35 + Math.random() * 0.55,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.006,
    flip: Math.random() * Math.PI * 2,
    alpha: 0.55 + Math.random() * 0.25,
    color: colors[Math.floor(Math.random() * colors.length)],
  }
}

/** Lá phong 5 thùy, gốc tọa độ ở giữa lá */
function traceMaple(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath()
  ctx.moveTo(0, -s)
  ctx.bezierCurveTo(s * 0.14, -s * 0.7, s * 0.2, -s * 0.66, s * 0.24, -s * 0.5)
  ctx.bezierCurveTo(s * 0.46, -s * 0.78, s * 0.66, -s * 0.58, s * 0.56, -s * 0.34)
  ctx.bezierCurveTo(s * 0.92, -s * 0.38, s * 1.02, -s * 0.1, s * 0.78, s * 0.02)
  ctx.bezierCurveTo(s * 1.02, s * 0.2, s * 0.84, s * 0.46, s * 0.54, s * 0.36)
  ctx.bezierCurveTo(s * 0.5, s * 0.6, s * 0.22, s * 0.64, s * 0.08, s * 0.46)
  ctx.lineTo(s * 0.045, s * 0.92)
  ctx.lineTo(-s * 0.045, s * 0.92)
  ctx.lineTo(-s * 0.08, s * 0.46)
  ctx.bezierCurveTo(-s * 0.22, s * 0.64, -s * 0.5, s * 0.6, -s * 0.54, s * 0.36)
  ctx.bezierCurveTo(-s * 0.84, s * 0.46, -s * 1.02, s * 0.2, -s * 0.78, s * 0.02)
  ctx.bezierCurveTo(-s * 1.02, -s * 0.1, -s * 0.92, -s * 0.38, -s * 0.56, -s * 0.34)
  ctx.bezierCurveTo(-s * 0.66, -s * 0.58, -s * 0.46, -s * 0.78, -s * 0.24, -s * 0.5)
  ctx.bezierCurveTo(-s * 0.2, -s * 0.66, -s * 0.14, -s * 0.7, 0, -s)
  ctx.closePath()
}

function drawLeaf(ctx: CanvasRenderingContext2D, leaf: Leaf) {
  const turn = Math.sin(leaf.flip)
  const flat = 0.82 + Math.abs(turn) * 0.18
  ctx.save()
  ctx.translate(leaf.x, leaf.y)
  ctx.rotate(leaf.rotation)
  ctx.scale(flat, 1)
  ctx.globalAlpha = leaf.alpha
  traceMaple(ctx, leaf.size)
  ctx.fillStyle = leaf.color
  ctx.fill()
  ctx.globalAlpha *= 0.45
  ctx.strokeStyle = 'rgb(255 248 236)'
  ctx.lineWidth = Math.max(0.6, leaf.size * 0.045)
  ctx.beginPath()
  ctx.moveTo(0, leaf.size * 0.72)
  ctx.lineTo(0, -leaf.size * 0.2)
  ctx.stroke()
  ctx.restore()
}

/** Vài lá phong rơi chậm theo màu theme; tắt khi người dùng chọn giảm chuyển động */
export function PetalLayer({ tone = 'rose' }: { tone?: 'rose' | 'silk' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const calm = tone === 'silk'

    let width = 0
    let height = 0
    let leaves: Leaf[] = []
    let colors = readColors()
    let frame = 0
    let last = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = calm ? (width < 640 ? 2 : 3) : width < 640 ? 3 : 4
      leaves = Array.from({ length: count }, (_, i) => leaves[i] ?? createLeaf(width, height, true, colors, i === 0))
    }

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16.7, 3)
      last = now
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i]
        leaf.phase += 0.008 * dt
        leaf.flip += 0.008 * dt
        leaf.rotation += leaf.spin * dt
        leaf.y += leaf.speed * (calm ? 0.65 : 1) * dt
        leaf.x += (leaf.drift + Math.sin(leaf.phase) * leaf.sway * 0.55) * dt
        if (leaf.y > height + 48 || leaf.x < -60 || leaf.x > width + 60) {
          leaves[i] = createLeaf(width, height, false, colors, i === 0)
        }
        drawLeaf(ctx, leaves[i])
      }
      frame = requestAnimationFrame(tick)
    }

    const start = () => {
      cancelAnimationFrame(frame)
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }
    const onVisibility = () => (document.hidden ? cancelAnimationFrame(frame) : start())
    const onTheme = () => {
      colors = readColors()
      for (const leaf of leaves) leaf.color = colors[Math.floor(Math.random() * colors.length)]
    }
    const themeObserver = new MutationObserver(onTheme)

    resize()
    start()
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(frame)
      themeObserver.disconnect()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [tone])

  return <canvas ref={canvasRef} className="petal-layer" aria-hidden />
}
