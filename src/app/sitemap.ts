import type { MetadataRoute } from 'next'
import { seoGuides } from '@/lib/seo-guides'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ace11plus.org'

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = [
    '',
    '/diagnostic',
    '/guides',
    '/login',
    '/signup',
    '/pricing',
  ]

  return [
    ...publicRoutes.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency:
        path === '/guides' || path === ''
          ? ('weekly' as const)
          : ('monthly' as const),
      priority: path === '' ? 1 : path === '/guides' ? 0.9 : 0.7,
    })),
    ...seoGuides.map((guide) => ({
      url: `${siteUrl}/guides/${guide.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
