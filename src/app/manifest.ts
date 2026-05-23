import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Questo Coffea Co.',
    short_name: 'Questo',
    description:
      'Kafe ve restoran için sipariş ve adisyon sistemi',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f1ead8',
    theme_color: '#f1ead8',
    lang: 'tr',
    categories: ['food', 'business'],
    icons: [
      {
        src: '/logo.jpg',
        sizes: 'any',
        type: 'image/jpeg',
        purpose: 'any',
      },
    ],
  };
}
