'use client';

import { signInWithCustomToken } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase/client';

// Tek noktadan otomatik giriş: server'dan özel token al, client'ta oturum aç,
// server-side session cookie kur. /kasa/giris sayfası ve kasa/admin shell'leri
// kullanıcı oturumu yokken aynı akışı çağırır.
export async function otoGirisYap(): Promise<void> {
  const tokenRes = await fetch('/api/auth/oto-giris', { method: 'POST' });
  if (!tokenRes.ok) {
    const j = (await tokenRes.json().catch(() => ({}))) as { mesaj?: string };
    throw new Error(j.mesaj ?? 'Otomatik giriş başlatılamadı.');
  }
  const { customToken } = (await tokenRes.json()) as { customToken: string };

  const cred = await signInWithCustomToken(getClientAuth(), customToken);
  const idToken = await cred.user.getIdToken(true);

  const sessionRes = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!sessionRes.ok) {
    const j = (await sessionRes.json().catch(() => ({}))) as { mesaj?: string };
    throw new Error(j.mesaj ?? 'Oturum oluşturulamadı.');
  }
}
