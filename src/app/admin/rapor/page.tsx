import Link from 'next/link';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { formatTL } from '@/lib/utils/para';
import { istanbulGunId } from '@/lib/siparis/sayac';
import type { SiparisDurumu } from '@/types/model';
import { YazdirButton } from './yazdir-btn';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Istanbul saatine göre biçimleyiciler (belge başlığı + hızlı gün butonları)
const istFmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', ...opts });

// yyyy-mm-dd → o günü temsil eden Date (öğle, Istanbul) — biçimleme için güvenli
const gunDate = (yyyymmdd: string) => new Date(`${yyyymmdd}T12:00:00+03:00`);

const R = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new Error('NEXT_PUBLIC_RESTORAN_ID tanımlı değil.');
  return id;
};

interface Props {
  searchParams: Promise<{ tarih?: string }>;
}

interface KalemRapor {
  ad: string;
  adet: number;
  ciroKurus: number;
}

const tarihAraligi = (yyyymmdd: string) => {
  // Europe/Istanbul'da o günün başlangıcı ve bitişi → UTC Date
  // Basit yaklaşım: yerel saat olarak yorumla, +03:00 ekle (TR DST yok)
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  if (!y || !m || !d) throw new Error('Geçersiz tarih.');
  // 00:00 Istanbul = 21:00 UTC önceki gün
  const baslangic = new Date(Date.UTC(y, m - 1, d, -3, 0, 0));
  const bitis = new Date(Date.UTC(y, m - 1, d, 21, 0, 0));
  return { baslangic, bitis };
};

export default async function RaporSayfasi({ searchParams }: Props) {
  const { tarih } = await searchParams;
  const seciliTarih = tarih ?? istanbulGunId();
  const { baslangic, bitis } = tarihAraligi(seciliTarih);
  const db = getAdminDb();
  const restoranId = R();

  // Restoran meta — belge başlığı için ad/şehir
  const restoranSnap = await db.doc(`restoranlar/${restoranId}`).get();
  const restoranMeta = (restoranSnap.data() ?? {}) as {
    ad?: string;
    sehir?: string;
  };
  const restoranAd = restoranMeta.ad ?? 'Questo';

  // Son 7 gün (bugün dahil) — hızlı erişim butonları için
  const sonYediGun = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86_400_000);
    return istanbulGunId(d);
  });
  const bugunId = sonYediGun[0]!;

  // Bu gün açılan TÜM siparişleri çek (collectionGroup)
  const siparisSnap = await db
    .collectionGroup('siparisler')
    .where('olusturulduAt', '>=', Timestamp.fromDate(baslangic))
    .where('olusturulduAt', '<=', Timestamp.fromDate(bitis))
    .get();

  const ilgili = siparisSnap.docs.filter((d) =>
    d.ref.path.startsWith(`restoranlar/${restoranId}/`),
  );

  let toplamCiro = 0;
  let iptalCiro = 0;
  let teslimSayisi = 0;
  let iptalSayisi = 0;
  let toplamSiparisSayisi = 0;
  const kalemler = new Map<string, KalemRapor>();
  const saatDagilimi = new Array<number>(24).fill(0);

  for (const d of ilgili) {
    const s = d.data() as {
      durum: SiparisDurumu;
      toplamKurus: number;
      kalemler: Array<{ urunId: string; ad: string; adet: number; araToplamKurus: number }>;
      olusturulduAt: Timestamp;
    };
    toplamSiparisSayisi++;
    if (s.durum === 'iptal') {
      iptalSayisi++;
      iptalCiro += s.toplamKurus;
      continue;
    }
    toplamCiro += s.toplamKurus;
    if (s.durum === 'teslim') teslimSayisi++;

    for (const k of s.kalemler ?? []) {
      const mevcut = kalemler.get(k.urunId);
      if (mevcut) {
        mevcut.adet += k.adet;
        mevcut.ciroKurus += k.araToplamKurus;
      } else {
        kalemler.set(k.urunId, {
          ad: k.ad,
          adet: k.adet,
          ciroKurus: k.araToplamKurus,
        });
      }
    }

    // Istanbul saatine kabaca çevir (UTC + 3)
    const dt = s.olusturulduAt.toDate();
    const istSaat = (dt.getUTCHours() + 3) % 24;
    saatDagilimi[istSaat] = (saatDagilimi[istSaat] ?? 0) + 1;
  }

  const enCokSatan = [...kalemler.values()]
    .sort((a, b) => b.adet - a.adet)
    .slice(0, 10);

  const ortalamaBilet =
    teslimSayisi + (toplamSiparisSayisi - iptalSayisi - teslimSayisi) > 0
      ? toplamCiro /
        (toplamSiparisSayisi - iptalSayisi)
      : 0;

  const maxSaat = Math.max(...saatDagilimi, 1);

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6 rapor-belge">
      {/* Baskıya özel belge başlığı (ekranda gizli, PDF'te görünür) */}
      <div className="belge-baslik">
        <h1>{restoranAd} — Günlük Rapor</h1>
        <div className="belge-alt">
          {restoranMeta.sehir ? `${restoranMeta.sehir} · ` : ''}
          {istFmt({
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(gunDate(seciliTarih))}
          {' · '}
          Oluşturuldu: {istFmt({ dateStyle: 'short', timeStyle: 'short' }).format(new Date())}
        </div>
      </div>

      <div className="yazdir-gizle space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Günlük Rapor</h1>
          <div className="flex items-center gap-2">
            <YazdirButton />
            <form className="flex items-center gap-2">
              <input
                type="date"
                name="tarih"
                defaultValue={seciliTarih}
                className="rounded-md border bg-background px-2 py-1 text-sm"
              />
              <button
                type="submit"
                className="rounded-md border px-3 py-1 text-sm"
              >
                Göster
              </button>
            </form>
          </div>
        </div>

        {/* Son 7 gün — hızlı erişim */}
        <div className="flex flex-wrap gap-1.5">
          {sonYediGun.map((g, i) => {
            const secili = g === seciliTarih;
            const d = gunDate(g);
            const ustEtiket =
              g === bugunId
                ? 'Bugün'
                : i === 1
                  ? 'Dün'
                  : istFmt({ weekday: 'short' }).format(d);
            const altEtiket = istFmt({ day: '2-digit', month: '2-digit' }).format(d);
            return (
              <Link
                key={g}
                href={`/admin/rapor?tarih=${g}`}
                className={`flex min-w-16 flex-col items-center rounded-md border px-3 py-1.5 text-center text-xs transition ${
                  secili
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="font-medium capitalize">{ustEtiket}</span>
                <span className="tabular-nums opacity-80">{altEtiket}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kart etiket="Net ciro" deger={formatTL(toplamCiro)} />
        <Kart
          etiket="Sipariş sayısı"
          deger={`${toplamSiparisSayisi}`}
          alt={`${iptalSayisi} iptal`}
        />
        <Kart
          etiket="Teslim edilen"
          deger={`${teslimSayisi}`}
        />
        <Kart
          etiket="Ortalama bilet"
          deger={formatTL(Math.round(ortalamaBilet))}
        />
      </div>

      {iptalCiro > 0 && (
        <p className="text-xs text-muted-foreground">
          İptal edilen tutar: {formatTL(iptalCiro)} (cirodan düşüldü)
        </p>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-medium">En çok satan ürünler</h2>
          {enCokSatan.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              Bu tarihte sipariş yok.
            </p>
          ) : (
            <ul className="space-y-1">
              {enCokSatan.map((k) => (
                <li
                  key={k.ad}
                  className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">{k.ad}</span>
                  <span className="shrink-0 text-right">
                    <span className="tabular-nums font-medium">{k.adet}</span>
                    <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                      {formatTL(k.ciroKurus)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium">Saat dağılımı (sipariş)</h2>
          <div className="rounded-lg border bg-card p-3 space-y-1">
            {saatDagilimi.map((sayi, saat) => (
              <div key={saat} className="flex items-center gap-2 text-xs">
                <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
                  {saat.toString().padStart(2, '0')}
                </span>
                <div className="flex-1 h-3 rounded-sm bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(sayi / maxSaat) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 tabular-nums">{sayi}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="yazdir-gizle text-xs text-muted-foreground">
        <Link href="/admin/menu" className="underline">
          Menü
        </Link>
        {' · '}
        <Link href="/admin/masalar" className="underline">
          Masalar
        </Link>
      </p>

      {/* Baskıya özel dipnot (ekranda gizli) */}
      <div className="belge-dipnot">
        {restoranAd} · Bu belge {istFmt({ dateStyle: 'long', timeStyle: 'short' }).format(new Date())} tarihinde Questo tarafından oluşturulmuştur.
      </div>
    </div>
  );
}

function Kart({
  etiket,
  deger,
  alt,
}: {
  etiket: string;
  deger: string;
  alt?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{etiket}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{deger}</div>
      {alt && <div className="text-xs text-muted-foreground">{alt}</div>}
    </div>
  );
}
