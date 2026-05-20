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
  OdemeTalebi,
} from '@/types/model';
import { AdisyonuKapatBtn } from './kapat-btn';
import { OdemeTalepleri } from '@/components/kasa/odeme-talepleri';
import { KasiyerBolme } from '@/components/kasa/kasiyer-bolme';

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

  const [masaSnap, siparisSnap, talepSnap] = await Promise.all([
    db.doc(`restoranlar/${restoranId}/masalar/${adisyon.masaId}`).get(),
    aRef.collection('siparisler').orderBy('olusturulduAt', 'asc').get(),
    aRef.collection('odemeTalepleri').orderBy('olusturulduAt', 'asc').get(),
  ]);

  const masaAd = masaSnap.exists
    ? (masaSnap.data() as { ad: string }).ad
    : 'Bilinmeyen masa';

  const siparisler = siparisSnap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as unknown as Siparis,
  );

  const talepler = talepSnap.docs.map((d) => {
    const data = d.data() as Omit<OdemeTalebi, 'id' | 'olusturulduAt'> & {
      olusturulduAt?: { toMillis?: () => number };
    };
    return {
      id: d.id,
      yontem: data.yontem,
      toplamKurus: data.toplamKurus as number,
      kisiSayisi: data.kisiSayisi,
      kisiPayi: data.kisiPayi as number | undefined,
      secilenKalemler: data.secilenKalemler?.map((k) => ({
        siparisId: k.siparisId,
        siparisNo: k.siparisNo,
        ad: k.ad,
        adet: k.adet,
        araToplamKurus: k.araToplamKurus as number,
      })),
      durum: data.durum,
      musteriAd: data.musteriAd,
      kaynak: data.kaynak,
    };
  });

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
              <div className="flex items-center gap-1.5">
                <span className="font-medium">#{s.gunlukNo}</span>
                {s.musteriAd && (
                  <span className="text-xs text-muted-foreground">
                    · {s.musteriAd}
                  </span>
                )}
              </div>
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

      {acik && (
        <KasiyerBolme
          adisyonId={adisyonId}
          toplamKurus={adisyon.toplamKurus as number}
          siparisler={siparisler.map((s) => ({
            id: s.id,
            gunlukNo: s.gunlukNo,
            durum: s.durum,
            musteriAd: s.musteriAd,
            toplamKurus: s.toplamKurus as number,
            kalemler: (s.kalemler as SiparisKalemi[]).map((k) => ({
              ad: k.ad,
              adet: k.adet,
              araToplamKurus: k.araToplamKurus as number,
            })),
          }))}
        />
      )}

      <OdemeTalepleri adisyonId={adisyonId} talepler={talepler} />

      {acik && <AdisyonuKapatBtn adisyonId={adisyonId} />}
    </div>
  );
}
