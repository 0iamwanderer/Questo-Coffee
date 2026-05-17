'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { sesKilitAc } from '@/lib/ses/audio-unlock';

const KEY = 'questo-vardiya-aktif';

export function VardiyaBaslat() {
  const [acik, setAcik] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(KEY) === '1') return;
    setAcik(true);
  }, []);

  if (!acik) return null;

  const basla = async () => {
    await sesKilitAc();
    sessionStorage.setItem(KEY, '1');
    setAcik(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur"
    >
      <div className="max-w-sm w-full space-y-4 rounded-lg border bg-card p-6 text-center shadow-lg">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Bell className="size-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Vardiyayı başlat</h2>
          <p className="text-sm text-muted-foreground">
            Yeni sipariş bildirimini sesli alabilmek için aşağıdaki düğmeye
            dokunun. Bu, tarayıcının ses iznini etkinleştirir.
          </p>
        </div>
        <button
          type="button"
          onClick={basla}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Vardiyayı başlat
        </button>
      </div>
    </div>
  );
}
