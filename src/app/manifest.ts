import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Questo — QR Sipariş',
    short_name: 'Questo',
    description:
      'Kafe ve restoran için QR kodlu sipariş ve adisyon sistemi',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f3e8',
    theme_color: '#f7f3e8',
    lang: 'tr',
    categories: ['food', 'business'],
  };
}
