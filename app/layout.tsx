import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro, Great_Vibes } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CONTENT } from '@/lib/content'
import { getLiveContent } from '@/lib/live-content'
import { DEFAULT_THEME, isThemeId, THEME_INIT_SCRIPT, THEMES } from '@/lib/themes'
import './globals.css'

const fileTheme = isThemeId(CONTENT.theme) ? CONTENT.theme : DEFAULT_THEME

const bodyFont = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
  display: 'swap',
})
const scriptFont = Great_Vibes({
  weight: '400',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-script',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const TITLE = 'Thiệp cưới Lương Sáng & Trần Nhung'
const DESCRIPTION = 'Trân trọng báo tin lễ thành hôn của Lương Sáng và Trần Nhung.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'Lương Sáng & Trần Nhung',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: THEMES[fileTheme].swatch,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const content = await getLiveContent()
  const siteTheme = isThemeId(content.theme) ? content.theme : DEFAULT_THEME
  return (
    <html
      lang="vi"
      className={`${bodyFont.variable} ${scriptFont.variable}`}
      data-theme={siteTheme}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content={THEMES[siteTheme].swatch} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
