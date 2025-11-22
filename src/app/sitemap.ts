import { MetadataRoute } from 'next'
import { locales } from '@/i18n/config'

const BASE_URL = 'https://www.codeilab.com'

const coreRoutes = ['', '/usage']
const docsRoutes = [
  '/docs/getting-started/installation',
  '/docs/getting-started/configuration',
  '/docs/getting-started/apiusage'
]

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  const addEntry = (route: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']) => {
    locales.forEach(locale => {
      const localizedPath = locale === 'en' ? route : `/${locale}${route}`
      const url = `${BASE_URL}${localizedPath}`

      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages: locales.reduce((acc, lang) => {
            const langPath = lang === 'en' ? route : `/${lang}${route}`
            acc[lang] = `${BASE_URL}${langPath}`
            return acc
          }, {} as Record<string, string>)
        }
      })
    })
  }

  coreRoutes.forEach(route => addEntry(route, route === '' ? 1 : 0.7, 'weekly'))
  docsRoutes.forEach(route => addEntry(route, 0.8, 'monthly'))

  return entries
}
