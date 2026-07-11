import type { MetadataRoute } from 'next'

const siteUrl = 'https://www.ace11plus.org'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // App, auth and API routes carry no SEO value and shouldn't consume crawl
      // budget or land in the index. Public marketing pages stay crawlable.
      disallow: [
        '/dashboard',
        '/auth/',
        '/api/',
        '/practice/',
        '/reset-password',
        '/forgot-password',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
