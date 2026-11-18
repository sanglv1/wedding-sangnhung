import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { AdminEditor } from '@/components/admin/admin-editor'
import { isAdminAllowed } from '@/lib/admin-guard'
import { getLiveContent } from '@/lib/live-content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Quản trị thiệp cưới',
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const hosted = process.env.NODE_ENV === 'production'
  if (!hosted && !isAdminAllowed((await headers()).get('host'))) notFound()

  const content = await getLiveContent()
  return <AdminEditor initial={content} requirePassword={hosted} />
}
