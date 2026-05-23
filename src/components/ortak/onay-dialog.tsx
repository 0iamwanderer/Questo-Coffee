'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface OnayIstegi {
  baslik: string;
  mesaj?: string;
  onayEtiket?: string;
  iptalEtiket?: string;
  tehlikeli?: boolean;
}

interface DialogDurum extends OnayIstegi {
  acik: boolean;
  cozumle: (sonuc: boolean) => void;
}

type OnayFn = (istek: OnayIstegi) => Promise<boolean>;

const OnayContext = createContext<OnayFn | null>(null);

/**
 * window.confirm yerine kullanılacak provider — uygulamayı sarmalla,
 * sonra useOnay() hook'u ile `const onay = useOnay(); if (await onay({...})) {...}`
 * pattern'ı kullan.
 */
export function OnayProvider({ children }: { children: React.ReactNode }) {
  const [durum, setDurum] = useState<DialogDurum | null>(null);
  const onayRef = useRef<HTMLButtonElement>(null);

  const onay: OnayFn = useCallback(
    (istek) =>
      new Promise<boolean>((cozumle) => {
        setDurum({
          ...istek,
          acik: true,
          cozumle: (sonuc) => {
            setDurum(null);
            cozumle(sonuc);
          },
        });
        // Focus default action (cancel) after render
        setTimeout(() => onayRef.current?.focus(), 50);
      }),
    [],
  );

  return (
    <OnayContext.Provider value={onay}>
      {children}
      {durum?.acik && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onay-baslik"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 anim-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) durum.cozumle(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') durum.cozumle(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-lg space-y-4 anim-rise">
            <div className="flex items-start gap-3">
              {durum.tehlikeli && (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="size-5 text-destructive" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2
                  id="onay-baslik"
                  className="font-serif text-lg leading-tight"
                >
                  {durum.baslik}
                </h2>
                {durum.mesaj && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {durum.mesaj}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                ref={onayRef}
                type="button"
                onClick={() => durum.cozumle(false)}
                className="flex-1 rounded-md border bg-card px-3 py-2 text-sm font-medium transition active:scale-[0.98]"
              >
                {durum.iptalEtiket ?? 'Vazgeç'}
              </button>
              <button
                type="button"
                onClick={() => durum.cozumle(true)}
                className={
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium text-white transition active:scale-[0.98] ' +
                  (durum.tehlikeli
                    ? 'bg-destructive'
                    : 'bg-primary')
                }
              >
                {durum.onayEtiket ?? 'Tamam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </OnayContext.Provider>
  );
}

export function useOnay(): OnayFn {
  const ctx = useContext(OnayContext);
  if (!ctx) {
    // Provider yoksa fallback olarak native confirm — uygulamayı kırmayalım
    return (istek) =>
      Promise.resolve(
        window.confirm(`${istek.baslik}${istek.mesaj ? `\n\n${istek.mesaj}` : ''}`),
      );
  }
  return ctx;
}
