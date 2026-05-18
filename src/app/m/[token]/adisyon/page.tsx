import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getAdminDb } from '@/lib/firebase/admin';
import { formatTL } from '@/lib/utils/para';
import { AdisyonYenile } from '@/components/musteri/adisyon-yenile';
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
          {!adisyonSnap.empty && <AdisyonYenile />}
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
  const siparisSnap = await db
    .collection(
      `restoranlar/${restoranId}/adisyonlar/${adisyonRefId}/siparisler`,
    )
    .orderBy('olusturulduAt', 'asc')
    .get();

  const siparisler = siparisSnap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as unknown as Siparis,
  );

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {siparisler.map((s, i) => (
          <li
            key={s.id}
            className="anim-rise rounded-2xl border bg-card p-4 shadow-soft"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium tabular-nums">#{s.gunlukNo}</span>
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
                  className="flex items-start justify-between gap-2"
                >
                  <span className="min-w-0">
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
                  <span className="shrink-0 tabular-nums">
                    {formatTL(k.araToplamKurus)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t pt-2 text-sm">
              <span className="text-muted-foreground">Ara toplam</span>
              <span className="font-medium tabular-nums">
                {formatTL(s.toplamKurus)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Toplam</span>
          <span className="font-serif text-3xl">
            {formatTL(adisyon.toplamKurus)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Ödeme kasada yapılır.
        </p>
      </div>
    </div>
  );
}
