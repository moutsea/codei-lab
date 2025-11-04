import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Claude-ide',
        short_name: 'Claude-ide',
        description: 'Claude-ide — Affordable AI coding assistant in your IDE.',
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
