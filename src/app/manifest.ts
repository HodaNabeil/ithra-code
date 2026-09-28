import type { MetadataRoute } from 'next';

const ITHRACODE_BRAND_ORANGE = '#E6682D';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ithra Code',
    short_name: 'Ithra Code',
    description:
      'Ithra Code — practical programming education and real-world web development skills.',
    start_url: '/',
    display: 'standalone',
    theme_color: ITHRACODE_BRAND_ORANGE,
    background_color: '#ffffff',
    icons: [
      {
        src: '/favicon/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
