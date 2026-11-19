/** Một nét mảnh quanh mỗi phần. Khung kép và hoa góc chỉ dành cho tấm thiệp đầu trang. */
export function SectionFrame({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`section-frame ${className}`}>
      <div className="section-frame-inner">{children}</div>
    </div>
  )
}
