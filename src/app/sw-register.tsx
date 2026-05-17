'use client';

import { useEffect } from 'react';

export function SwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Dev'de HMR ile çakışmasın
    if (process.env.NODE_ENV !== 'production') return;
    navigator.serviceWorker.register('/sw.js').catch((e) => {
      console.warn('[questo] Service worker kayıt başarısız:', e);
    });
  }, []);

  return null;
}
