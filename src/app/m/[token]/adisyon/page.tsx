import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getAdminDb } from '@/lib/firebase/admin';
import { formatTL } from '@/lib/utils/para';
import { AdisyonOtoYenile } from '@/components/musteri/adisyon-oto-yenile';
import { AdisyonYenile } from '@/components/musteri/adisyon-yenile';
import { AyriOdeme } from '@/components/musteri/ayri-odeme';
import type {
  Adisyon,
  Siparis,
  SiparisDurumu,
  SiparisKalemi,
} from '@/types/model';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DURUM_ETIKET: Record<SiparisDurumu, string> = {
  yeni: 'Alındı',
  hazirlaniyor: 'Hazırlanıyor',
  hazir: 'Hazır',
  teslim: 'Teslim edildi',
  iptal: 'İptal',
};

const DURUM_RENK: Record<SiparisDurumu, string> = {
  yeni: 'bg-accent text-accent-foreground',
  hazirlaniyor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  hazir: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  teslim: 'bg-muted text-muted-foreground',
  iptal: 'bg-destructive/10 text-destructive',
};

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ yeni?: string }>;
}

const R = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new Error('NEXT_PUBLIC_RESTORAN_ID tanımlı değil.');
  return id;
};

export default async function AdisyonSayfasi({ params, searchParams }: Props) {
  const { token } = await params;
  const { yeni } = await searchParams;
  const restoranId = R();
  const db = getAdminDb();

  const masaSnap = await db
    .collection(`restoranlar/${restoranId}/masalar`)
    .where('token', '==', token)
    .where('aktifMi', '==', true)
    .limit(1)
    .get();
  if (masaSnap.empty) notFound();
  const masa = masaSnap.docs[0]!;

  const adisyonSnap = await db
    .collection(`restoranlar/${restoranId}/adisyonlar`)
    .where('masaId', '==', masa.id)
    .where('durum', '==', 'acik')
    .limit(1)
    .get();

  const masaAd = (masa.data() as { ad: string }).ad;

  return (
    <main className="mx-auto max-w-md px-4 py-4 space-y-5 anim-fade-in">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/m/${token}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Menü
          </Link>
          {!adisyonSnap.empty && (
            <>
              <AdisyonOtoYenile adisyonId={adisyonSnap.docs[0]!.id} />
              <AdisyonYenile />
            </>
          )}
        </div>
        <div className="space-y-1">
          <p className="micro-caps text-muted-foreground">{masaAd}</p>
          <h1 className="font-serif text-4xl leading-none">Adisyon</h1>
        </div>
      </div>

      {yeni && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-600/30 bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
          <CheckCircle2 className="size-5 mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
          <p>Siparişiniz alındı. Hazırlandığında haber vereceğiz.</p>
        </div>
      )}

      {adisyonSnap.empty ? (
        <div className="rounded-2xl border bg-card p-10 text-center shadow-soft">
          <svg
            aria-hidden
            viewBox="0 0 120 100"
            className="mx-auto mb-4 h-24 w-28 text-primary/35"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Fiş kağıdı */}
            <path d="M30 14 L90 14 L90 78 L84 84 L78 78 L72 84 L66 78 L60 84 L54 78 L48 84 L42 78 L36 84 L30 78 Z" />
            <path d="M40 30 L80 30" opacity="0.5" />
            <path d="M40 42 L72 42" opacity="0.5" />
            <path d="M40 54 L76 54" opacity="0.5" />
            <path d="M40 66 L66 66" opacity="0.5" />
          </svg>
          <p className="font-serif text-2xl">Henüz açık adisyon yok</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Menüden ürün seçerek ilk siparişinizi verin.
          </p>
        </div>
      ) : (
        <AdisyonGosterici
          restoranId={restoranId}
          adisyonRefId={adisyonSnap.docs[0]!.id}
          adisyon={
            {
              id: adisyonSnap.docs[0]!.id,
              ...adisyonSnap.docs[0]!.data(),
            } as unknown as Adisyon
          }
        />
      )}
    </main>
  );
}

async function AdisyonGosterici({
  restoranId,
  adisyonRefId,
  adisyon,
}: {
  restoranId: string;
  adisyonRefId: string;
  adisyon: Adisyon;
}) {
  const db = getAdminDb();
  const aRef = db.collection(
    `restoranlar/${restoranId}/adisyonlar/${adisyonRefId}/siparisler`,
  );
  const [siparisSnap, talepSnap] = await Promise.all([
    aRef.orderBy('olusturulduAt', 'asc').get(),
    db
      .collection(
        `restoranlar/${restoranId}/adisyonlar/${adisyonRefId}/odemeTalepleri`,
      )
      .where('durum', '==', 'odendi')
      .get(),
  ]);

  const siparisler = siparisSnap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as unknown as Siparis,
  );

  const odenmisToplam = talepSnap.docs.reduce(
    (acc, d) => acc + (((d.data() as { toplamKurus?: number }).toplamKurus) ?? 0),
    0,
  );
  const kalanToplam = Math.max(0, (adisyon.toplamKurus as number) - odenmisToplam);
  const tamamenOdendi = kalanToplam === 0 && odenmisToplam > 0;

  // Ürün bazlı ödeme takibi
  const odenmisKalemMap = new Map<string, number>();
  for (const doc of talepSnap.docs) {
    const data = doc.data() as {
      yontem?: string;
      secilenKalemler?: Array<{ siparisId: string; ad: string; araToplamKurus: number }>;
    };
    if (data.yontem !== 'urun' || !data.secilenKalemler) continue;
    for (const k of data.secilenKalemler) {
      const kk = `${k.siparisId}||${k.ad}||${k.araToplamKurus}`;
      odenmisKalemMap.set(kk, (odenmisKalemMap.get(kk) ?? 0) + 1);
    }
  }
  const konsumMap = new Map(odenmisKalemMap);
  const siparisKalemDurum = new Map<string, boolean[]>();
  for (const s of siparisler) {
    const durumlar = (s.kalemler as SiparisKalemi[]).map((k) => {
      const kk = `${s.id}||${k.ad}||${k.araToplamKurus}`;
      const kalan = konsumMap.get(kk) ?? 0;
      if (kalan > 0) { konsumMap.set(kk, kalan - 1); return true; }
      return false;
    });
    siparisKalemDurum.set(s.id, durumlar);
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {siparisler.map((s, idx) => {
          const kdl = siparisKalemDurum.get(s.id) ?? [];
          const odenmisAlt = (s.kalemler as SiparisKalemi[]).reduce(
            (acc, k, i) => acc + (kdl[i] ? (k.araToplamKurus as number) : 0),
            0,
          );
          const kalanAlt = (s.toplamKurus as number) - odenmisAlt;
          return (
            <li
              key={s.id}
              className="anim-rise rounded-2xl border bg-card p-4 shadow-soft"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">#{s.gunlukNo}</span>
                  {s.musteriAd && (
                    <span className="font-semibold">{s.musteriAd}</span>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${DURUM_RENK[s.durum]}`}
                >
                  {DURUM_ETIKET[s.durum]}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {(s.kalemler as SiparisKalemi[]).map((k, i) => (
                  <li
                    key={`${k.urunId}-${i}`}
                    className={`flex items-start justify-between gap-2 ${kdl[i] ? 'opacity-40' : ''}`}
                  >
                    <span className={`min-w-0 ${kdl[i] ? 'line-through' : ''}`}>
                      <span className="tabular-nums text-muted-foreground">
                        {k.adet}×
                      </span>{' '}
                      {k.ad}
                      {k.secimler && k.secimler.length > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          {k.secimler
                            .map(
                              (sec) =>
                                `${sec.grupAd}: ${sec.secenekler
                                  .map((s) => s.ad)
                                  .join(', ')}`,
                            )
                            .join(' · ')}
                        </span>
                      )}
                      {k.notlar && (
                        <span className="block text-xs text-muted-foreground">
                          Not: {k.notlar}
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 tabular-nums ${kdl[i] ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {formatTL(k.araToplamKurus)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t pt-2 space-y-0.5 text-sm">
                {odenmisAlt > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                    <span>Ödenen</span>
                    <span className="tabular-nums">−{formatTL(odenmisAlt)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {odenmisAlt > 0 ? 'Kalan' : 'Ara toplam'}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatTL(odenmisAlt > 0 ? kalanAlt : s.toplamKurus)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl border bg-card p-4 shadow-soft">
        {odenmisToplam > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Toplam</span>
              <span className="tabular-nums">{formatTL(adisyon.toplamKurus)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-emerald-700 dark:text-emerald-400">
              <span>Ödenen</span>
              <span className="tabular-nums">−{formatTL(odenmisToplam)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm text-muted-foreground">Kalan</span>
              <span className="font-serif text-3xl tabular-nums">
                {formatTL(kalanToplam)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Toplam</span>
            <span className="font-serif text-3xl">
              {formatTL(adisyon.toplamKurus)}
            </span>
          </div>
        )}
        {tamamenOdendi ? (
          <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Tüm ödemeler tamamlandı.
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Ödeme kasada yapılır.
          </p>
        )}
      </div>

      {!tamamenOdendi && (
        <AyriOdeme
          adisyonId={adisyonRefId}
          toplamKurus={kalanToplam || (adisyon.toplamKurus as number)}
          siparisler={siparisler
            .map((s) => {
              const kdl = siparisKalemDurum.get(s.id) ?? [];
              return {
                id: s.id,
                gunlukNo: s.gunlukNo,
                durum: s.durum,
                musteriAd: s.musteriAd,
                kalemler: (s.kalemler as SiparisKalemi[])
                  .filter((_, i) => !kdl[i])
                  .map((k) => ({
                    ad: k.ad,
                    adet: k.adet,
                    araToplamKurus: k.araToplamKurus as number,
                    urunId: k.urunId,
                  })),
              };
            })
            .filter((s) => s.kalemler.length > 0)}
        />
      )}
    </div>
  );
}
