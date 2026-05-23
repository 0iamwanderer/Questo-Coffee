// Questo Service Worker — minimal
// PWA "ana ekrana ekle" özelliği için install + activate olayları yeterli.
// Offline cache stratejisi şimdilik yok — tüm istekler ağa gider.

const SURUM = 'questo-v1';

self.addEventListener('install', (event) => {
  // Yeni SW'i hemen aktif et, eskiyi bekletme
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Tüm açık sayfaları yeni SW'in altına al
  event.waitUntil(self.clients.claim());
});

// fetch listener şimdilik yok — boş bir listener SW aktivasyon maliyeti yaratır
// ama hiçbir iş yapmaz. Offline cache eklenirse (stale-while-revalidate menü
// için, network-only sipariş için) buraya tanımlayabilirsin.
