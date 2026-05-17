'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'sonner';
import { getClientAuth } from '@/lib/firebase/client';

export function GirisForm() {
  const router = useRouter();
  const params = useSearchParams();
  const geri = params.get('geri') ?? '/kasa';

  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const onGiris = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);
    try {
      const cred = await signInWithEmailAndPassword(
        getClientAuth(),
        eposta.trim(),
        sifre,
      );
      const idToken = await cred.user.getIdToken(true);

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { mesaj?: string };
        throw new Error(j.mesaj ?? 'Oturum açılamadı.');
      }

      toast.success('Hoş geldiniz.');
      router.replace(geri);
      router.refresh();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message.replace(/^Firebase:\s*/i, '')
          : 'Giriş başarısız.';
      setHata(msg);
      toast.error(msg);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <form
      onSubmit={onGiris}
      className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Kasa girişi</h1>
        <p className="text-sm text-muted-foreground">
          Personel hesabınızla oturum açın.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="eposta">
          E-posta
        </label>
        <input
          id="eposta"
          type="email"
          required
          autoComplete="email"
          value={eposta}
          onChange={(e) => setEposta(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="sifre">
          Şifre
        </label>
        <input
          id="sifre"
          type="password"
          required
          autoComplete="current-password"
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {hata && (
        <p className="text-sm text-destructive" role="alert">
          {hata}
        </p>
      )}

      <button
        type="submit"
        disabled={yukleniyor}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {yukleniyor ? 'Giriş yapılıyor…' : 'Giriş yap'}
      </button>
    </form>
  );
}
