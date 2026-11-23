/**
 * Các theme màu nền cho trang cưới (bảng màu khai báo trong app/globals.css)
 * Thổ (Earth), Mộc (Wood) - Ngũ hành
 */
export const THEMES = {
  red: { name: 'Hồng đào', swatch: '#f8e5e2' },
  green: { name: 'Xanh xô thơm', swatch: '#e9eee2' },
  pink: { name: 'Hồng phấn', swatch: '#fae8ec' },
  white: { name: 'Trắng ngà', swatch: '#f8f5ef' },
  tho: { name: 'Mệnh Thổ', swatch: '#f5ead6' },
  moc: { name: 'Mệnh Mộc', swatch: '#e1efe9' },
  bordeaux: { name: 'Đỏ rượu vang', swatch: '#420a10' },
  dem: { name: 'Đêm vàng', swatch: '#14110c' },
  bien: { name: 'Biển cát', swatch: '#e5f4f7' },
  han: { name: 'Nét Hàn', swatch: '#eef0f2' },
  kinh: { name: 'Kính mờ', swatch: '#e7eef6' },
  vang: { name: 'Son vàng', swatch: '#f6f0e4' },
  nga: { name: 'Nhà thờ', swatch: '#f7f3ea' },
  oliu: { name: 'Lá oliu', swatch: '#e8ecdf' },
  suong: { name: 'Sương sớm', swatch: '#eef0f4' },
  man: { name: 'Mận chín', swatch: '#f3e8ee' },
  dao: { name: 'Đào tiên', swatch: '#fbe8df' },
  son: { name: 'Son hỷ', swatch: '#f6d5d0' },
  muc: { name: 'Mực tàu', swatch: '#f3efe4' },
  sao: { name: 'Đêm sao', swatch: '#070b16' },
  nhung: { name: 'Nhung đỏ', swatch: '#14080e' },
  gach: { name: 'Gạch bông', swatch: '#ece8f4' },
  lac: { name: 'Cung đình', swatch: '#2a0810' },
  song: { name: 'Sóng nhẹ', swatch: '#d7eef2' },
  long: { name: 'Đèn lồng', swatch: '#0c1410' },
  bao: { name: 'Báo xuân', swatch: '#efeae0' },
  so: { name: 'Sổ tay', swatch: '#f7f1e4' },
  betong: { name: 'Kính mảnh', swatch: '#e7e5e4' },
  lua: { name: 'Lụa sáng', swatch: '#f6ebe6' },
} as const

export type ThemeId = keyof typeof THEMES

export const DEFAULT_THEME: ThemeId = 'bordeaux'
export const THEME_STORAGE_KEY = 'wedding-theme'
export const THEME_ORDER = Object.keys(THEMES) as ThemeId[]
/** Tạm đóng nút đổi màu. Bật lại thì khách chọn màu được như trước. */
export const THEME_SWITCH_ENABLED = false

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && value in THEMES
}

/** Chạy trước khi trang hiển thị để không bị nháy theme mặc định. Tắt công tắc thì bỏ màu đã lưu trên máy khách. */
export const THEME_INIT_SCRIPT = THEME_SWITCH_ENABLED
  ? `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t&&${JSON.stringify(
      THEME_ORDER,
    )}.indexOf(t)>-1)document.documentElement.dataset.theme=t}catch(e){}`
  : `try{document.documentElement.dataset.theme='${DEFAULT_THEME}'}catch(e){}`
