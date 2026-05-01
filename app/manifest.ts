import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VaultX — Money Tracker',
    short_name: 'VaultX',
    description: 'Personal money tracking app',
    start_url: '/lock',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    categories: ['finance', 'productivity'],
    shortcuts: [
      { name: 'Add Invoice', short_name: 'Add', url: '/add', icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }] },
      { name: 'Dashboard', short_name: 'Home', url: '/', icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }] },
    ],
  };
}
