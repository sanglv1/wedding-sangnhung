/** Hiệu ứng ngắn khi mở thiệp và khi mở hộp mừng. Không dùng pháo giấy hai góc màn hình. */
import confetti from 'canvas-confetti'

/** Chùm nhỏ khi mở phong bì mừng cưới, bung tại đúng hộp quà */
export function fireGiftBurst(x: number, y: number) {
  confetti({
    origin: { x, y },
    spread: 80,
    startVelocity: 28,
    colors: ['#d4a574', '#fcd34d', '#fef3c7', '#dc2626'],
    shapes: ['circle', 'square'],
    scalar: 0.8,
    ticks: 180,
    gravity: 0.8,
    particleCount: 60,
    angle: 90,
    zIndex: 60,
    disableForReducedMotion: true,
  })
}

/** Một cánh đào: đầu khuyết, thân hẹp, để rơi như giấy mỏng chứ không như mảnh kim tuyến */
const PETAL_PATH = 'M0 12C7 7 11-4 3-16C1-19-1-19-3-16C-11-4-7 7 0 12Z'

let petalShape: confetti.Shape | null = null
function petal() {
  petalShape ??= confetti.shapeFromPath(PETAL_PATH)
  return petalShape
}

/**
 * Lúc dấu sáp tách: một hơi cánh đào từ giữa phong bì, rồi im.
 * Không bắn pháo giấy từ góc màn hình — tên khách cần đọc được ngay.
 */
export function fireOpeningCelebration(colors?: string[]) {
  const palette = colors?.length ? colors : ['#fff6e4', '#f6e3d4', '#e8c88a', '#d4a574', '#f3c1c6']
  const breath = (particleCount: number, startVelocity: number, scalar: number, drift: number) =>
    confetti({
      origin: { x: 0.5, y: 0.38 },
      angle: 90,
      spread: 78,
      startVelocity,
      gravity: 0.42,
      decay: 0.93,
      drift,
      ticks: 130,
      scalar,
      particleCount,
      colors: palette,
      shapes: [petal()],
      flat: true,
      zIndex: 120,
      disableForReducedMotion: true,
    })
  breath(18, 11, 1.25, 0.15)
  setTimeout(() => breath(10, 6, 0.9, -0.35), 140)
}
