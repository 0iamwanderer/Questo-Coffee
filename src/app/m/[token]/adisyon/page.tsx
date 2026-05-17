import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getAdminDb } from '@/lib/firebase/admin';
import { formatTL } from '@/lib/utils/para';
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
    <main className="mx-auto max-w-md px-4 py-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/m/${token}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Menü
        </Link>
        <h1 className="text-lg font-semibold">Adisyon · {masaAd}</h1>
      </div>

      {yeni && (
        <div className="flex items-start gap-2 rounded-md border border-green-600/30 bg-green-50 p-3 text-sm dark:bg-green-950/30">
          <CheckCircle2 className="size-4 mt-0.5 text-green-700 dark:text-green-400" />
          <p>Siparişiniz alındı. Hazırlandığında haber vereceğiz.</p>
        </div>
      )}

      {adisyonSnap.empty ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Henüz açık adisyon yok.
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
    <div className="space-y-3">
      <ul className="space-y-3">
        {siparisler.map((s) => (
          <li key={s.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">#{s.gunlukNo}</span>
              <span className="rounded-md border px-2 py-0.5 text-xs">
                {DURUM_ETIKET[s.durum]}
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {(s.kalemler as SiparisKalemi[]).map((k, i) => (
                <li
                  key={`${k.urunId}-${i}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="min-w-0">
                    <span className="tabular-nums text-muted-foreground">
                      {k.adet}×
                    </span>{' '}
                    {k.ad}
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
            <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
              <span className="text-muted-foreground">Ara toplam</span>
              <span className="font-medium">{formatTL(s.toplamKurus)}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Toplam</span>
          <span className="text-lg font-semibold">
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
