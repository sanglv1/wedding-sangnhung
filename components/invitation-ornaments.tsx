/**
 * Bộ hoạ tiết khắc của thiệp: một cành đào năm cánh.
 * Cánh có khuyết ở đầu, nhụy giữa, lá nằm dọc đường kẻ — cùng một nét cho góc, vạch ngăn và chữ song hỷ.
 */

const PETAL =
  'M0 2.4C-2.4.6-6.2-2.8-6.1-7.4-6-10.6-2.8-13.1-.8-11.1-.3-12.2.3-12.2.8-11.1 2.8-13.1 6-10.6 6.1-7.4 6.2-2.8 2.4.6 0 2.4Z'

const PETAL_TURNS = [0, 72, 144, 216, 288]

function BlossomMark({ leaves = false }: { leaves?: boolean }) {
  return (
    <g fill="currentColor" stroke="currentColor" strokeLinejoin="round">
      {PETAL_TURNS.map((turn) => (
        <path key={turn} d={PETAL} transform={`rotate(${turn})`} fillOpacity="0.16" strokeWidth="1.15" />
      ))}
      {PETAL_TURNS.map((turn) => (
        <line
          key={`stamen-${turn}`}
          x1="0"
          y1="-1.4"
          x2="0"
          y2="-4.4"
          transform={`rotate(${turn + 36})`}
          strokeWidth="0.6"
          fill="none"
        />
      ))}
      <circle r="1.55" stroke="none" />
      {leaves && (
        <g fillOpacity="0.2" strokeWidth="1">
          <path d="M-1.5 9C-8 12-15 9-17 4.5-11 7-6 7-1.5 9Z" />
          <path d="M1.5 9C8 12 15 9 17 4.5 11 7 6 7 1.5 9Z" />
        </g>
      )}
    </g>
  )
}

export function PeachBlossom({ className = '', leaves = false }: { className?: string; leaves?: boolean }) {
  return (
    <svg viewBox={leaves ? '-20 -16 40 40' : '-16 -16 32 32'} className={className} aria-hidden>
      <BlossomMark leaves={leaves} />
    </svg>
  )
}

const CORNER_ROTATION = {
  'top-left': 'rotate-0',
  'top-right': 'rotate-90',
  'bottom-right': 'rotate-180',
  'bottom-left': '-rotate-90',
} as const

const CORNER_POSITION = {
  'top-left': 'top-1.5 left-1.5',
  'top-right': 'top-1.5 right-1.5',
  'bottom-right': 'bottom-1.5 right-1.5',
  'bottom-left': 'bottom-1.5 left-1.5',
} as const

export function CornerOrnament({ position }: { position: keyof typeof CORNER_ROTATION }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={`invite-corner absolute ${CORNER_POSITION[position]} ${CORNER_ROTATION[position]}`}
      aria-hidden
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M5 64V16C5 10 10 5 16 5h48" strokeWidth="1.25" />
        <path d="M11 52V20c0-5 4-9 9-9h32" strokeWidth="0.8" opacity="0.55" />
        <path d="M28 46c-8 3-16 12-12 20 7-4 14-12 12-20Z" fill="currentColor" fillOpacity="0.16" strokeWidth="0.9" />
        <path d="M22 58c2-4 6-8 8-12" strokeWidth="0.6" opacity="0.8" />
        <path d="M62 11c2-5 8-7 12-4-3 4-8 6-12 4Z" fill="currentColor" fillOpacity="0.2" strokeWidth="0.8" />
      </g>
      <g transform="translate(34 34) scale(0.72)">
        <BlossomMark />
      </g>
      <g fill="currentColor">
        <circle cx="5" cy="68" r="1.35" />
        <circle cx="68" cy="5" r="1.35" />
      </g>
    </svg>
  )
}

export function OrnamentDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`ornament-divider flex justify-center ${className}`} aria-hidden>
      <svg viewBox="0 0 228 40" className="h-8 w-48 sm:w-56">
        <g fill="none" stroke="currentColor" strokeLinecap="round">
          <path d="M6 20h72" strokeWidth="0.9" />
          <path d="M150 20h72" strokeWidth="0.9" />
          <path d="M74 20c12-8 22-8 32 0" strokeWidth="0.8" opacity="0.7" />
          <path d="M122 20c10-8 20-8 32 0" strokeWidth="0.8" opacity="0.7" />
        </g>
        <g transform="translate(114 18) scale(0.62)">
          <BlossomMark leaves />
        </g>
      </svg>
    </div>
  )
}

/** Song hỷ vẽ bằng nét khối, không phụ thuộc font hệ thống có chữ 囍 hay không */
export function SongHy({ className = '' }: { className?: string }) {
  const hy =
    'M1 0H31V3.1H1ZM13.4 3.1H18.6V8H13.4ZM4.5 8H27.5V10.8H4.5ZM6 12H26V20.2H6ZM9.2 14.2H22.8V18H9.2ZM6 21.2H26V29.6H6ZM9.2 23.4H22.8V27.4H9.2ZM2.4 30.8H29.6V34H2.4Z'
  return (
    <svg viewBox="0 0 74 36" className={className} aria-hidden>
      <path fill="currentColor" fillRule="evenodd" d={hy} />
      <path fill="currentColor" fillRule="evenodd" d={hy} transform="translate(42 0)" />
    </svg>
  )
}
