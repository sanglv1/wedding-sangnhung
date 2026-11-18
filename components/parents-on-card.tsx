import { PeachBlossom } from '@/components/invitation-ornaments'
import type { WeddingModel } from '@/lib/wedding-model'

function addressLines(address: string) {
  return address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function House({
  side,
  ong,
  ba,
  lines,
  rows,
}: {
  side: string
  ong: string
  ba: string
  lines: string[]
  rows: number
}) {
  return (
    <div className="flex min-w-0 flex-col items-center px-0.5 text-center">
      <p className="text-[0.62rem] uppercase tracking-[0.22em] text-w-muted sm:text-[0.68rem]">{side}</p>
      <p className="mt-2 text-[0.68rem] tracking-[0.16em] text-w-muted">Ông Bà</p>
      <div className="mt-1.5 flex min-h-[2.7rem] flex-col justify-center">
        {ong && <p className="text-[0.8rem] font-medium leading-snug invite-date sm:text-[0.92rem]">{ong}</p>}
        {ba && <p className="text-[0.8rem] font-medium leading-snug invite-date sm:text-[0.92rem]">{ba}</p>}
      </div>
      <p className="mt-2.5 text-[0.68rem] leading-[1.45] invite-muted sm:text-[0.72rem]">
        {Array.from({ length: rows }, (_, index) => (
          <span key={index} className="block min-h-[1.45em]">
            {lines[index] ?? ''}
          </span>
        ))}
      </p>
    </div>
  )
}

/** Hai nhà đối xứng: cùng số dòng tên và địa chỉ, ngăn bằng một trục giữa. */
export function ParentsOnCard({ model }: { model: WeddingModel }) {
  const { family, familyAddresses } = model
  const groom = Boolean(family.nhaTrai.ong || family.nhaTrai.ba)
  const bride = Boolean(family.nhaGai.ong || family.nhaGai.ba)
  if (!groom && !bride) return null

  const groomLines = addressLines(familyAddresses.groomFamily.address)
  const brideLines = addressLines(familyAddresses.brideFamily.address)
  const rows = Math.max(groomLines.length, brideLines.length, 1)

  return (
    <div className={`grid w-full items-stretch ${groom && bride ? 'grid-cols-[1fr_auto_1fr] gap-x-2 sm:gap-x-3' : 'grid-cols-1'}`}>
      {groom && (
        <House side="Nhà trai" ong={family.nhaTrai.ong} ba={family.nhaTrai.ba} lines={groomLines} rows={rows} />
      )}
      {groom && bride && (
        <div className="flex flex-col items-center self-stretch py-1" aria-hidden>
          <span className="w-px flex-1 bg-w-line" />
          <PeachBlossom className="my-1.5 h-3.5 w-3.5 text-w-line-strong" />
          <span className="w-px flex-1 bg-w-line" />
        </div>
      )}
      {bride && (
        <House side="Nhà gái" ong={family.nhaGai.ong} ba={family.nhaGai.ba} lines={brideLines} rows={rows} />
      )}
    </div>
  )
}
