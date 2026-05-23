'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function AdisyonYenile() {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const yenile = () => {
    setYukleniyor(true);
    router.refresh();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setYukleniyor(false);
      timerRef.current = null;
    }, 800);
  };

  return (
    <button
      type="button"
      onClick={yenile}
      disabled={yukleniyor}
      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-soft transition active:scale-95 disabled:opacity-50"
      aria-label="Yenile"
    >
      <RefreshCw
        className={`size-3.5 ${yukleniyor ? 'animate-spin' : ''}`}
      />
      Yenile
    </button>
  );
}
