import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Code I Lab',
        short_name: 'Code I',
        description: 'Code I Lab delivers Codex-level AI coding assistance at www.codeilab.com for a fraction of the cost.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png'
            }
        ]
    }
}
