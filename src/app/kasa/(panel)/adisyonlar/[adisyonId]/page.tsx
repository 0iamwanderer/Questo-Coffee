import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getAdminDb } from '@/lib/firebase/admin';
import { formatTL } from '@/lib/utils/para';
import type {
  Adisyon,
  Siparis,
  SiparisDurumu,
  SiparisKalemi,
} from '@/types/model';
import { AdisyonuKapatBtn } from './kapat-btn';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DURUM_ETIKET: Record<SiparisDurumu, string> = {
  yeni: 'Alındı',
  hazirlaniyor: 'Hazırlanıyor',
  hazir: 'Hazır',
  teslim: 'Teslim edildi',
  iptal: 'İptal',
};

const R = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new Error('NEXT_PUBLIC_RESTORAN_ID tanımlı değil.');
  return id;
};

export default async function AdisyonDetay({
  params,
}: {
  params: Promise<{ adisyonId: string }>;
}) {
  const { adisyonId } = await params;
  const db = getAdminDb();
  const restoranId = R();

  const aRef = db.doc(`restoranlar/${restoranId}/adisyonlar/${adisyonId}`);
  const aSnap = await aRef.get();
  if (!aSnap.exists) notFound();
  const adisyon = { id: aSnap.id, ...aSnap.data() } as unknown as Adisyon;

  const [masaSnap, siparisSnap] = await Promise.all([
    db.doc(`restoranlar/${restoranId}/masalar/${adisyon.masaId}`).get(),
    aRef.collection('siparisler').orderBy('olusturulduAt', 'asc').get(),
  ]);

  const masaAd = masaSnap.exists
    ? (masaSnap.data() as { ad: string }).ad
    : 'Bilinmeyen masa';

  const siparisler = siparisSnap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as unknown as Siparis,
  );

  const acik = adisyon.durum === 'acik';

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <Link
        href="/kasa/adisyonlar"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Adisyonlar
      </Link>

      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{masaAd}</h1>
          <p className="text-sm text-muted-foreground">
            {adisyon.siparisSayisi} sipariş · {acik ? 'Açık' : 'Kapalı'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Toplam</p>
          <p className="text-2xl font-semibold">
            {formatTL(adisyon.toplamKurus)}
          </p>
        </div>
      </div>

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
                  className="flex items-start justify-between gap-2"
                >
                  <span className="min-w-0">
                    <span className="tabular-nums text-muted-foreground">
                      {k.adet}×
                    </span>{' '}
                    {k.ad}
                    {k.secimler && k.secimler.length > 0 && (
                      <span className="block text-xs text-foreground/80">
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
                  <span className="shrink-0 tabular-nums text-xs">
                    {formatTL(k.araToplamKurus)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t pt-2 text-sm">
              <span className="text-muted-foreground">Ara toplam</span>
              <span className="font-medium">{formatTL(s.toplamKurus)}</span>
            </div>
          </li>
        ))}
      </ul>

      {acik && <AdisyonuKapatBtn adisyonId={adisyonId} />}
    </div>
  );
}
