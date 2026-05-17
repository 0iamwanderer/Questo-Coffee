'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Bell, Minus, Plus, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Urun } from '@/types/model';
import { formatTL } from '@/lib/utils/para';
import { useSepet } from '@/stores/sepet';
import { cn } from '@/lib/utils';

interface Props {
  urun: Urun | null;
  acik: boolean;
  onKapat: () => void;
  masaToken?: string;
}

function DetayGorseli({ urun }: { urun: Urun }) {
  if (urun.gorselUrl) {
    return (
      <Image
        src={urun.gorselUrl}
        alt={urun.ad}
        fill
        sizes="(max-width: 480px) 100vw, 480px"
        className="object-cover"
      />
    );
  }
  const harf = urun.ad.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className="flex h-full w-full items-center justify-center font-serif text-7xl text-primary/60"
      style={{
        background:
          'radial-gradient(60% 50% at 50% 35%, hsl(var(--accent)) 0%, hsl(var(--secondary)) 100%)',
      }}
    >
      {harf}
    </div>
  );
}

export function UrunDetaySheet({ urun, acik, onKapat, masaToken }: Props) {
  const [render, setRender] = useState(acik);
  const [kapaniyor, setKapaniyor] = useState(false);
  const [sefNotuAcik, setSefNotuAcik] = useState(false);

  const ekle = useSepet((s) => s.ekle);
  const adetGetir = useSepet((s) => s.adetGetir);
  const guncelle = useSepet((s) => s.guncelle);

  useEffect(() => {
    if (acik) {
      setRender(true);
      setKapaniyor(false);
      setSefNotuAcik(false);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [acik]);

  if (!render || !urun) return null;

  const adet = adetGetir(urun.id);
  const stokYok = !urun.stoktaMi;

  const kapat = () => {
    setKapaniyor(true);
    setTimeout(() => {
      setRender(false);
      setKapaniyor(false);
      onKapat();
    }, 240);
  };

  const garsonuCagir = async () => {
    if (!masaToken) {
      toast.info('Bu sayfada garson çağrısı kullanılamıyor.');
      return;
    }
    try {
      const res = await fetch('/api/garson-cagir', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ masaToken, urunId: urun.id }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { mesaj?: string };
        throw new Error(j.mesaj ?? 'Çağrı gönderilemedi.');
      }
      toast.success('Garson çağrıldı.');
      kapat();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Çağrı gönderilemedi.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={urun.ad}
      className="fixed inset-0 z-40 flex items-end justify-center"
    >
      <button
        type="button"
        onClick={kapat}
        aria-label="Kapat"
        className={cn(
          'absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity',
          kapaniyor ? 'opacity-0' : 'opacity-100',
        )}
        style={{ transitionDuration: kapaniyor ? '240ms' : '380ms' }}
      />

      <div
        className={cn(
          'relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-card shadow-floating',
          kapaniyor ? 'anim-sheet-out' : 'anim-sheet-in',
        )}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 flex items-center justify-center bg-card/95 pt-3 pb-1 backdrop-blur">
          <div className="h-1.5 w-10 rounded-full bg-foreground/15" />
        </div>

        {/* Görsel */}
        <div className="relative h-56 w-full overflow-hidden bg-muted/40">
          <DetayGorseli urun={urun} />
          <button
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur transition active:scale-90"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-6 pt-3">
          {/* Rozetler */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-accent px-2.5 py-1 micro-caps text-accent-foreground">
              Günlük taze
            </span>
            <span className="rounded-full border px-2.5 py-1 micro-caps text-muted-foreground">
              KDV dahil
            </span>
            {stokYok && (
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 micro-caps text-destructive">
                Stokta yok
              </span>
            )}
          </div>

          {/* Başlık + fiyat */}
          <header className="flex items-start justify-between gap-4">
            <h2 className="font-serif text-3xl leading-tight">{urun.ad}</h2>
            <div className="text-right">
              <div className="font-serif text-2xl leading-none tabular-nums">
                {formatTL(urun.fiyatKurus)}
              </div>
            </div>
          </header>

          {/* Açıklama */}
          {urun.aciklama && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {urun.aciklama}
            </p>
          )}

          {sefNotuAcik && urun.aciklama && (
            <div className="rounded-2xl border bg-accent/40 px-4 py-3 text-sm leading-relaxed text-accent-foreground">
              <p className="micro-caps mb-1 text-muted-foreground">
                Şefin notu
              </p>
              {urun.aciklama}
            </div>
          )}

          {/* Çift buton: Şefin notu + Garsonu Çağır */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setSefNotuAcik((v) => !v)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border bg-background px-4 py-3 text-sm font-medium transition active:scale-[0.98]"
            >
              <Sparkles className="size-4" />
              Şefin notu
            </button>
            <button
              type="button"
              onClick={garsonuCagir}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background transition active:scale-[0.98]"
            >
              <Bell className="size-4" />
              Garsonu çağır
            </button>
          </div>

          {/* Adet & sepete ekle */}
          {!stokYok && (
            <div className="flex items-center gap-3 pt-1">
              {adet === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    ekle(urun.id);
                    kapat();
                  }}
                  className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft transition active:scale-[0.98]"
                >
                  Sepete ekle · {formatTL(urun.fiyatKurus)}
                </button>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1 rounded-full border bg-background px-1">
                    <button
                      type="button"
                      aria-label="Azalt"
                      onClick={() => guncelle(urun.id, adet - 1)}
                      className="rounded-full p-2 transition active:scale-90"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-6 text-center text-base font-medium tabular-nums">
                      {adet}
                    </span>
                    <button
                      type="button"
                      aria-label="Arttır"
                      onClick={() => guncelle(urun.id, adet + 1)}
                      className="rounded-full p-2 transition active:scale-90"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={kapat}
                    className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft transition active:scale-[0.98]"
                  >
                    Tamam · {formatTL(urun.fiyatKurus * adet)}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
