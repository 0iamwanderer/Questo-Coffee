'use client';

import { useEffect } from 'react';
import { emulatorOrtami } from '@/lib/utils/ortam';

export function SwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Yerel/emülatör POS: service worker kaydetme. (Uygulama hız için
    // production modunda çalışsa da yereldir; SW bayat içerik gösterebilir.)
    // Önceki üretim-modu çalıştırmalarından kalan kayıtları da temizle.
    if (emulatorOrtami()) {
      navigator.serviceWorker
        .getRegistrations()
        .then((rs) => rs.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch((e) => {
      console.warn('[questo] Service worker kayıt başarısız:', e);
    });
  }, []);

  return null;
}
