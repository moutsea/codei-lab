import { MetadataRoute } from 'next'
import { locales } from '@/i18n/config'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.claudeide.net' // Using your actual domain

  // Define the routes we want to include (excluding dashboard and docs landing page)
  const routes = [
    '', // homepage
    '/usage'
  ]

  // Define the specific docs inner pages we want to include
  const docsRoutes = [
    '/docs/getting-started/installation',
    '/docs/getting-started/configuration',
    '/docs/getting-started/apiusage'
  ]

  // Generate sitemap entries for all locales and regular routes
  const sitemapEntries: MetadataRoute.Sitemap = []

  // Add regular routes
  routes.forEach(route => {
    locales.forEach(locale => {
      // For default locale (en), we don't include the locale prefix
      // For other locales, we include the locale prefix
      const url = locale === 'en'
        ? `${baseUrl}${route}`
        : `${baseUrl}/${locale}${route}`

      sitemapEntries.push({
        url: url,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.7,
        alternates: {
          languages: {
            en: locale === 'en' ? `${baseUrl}${route}` : `${baseUrl}/en${route}`,
            zh: `${baseUrl}/zh${route}`,
            fr: `${baseUrl}/fr${route}`
          }
        }
      })
    })
  })

  // Add docs inner pages with higher priority
  docsRoutes.forEach(route => {
    locales.forEach(locale => {
      const url = locale === 'en'
        ? `${baseUrl}${route}`
        : `${baseUrl}/${locale}${route}`

      sitemapEntries.push({
        url: url,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: {
          languages: {
            en: locale === 'en' ? `${baseUrl}${route}` : `${baseUrl}/en${route}`,
            zh: `${baseUrl}/zh${route}`,
            fr: `${baseUrl}/fr${route}`
          }
        }
      })
    })
  })

  return sitemapEntries
}