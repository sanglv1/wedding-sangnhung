import type { WeddingModel } from '@/lib/wedding-model'

function House({ ong, ba, address }: { ong: string; ba: string; address: string }) {
  if (!ong && !ba) return null
  return (
    <div className="min-w-0 px-1 text-center">
      <p className="text-[0.72rem] tracking-[0.16em] text-[#8a6a3b]">Ông Bà</p>
      {ong && <p className="mt-1 text-[0.85rem] font-medium leading-snug invite-date sm:text-[0.95rem]">{ong}</p>}
      {ba && <p className="text-[0.85rem] font-medium leading-snug invite-date sm:text-[0.95rem]">{ba}</p>}
      {address && <p className="mt-1.5 text-[0.68rem] leading-snug invite-muted sm:text-xs">{address}</p>}
    </div>
  )
}

/** Hai nhà trên tờ báo hỷ: Ông Bà, tên xếp giữa, địa chỉ dưới, ngăn bằng một vạch. */
export function ParentsOnCard({ model }: { model: WeddingModel }) {
  const { family, familyAddresses } = model
  const groom = Boolean(family.nhaTrai.ong || family.nhaTrai.ba)
  const bride = Boolean(family.nhaGai.ong || family.nhaGai.ba)
  if (!groom && !bride) return null

  return (
    <div className={`mt-4 grid w-full items-stretch ${groom && bride ? 'grid-cols-[1fr_auto_1fr] gap-x-3' : 'grid-cols-1'}`}>
      {groom && <House ong={family.nhaTrai.ong} ba={family.nhaTrai.ba} address={familyAddresses.groomFamily.address} />}
      {groom && bride && <span className="w-px self-stretch bg-[#b08440]" aria-hidden />}
      {bride && <House ong={family.nhaGai.ong} ba={family.nhaGai.ba} address={familyAddresses.brideFamily.address} />}
    </div>
  )
}
